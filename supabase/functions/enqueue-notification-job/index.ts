import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildFunctionContext,
  consumeRateLimit,
  jsonResponse,
  readJsonBody,
  sha256Hex,
} from '../_shared/security.ts';

type EnqueueNotificationJobBody = {
  userId?: string;
  jobType?: string;
  payload?: Record<string, unknown>;
  scheduledFor?: string;
  idempotencyKey?: string;
};

const CLIENT_JOB_TYPES = new Set([
  'streak_reminder',
  'streak_achievement',
  'streak_recovery',
  'challenge_start',
  'challenge_complete',
  'challenge_expiring',
  'challenge_expired',
  'review_reminder',
  'verification_pending',
  'verification_approved',
  'verification_rejected',
  'group_activity',
  'group_streak_warning',
  'group_milestone',
  'daily_inspiration',
  'low_activity',
  'badge_unlocked',
  'momenta_reward',
  'app_update',
  'maintenance',
]);

function parseScheduledFor(input?: string): string | null {
  const now = Date.now();
  const parsed = input ? new Date(input) : new Date(now);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() < now - 5 * 60 * 1000) return null;
  if (parsed.getTime() > now + 7 * 24 * 60 * 60 * 1000) return null;
  return parsed.toISOString();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const context = await buildFunctionContext(req);

    if (!context.user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const body = await readJsonBody<EnqueueNotificationJobBody>(req);
    if (!body) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const jobType = body.jobType?.trim();
    if (!jobType || !CLIENT_JOB_TYPES.has(jobType)) {
      return jsonResponse({ error: 'jobType is invalid' }, 400);
    }

    const targetUserId = body.userId?.trim() || context.user.id;
    if (targetUserId !== context.user.id) {
      return jsonResponse(
        { error: 'Cross-user notification enqueue is forbidden' },
        403
      );
    }

    const rateLimit = await consumeRateLimit(
      context.serviceClient,
      'enqueue-notification-job',
      context.user.id,
      30,
      60
    );
    if (!rateLimit.allowed) {
      return jsonResponse(
        {
          error: 'Too many notification requests',
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        429
      );
    }

    const payload = body.payload ?? {};
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > 8000) {
      return jsonResponse({ error: 'payload is too large' }, 413);
    }

    const scheduledFor = parseScheduledFor(body.scheduledFor);
    if (!scheduledFor) {
      return jsonResponse(
        { error: 'scheduledFor is outside the allowed window' },
        400
      );
    }
    const notificationIdCandidate = payload.notificationId;
    let notificationId: number | null = null;

    if (
      typeof notificationIdCandidate === 'number' &&
      Number.isInteger(notificationIdCandidate)
    ) {
      const { data: notificationRow, error: notificationError } =
        await context.serviceClient
          .from('notifications')
          .select('id, notification_type')
          .eq('id', notificationIdCandidate)
          .eq('user_id', targetUserId)
          .maybeSingle();

      if (notificationError) {
        console.error(
          '[enqueue-notification-job] notification lookup error:',
          notificationError
        );
        return jsonResponse({ error: 'Failed to validate notification' }, 500);
      }

      if (!notificationRow || notificationRow.notification_type !== jobType) {
        return jsonResponse({ error: 'notificationId is invalid' }, 400);
      }

      notificationId = notificationIdCandidate;
    } else {
      return jsonResponse({ error: 'notificationId is required' }, 400);
    }

    const suppliedKey = body.idempotencyKey?.trim();
    if (suppliedKey && suppliedKey.length > 200) {
      return jsonResponse({ error: 'idempotencyKey is too long' }, 400);
    }
    const digest = await sha256Hex(
      suppliedKey || `${jobType}:${scheduledFor}:${payloadString}`
    );
    const idempotencyKey = `client-notification:${targetUserId}:${digest}`;

    const { count: outstandingCount, error: countError } =
      await context.serviceClient
        .from('notification_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .in('status', ['pending', 'processing']);
    if (countError) {
      console.error('[enqueue-notification-job] quota read error:', countError);
      return jsonResponse({ error: 'Failed to check notification quota' }, 500);
    }
    if ((outstandingCount ?? 0) >= 50) {
      return jsonResponse({ error: 'Notification queue limit reached' }, 429);
    }

    const { data, error } = await context.serviceClient
      .from('notification_jobs')
      .insert({
        user_id: targetUserId,
        job_type: jobType,
        payload,
        scheduled_for: scheduledFor,
        idempotency_key: idempotencyKey,
        status: 'pending',
        notification_id: notificationId,
      })
      .select('id, user_id, job_type, scheduled_for, status')
      .single();

    if (error) {
      // 23505 => idempotency replay, return existing row as success.
      if (error.code === '23505') {
        const { data: existing, error: existingError } =
          await context.serviceClient
            .from('notification_jobs')
            .select('id, user_id, job_type, scheduled_for, status')
            .eq('idempotency_key', idempotencyKey)
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (!existingError && existing) {
          return jsonResponse({
            success: true,
            deduplicated: true,
            job: existing,
          });
        }

        if (notificationId !== null) {
          const { data: notificationJob, error: notificationJobError } =
            await context.serviceClient
              .from('notification_jobs')
              .select('id, user_id, job_type, scheduled_for, status')
              .eq('notification_id', notificationId)
              .maybeSingle();

          if (!notificationJobError && notificationJob) {
            return jsonResponse({
              success: true,
              deduplicated: true,
              job: notificationJob,
            });
          }
        }
      }

      console.error('[enqueue-notification-job] insert error:', error);
      return jsonResponse({ error: 'Failed to enqueue notification job' }, 500);
    }

    return jsonResponse({ success: true, deduplicated: false, job: data });
  } catch (error) {
    console.error('[enqueue-notification-job] fatal error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
