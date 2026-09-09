import { createClient } from 'npm:@supabase/supabase-js@2.109.0';
import {
  reminderKindToCoachKind,
  renderCoachCopy,
} from '../_shared/coach-copy.ts';
import {
  buildReviewReminderDigests,
  type ReviewReminderRow,
} from './review-digest.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const rejectUnauthorisedMaintenance = (req: Request): Response | null => {
  const expected = Deno.env.get('DAILY_MAINTENANCE_SECRET')?.trim() ?? '';
  const provided = req.headers.get('x-maintenance-secret')?.trim() ?? '';

  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return null;
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface ChallengeExpirationData {
  challenge_id: string;
  title: string;
  user_id: string;
  username: string;
  hours_until_expiry: number;
  current_streak: number;
}

interface SubmitReminderData {
  user_id: string;
  username: string;
  challenge_id: string;
  challenge_title: string;
  reminder_kind?: 'primary' | 'rescue';
  idempotency_key?: string;
  local_day?: string;
  streak_length?: number;
  hours_remaining?: number;
  freeze_remaining?: number;
  proof_due_label?: string;
  open_promise_count?: number;
}

async function enqueueNotification(row: {
  user_id: string;
  notification_type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  priority?: number;
  scheduled_for?: string;
  idempotency_key?: string;
}): Promise<boolean> {
  const scheduledFor = row.scheduled_for ?? new Date().toISOString();
  const idempotencyKey =
    row.idempotency_key ??
    `notif:${row.user_id}:${row.notification_type}:${scheduledFor}`;

  // Insert the job first so idempotency is enforced before creating a notification row.
  const { data: insertedJob, error: jobError } = await supabase
    .from('notification_jobs')
    .insert({
      user_id: row.user_id,
      job_type: row.notification_type,
      payload: {
        title: row.title,
        body: row.body,
        data: row.payload ?? {},
        metadata: row.metadata ?? {},
        priority: row.priority ?? 3,
      },
      scheduled_for: scheduledFor,
      idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();

  if (jobError) {
    if ((jobError as { code?: string }).code === '23505') {
      return false;
    }
    throw jobError;
  }

  const { data: insertedNotification, error: notificationError } =
    await supabase
      .from('notifications')
      .insert({
        user_id: row.user_id,
        notification_type: row.notification_type,
        title: row.title,
        body: row.body,
        payload: row.payload ?? {},
        metadata: row.metadata ?? {},
        priority: row.priority ?? 3,
        scheduled_for: scheduledFor,
      })
      .select('id')
      .single();

  if (notificationError) {
    await supabase
      .from('notification_jobs')
      .update({
        status: 'failed',
        last_error: notificationError.message,
      })
      .eq('id', insertedJob.id);
    throw notificationError;
  }

  const notificationId = insertedNotification?.id;

  await supabase
    .from('notification_jobs')
    .update({
      notification_id: notificationId,
      payload: {
        notificationId,
        title: row.title,
        body: row.body,
        data: row.payload ?? {},
        metadata: row.metadata ?? {},
        priority: row.priority ?? 3,
      },
    })
    .eq('id', insertedJob.id);

  return true;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authenticationError = rejectUnauthorisedMaintenance(req);
  if (authenticationError) return authenticationError;

  try {
    const results = {
      expiring_challenges: 0,
      expired_challenges: 0,
      review_reminders: 0,
      submit_reminders: 0,
      errors: [] as string[],
    };

    const { data: expiringChallenges, error: expiringError } =
      await supabase.rpc('get_challenges_expiring_soon');

    if (expiringError) {
      results.errors.push(`expiring: ${expiringError.message}`);
    } else {
      for (const challenge of (expiringChallenges ||
        []) as ChallengeExpirationData[]) {
        try {
          const enqueued = await enqueueNotification({
            user_id: challenge.user_id,
            notification_type: 'challenge_expiring',
            title: 'Your promise is ending soon',
            body: `"${challenge.title}" ends in ${challenge.hours_until_expiry} ${challenge.hours_until_expiry === 1 ? 'hour' : 'hours'}. Send proof before it ends.`,
            payload: {
              type: 'challenge_expiring',
              challengeId: challenge.challenge_id,
              hoursRemaining: challenge.hours_until_expiry,
              action: 'open_challenge',
              actionRequired: true,
            },
            metadata: {
              challengeTitle: challenge.title,
              timeUnit: challenge.hours_until_expiry === 1 ? 'hour' : 'hours',
            },
            priority: 2,
            idempotency_key: `challenge-expiring:${challenge.user_id}:${challenge.challenge_id}:${new Date().toISOString().slice(0, 10)}`,
          });
          if (enqueued) results.expiring_challenges += 1;
        } catch (insertErr) {
          results.errors.push(
            `enqueue expiring ${challenge.challenge_id}: ${String(insertErr)}`
          );
        }
      }
    }

    const { data: expiredChallenges, error: expiredError } = await supabase.rpc(
      'get_recently_expired_challenges'
    );

    if (expiredError) {
      results.errors.push(`expired: ${expiredError.message}`);
    } else {
      for (const challenge of (expiredChallenges ||
        []) as ChallengeExpirationData[]) {
        try {
          const enqueued = await enqueueNotification({
            user_id: challenge.user_id,
            notification_type: 'challenge_expired',
            title: 'Your promise has ended',
            body:
              challenge.current_streak > 0
                ? `"${challenge.title}" ended. Your last streak was ${challenge.current_streak} ${challenge.current_streak === 1 ? 'day' : 'days'}.`
                : `"${challenge.title}" ended.`,
            payload: {
              type: 'challenge_expired',
              challengeId: challenge.challenge_id,
              streakLost: challenge.current_streak,
              action: 'open_challenge',
            },
            metadata: {
              challengeTitle: challenge.title,
            },
            priority: 1,
            idempotency_key: `challenge-expired:${challenge.user_id}:${challenge.challenge_id}`,
          });
          if (enqueued) results.expired_challenges += 1;
        } catch (insertErr) {
          results.errors.push(
            `enqueue expired ${challenge.challenge_id}: ${String(insertErr)}`
          );
        }
      }
    }

    const { data: pendingReviews, error: reviewError } = await supabase.rpc(
      'get_pending_review_reminders'
    );

    if (reviewError) {
      results.errors.push(`reviews: ${reviewError.message}`);
    } else {
      const reviewDigests = buildReviewReminderDigests(
        (pendingReviews || []) as ReviewReminderRow[]
      );
      for (const digest of reviewDigests) {
        try {
          const enqueued = await enqueueNotification({
            user_id: digest.reviewerId,
            notification_type: 'review_reminder',
            title:
              digest.pendingCount === 1
                ? 'A proof needs your review'
                : `${digest.pendingCount} proofs need your review`,
            body:
              digest.pendingCount === 1
                ? 'Open Menta when you are ready to review it.'
                : 'Open Menta when you are ready to review them.',
            payload: {
              type: 'review_reminder',
              action: 'open_review_queue',
              pendingReviews: digest.pendingCount,
              actionRequired: true,
            },
            metadata: {
              pendingReviews: digest.pendingCount,
            },
            priority: 2,
            idempotency_key: `review-digest:${digest.reviewerId}:${new Date().toISOString().slice(0, 10)}`,
          });
          if (enqueued) {
            results.review_reminders += 1;
          }
        } catch (insertErr) {
          results.errors.push(
            `enqueue review digest ${digest.reviewerId}: ${String(insertErr)}`
          );
        }
      }
    }

    const { data: submitDue, error: submitDueError } = await supabase.rpc(
      'get_coach_messages_due'
    );
    if (submitDueError) {
      results.errors.push(`submit reminders: ${submitDueError.message}`);
    } else {
      for (const row of (submitDue || []) as SubmitReminderData[]) {
        try {
          const reminderKind = row.reminder_kind ?? 'primary';
          const isRescue = reminderKind === 'rescue';
          const copy = renderCoachCopy({
            userId: row.user_id,
            localDay: row.local_day ?? new Date().toISOString().slice(0, 10),
            kind: reminderKindToCoachKind(reminderKind),
            tokens: {
              promise_label: row.challenge_title,
              streak_length: row.streak_length ?? 0,
              hours_remaining: row.hours_remaining ?? 0,
              freeze_remaining: row.freeze_remaining ?? 0,
              proof_due_label: row.proof_due_label ?? '8:00 PM',
              open_promise_count: row.open_promise_count ?? 1,
            },
          });
          const enqueued = await enqueueNotification({
            user_id: row.user_id,
            notification_type: 'streak_reminder',
            title: copy.title,
            body: copy.body,
            payload: {
              type: 'streak_reminder',
              challengeId: row.challenge_id,
              reminderKind,
              localDay: row.local_day ?? null,
              action: 'open_challenge',
              actionRequired: true,
            },
            metadata: {
              challengeTitle: row.challenge_title,
              reminderKind,
              catalogVersion: copy.catalogVersion,
              variantIndex: copy.variantIndex,
            },
            priority: isRescue ? 2 : 3,
            idempotency_key: row.idempotency_key,
          });
          if (enqueued) {
            results.submit_reminders += 1;
          }
        } catch (insertErr) {
          results.errors.push(
            `enqueue submit reminder ${row.user_id}:${row.challenge_id}: ${String(insertErr)}`
          );
        }
      }
    }

    const totalNotifications =
      results.expiring_challenges +
      results.expired_challenges +
      results.review_reminders +
      results.submit_reminders;

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        notifications_sent: totalNotifications,
        ...results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
