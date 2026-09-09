import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-maintenance-secret',
};

const streakMaintenancePageSize = 50;

interface StreakMaintenanceCandidate {
  user_id: string;
  challenge_id: string;
}

interface StreakMaintenanceReceipt {
  success?: boolean;
  resolvedCount?: number;
  missedCount?: number;
  protectedCount?: number;
  atRisk?: boolean;
  anchored?: boolean;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const maintenanceSecret = Deno.env.get('DAILY_MAINTENANCE_SECRET') ?? '';
  const providedSecret = req.headers.get('x-maintenance-secret')?.trim() ?? '';
  if (!maintenanceSecret || providedSecret !== maintenanceSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const requestAuthHeader = req.headers.get('authorization');
  const internalAuthHeader =
    requestAuthHeader && requestAuthHeader.startsWith('Bearer ')
      ? requestAuthHeader
      : `Bearer ${serviceRoleKey}`;
  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  const startedAt = Date.now();

  try {
    const results: Record<string, unknown> = {
      streakResets: null,
      groupFailures: null,
      groupStreakWarnings: null,
      missedStreakNotifications: null,
      challengeNotifications: null,
      notificationProcessor: null,
      errors: [] as string[],
    };

    const streakSummary = {
      success: true,
      pages: 0,
      processed: 0,
      failed: 0,
      resolved: 0,
      missed: 0,
      protected: 0,
      atRisk: 0,
      anchored: 0,
    };
    let afterUserId: string | null = null;
    let afterChallengeId: string | null = null;

    while (true) {
      const { data: candidateData, error: candidateError } =
        await supabaseClient.rpc('list_streak_maintenance_candidates', {
          p_after_user_id: afterUserId,
          p_after_challenge_id: afterChallengeId,
          p_limit: streakMaintenancePageSize,
        });

      if (candidateError) {
        streakSummary.success = false;
        (results.errors as string[]).push(
          `list_streak_maintenance_candidates: ${candidateError.message}`
        );
        break;
      }

      const candidates = (candidateData ?? []) as StreakMaintenanceCandidate[];
      if (candidates.length === 0) break;
      streakSummary.pages += 1;

      for (const candidate of candidates) {
        const { data: receiptData, error: maintenanceError } =
          await supabaseClient.rpc('maintain_streak_participant', {
            p_user_id: candidate.user_id,
            p_challenge_id: candidate.challenge_id,
          });

        streakSummary.processed += 1;
        if (maintenanceError) {
          streakSummary.success = false;
          streakSummary.failed += 1;
          (results.errors as string[]).push(
            `maintain_streak_participant(${candidate.user_id},${candidate.challenge_id}): ${maintenanceError.message}`
          );
          continue;
        }

        const receipt = (receiptData ?? {}) as StreakMaintenanceReceipt;
        if (receipt.success !== true) {
          streakSummary.success = false;
          streakSummary.failed += 1;
          (results.errors as string[]).push(
            `maintain_streak_participant(${candidate.user_id},${candidate.challenge_id}): ${receipt.error ?? 'UNKNOWN'}`
          );
          continue;
        }

        streakSummary.resolved += receipt.resolvedCount ?? 0;
        streakSummary.missed += receipt.missedCount ?? 0;
        streakSummary.protected += receipt.protectedCount ?? 0;
        if (receipt.atRisk === true) streakSummary.atRisk += 1;
        if (receipt.anchored === true) streakSummary.anchored += 1;
      }

      const lastCandidate = candidates[candidates.length - 1];
      afterUserId = lastCandidate.user_id;
      afterChallengeId = lastCandidate.challenge_id;
      if (candidates.length < streakMaintenancePageSize) break;
    }

    results.streakResets = streakSummary;

    const { data: groupFailures, error: groupError } = await supabaseClient.rpc(
      'process_group_failures_enhanced'
    );
    if (groupError) {
      (results.errors as string[]).push(
        `process_group_failures_enhanced: ${groupError.message}`
      );
      results.groupFailures = { success: false, error: groupError.message };
    } else {
      results.groupFailures = { success: true, data: groupFailures };
    }

    const { data: warnings, error: warnErr } = await supabaseClient.rpc(
      'notify_group_streak_warning'
    );
    if (warnErr) {
      (results.errors as string[]).push(
        `notify_group_streak_warning: ${warnErr.message}`
      );
      results.groupStreakWarnings = { success: false, error: warnErr.message };
    } else {
      results.groupStreakWarnings = { success: true, data: warnings };
    }

    const { data: missedStreakNotifications, error: missedErr } =
      await supabaseClient.rpc('notify_group_member_missed_streak');
    if (missedErr) {
      (results.errors as string[]).push(
        `notify_group_member_missed_streak: ${missedErr.message}`
      );
      results.missedStreakNotifications = {
        success: false,
        error: missedErr.message,
      };
    } else {
      results.missedStreakNotifications = {
        success: true,
        data: missedStreakNotifications,
      };
    }

    try {
      const schedulerResponse = await fetch(
        `${supabaseUrl}/functions/v1/challenge-notification-scheduler`,
        {
          method: 'POST',
          headers: {
            Authorization: internalAuthHeader,
            'x-maintenance-secret': maintenanceSecret,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (schedulerResponse.ok) {
        const schedulerData = await schedulerResponse.json();
        results.challengeNotifications = { success: true, data: schedulerData };
      } else {
        const errorText = await schedulerResponse.text();
        (results.errors as string[]).push(
          `challenge-notification-scheduler: HTTP ${schedulerResponse.status}: ${errorText}`
        );
        results.challengeNotifications = {
          success: false,
          error: `HTTP ${schedulerResponse.status}: ${errorText}`,
        };
      }
    } catch (schedulerError) {
      const errorMessage = String(schedulerError);
      (results.errors as string[]).push(
        `challenge-notification-scheduler: ${errorMessage}`
      );
      results.challengeNotifications = { success: false, error: errorMessage };
    }

    try {
      const notificationResponse = await fetch(
        `${supabaseUrl}/functions/v1/notification-processor?batch=200`,
        {
          method: 'GET',
          headers: {
            Authorization: internalAuthHeader,
            'x-maintenance-secret': maintenanceSecret,
          },
        }
      );

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        results.notificationProcessor = {
          success: true,
          data: notificationData,
        };
      } else {
        const errorText = await notificationResponse.text();
        (results.errors as string[]).push(
          `notification-processor: HTTP ${notificationResponse.status}: ${errorText}`
        );
        results.notificationProcessor = {
          success: false,
          error: `HTTP ${notificationResponse.status}: ${errorText}`,
        };
      }
    } catch (notificationError) {
      const errorMessage = String(notificationError);
      (results.errors as string[]).push(
        `notification-processor: ${errorMessage}`
      );
      results.notificationProcessor = { success: false, error: errorMessage };
    }

    const success = (results.errors as string[]).length === 0;
    const durationMs = Date.now() - startedAt;

    await supabaseClient.from('maintenance_runs').insert({
      status: success ? 'success' : 'error',
      details: {
        ...results,
        durationMs,
      },
    });

    return new Response(
      JSON.stringify({
        success,
        message: success
          ? 'Daily maintenance completed successfully'
          : 'Daily maintenance completed with errors',
        summary: {
          duration_ms: durationMs,
          error_count: (results.errors as string[]).length,
        },
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = String(error);

    await supabaseClient.from('maintenance_runs').insert({
      status: 'error',
      details: {
        fatal_error: errorMessage,
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Daily maintenance failed',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
