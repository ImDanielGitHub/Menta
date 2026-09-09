/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, import/extensions, import/no-unresolved */
// deno-lint-ignore-file no-explicit-any
// @ts-nocheck

import { createClient } from 'npm:@supabase/supabase-js@2.109.0';
import {
  parseNotificationDeliveryPolicy,
  resolveNotificationDeliveryProvider,
  type NotificationDeliveryPolicy,
  type RemoteNotificationProvider,
} from './providers.ts';
import {
  buildOneSignalDataPayload,
  buildOneSignalRequest,
  createOneSignalIdempotencyKey,
  isValidOneSignalAppId,
  parseOneSignalSendResponse,
} from './onesignal-sender.ts';
import {
  evaluateDeliveryGuard,
  type DeliveryPreference,
} from './delivery-guard.ts';
import { sendWithOneSignalCompatibilityFallback } from './delivery-router.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

declare const Deno: any;

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

interface NotificationRecord {
  job_id: number;
  id: number;
  user_id: string;
  notification_type: string | null;
  title: string | null;
  body: string | null;
  payload?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  priority?: number | null;
  delivery_attempts?: number | null;
  push_platform?: 'ios' | 'android' | null;
}

interface AcceptedExpoNotification {
  id: number;
  provider_message_id: string;
  provider_token_fingerprint: string | null;
  user_id: string;
}

type ProviderSendResult =
  | {
      kind: 'accepted';
      providerMessageId: string;
      tokenFingerprint?: string;
    }
  | {
      kind: 'skipped';
      reason: string;
    }
  | {
      kind: 'retired';
      reason: 'DeviceNotRegistered';
      token: string;
    }
  | {
      kind: 'no-valid-subscription';
      reason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION';
    };

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function fingerprintToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getAndroidChannelId(record: NotificationRecord): string {
  const explicitChannel =
    record.payload?.channelId || record.metadata?.channelId;
  if (typeof explicitChannel === 'string' && explicitChannel.length > 0) {
    return explicitChannel;
  }

  switch (record.notification_type) {
    case 'streak_reminder':
    case 'missed_streak':
    case 'challenge_expiring':
    case 'challenge_expired':
      return 'reminders';
    case 'group_activity':
    case 'group_milestone':
      return 'group_activity';
    case 'review_reminder':
    case 'verification_pending':
    case 'verification_approved':
    case 'verification_rejected':
      return 'verification_updates';
    case 'streak_achievement':
    case 'streak_recovery':
    case 'badge_unlocked':
    case 'challenge_complete':
      return 'achievements';
    default:
      return 'default';
  }
}

function getExpoPriority(record: NotificationRecord): 'default' | 'high' {
  return (record.priority ?? 3) <= 3 ? 'high' : 'default';
}

function assertMutation(
  error: { message?: string } | null,
  action: string
): void {
  if (error) {
    throw new Error(`${action}: ${error.message ?? 'unknown database error'}`);
  }
}

function assertUpdated(
  error: { message?: string } | null,
  row: { id: number } | null,
  action: string
): void {
  assertMutation(error, action);
  if (!row) throw new Error(`${action}: no processing row was updated`);
}

async function markProviderAccepted(
  jobId: number,
  id: number,
  providerName: string,
  providerMessageId: string,
  tokenFingerprint: string | undefined,
  previousAttempts: number,
  fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION' | null = null
): Promise<void> {
  const acceptedAt = new Date().toISOString();
  const { data: notificationRow, error: notificationError } = await supabase
    .from('notifications')
    .update({
      delivery_provider: providerName,
      provider_message_id: providerMessageId,
      provider_token_fingerprint: tokenFingerprint ?? null,
      provider_accepted_at: acceptedAt,
      provider_status: 'accepted',
      // Compatibility: installed clients and the current queue use this field
      // as "processor complete". Provider delivery remains separate below.
      delivered_at: acceptedAt,
      delivery_error: null,
      delivery_failed_at: null,
      delivery_fallback_reason: fallbackReason,
      delivery_attempts: previousAttempts + 1,
    })
    .eq('id', id)
    .is('delivered_at', null)
    .select('id')
    .maybeSingle();
  assertUpdated(
    notificationError,
    notificationRow,
    `Could not persist acceptance for ${id}`
  );

  const { data: jobRow, error: jobError } = await supabase
    .from('notification_jobs')
    .update({
      status: 'delivered',
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();
  assertUpdated(jobError, jobRow, `Could not finish notification job ${jobId}`);
}

async function markDeferred(
  jobId: number,
  id: number,
  providerName: string,
  scheduledFor: string,
  reason: string
): Promise<void> {
  const { data: notificationRow, error: notificationError } = await supabase
    .from('notifications')
    .update({
      scheduled_for: scheduledFor,
      delivery_provider: providerName,
      delivery_error: reason,
      delivery_failed_at: null,
      delivery_fallback_reason: null,
      provider_status: 'deferred',
    })
    .eq('id', id)
    .is('delivered_at', null)
    .select('id')
    .maybeSingle();
  assertUpdated(
    notificationError,
    notificationRow,
    `Could not defer notification ${id}`
  );

  const { data: jobRow, error: jobError } = await supabase
    .from('notification_jobs')
    .update({
      status: 'pending',
      scheduled_for: scheduledFor,
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();
  assertUpdated(jobError, jobRow, `Could not defer notification job ${jobId}`);
}

async function markSkipped(
  jobId: number,
  id: number,
  providerName: string,
  reason: string,
  previousAttempts: number,
  fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION' | null = null
): Promise<void> {
  const { data: notificationRow, error: notificationError } = await supabase
    .from('notifications')
    .update({
      delivery_provider: providerName,
      provider_status: 'skipped',
      delivered_at: new Date().toISOString(),
      delivery_error: reason,
      delivery_failed_at: new Date().toISOString(),
      delivery_fallback_reason: fallbackReason,
      delivery_attempts: previousAttempts + 1,
    })
    .eq('id', id)
    .is('delivered_at', null)
    .select('id')
    .maybeSingle();
  assertUpdated(
    notificationError,
    notificationRow,
    `Could not skip notification ${id}`
  );

  const { data: jobRow, error: jobError } = await supabase
    .from('notification_jobs')
    .update({
      status: 'cancelled',
      attempts: previousAttempts + 1,
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();
  assertUpdated(jobError, jobRow, `Could not cancel notification job ${jobId}`);
}

async function markFailed(
  jobId: number,
  id: number,
  providerName: string,
  error: string,
  previousAttempts: number,
  fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION' | null = null
): Promise<void> {
  const { data: notificationRow, error: notificationError } = await supabase
    .from('notifications')
    .update({
      delivery_provider: providerName,
      provider_status: 'failed',
      delivery_error: error,
      delivery_failed_at: new Date().toISOString(),
      delivery_fallback_reason: fallbackReason,
      delivery_attempts: previousAttempts + 1,
    })
    .eq('id', id)
    .is('delivered_at', null)
    .select('id')
    .maybeSingle();
  assertUpdated(
    notificationError,
    notificationRow,
    `Could not mark notification ${id} failed`
  );

  const { data: jobRow, error: jobError } = await supabase
    .from('notification_jobs')
    .update({
      status: previousAttempts + 1 >= 5 ? 'failed' : 'pending',
      attempts: previousAttempts + 1,
      last_error: error,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();
  assertUpdated(jobError, jobRow, `Could not update failed job ${jobId}`);
}

async function sendExpoPush(
  record: NotificationRecord
): Promise<ProviderSendResult> {
  const { data: preferenceData, error: preferenceError } = await supabase
    .from('notification_preferences')
    .select('expo_push_token, push_enabled, remote_coach_contract_version')
    .eq('user_id', record.user_id)
    .maybeSingle();

  if (preferenceError) {
    throw new Error(
      `Could not load preferences for ${record.user_id}: ${preferenceError.message}`
    );
  }

  if (!preferenceData) {
    return {
      kind: 'skipped',
      reason: 'SKIPPED_NO_NOTIFICATION_PREFERENCES',
    };
  }

  if (!preferenceData?.push_enabled) {
    return { kind: 'skipped', reason: 'SKIPPED_PUSH_DISABLED' };
  }

  if (
    record.notification_type === 'streak_reminder' &&
    (preferenceData.remote_coach_contract_version ?? 0) < 1
  ) {
    return {
      kind: 'skipped',
      reason: 'SKIPPED_REMOTE_COACH_NOT_ACTIVATED',
    };
  }

  if (!preferenceData?.expo_push_token) {
    return { kind: 'skipped', reason: 'SKIPPED_NO_EXPO_PUSH_TOKEN' };
  }

  const expoPushToken = preferenceData.expo_push_token;
  const expoUrl = 'https://exp.host/--/api/v2/push/send';
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

  if (!expoAccessToken) {
    throw new Error('EXPO_ACCESS_TOKEN is not set in environment variables.');
  }

  const dataPayload = {
    ...(record.payload || {}),
    ...(record.metadata || {}),
    notificationId: record.id,
    type:
      record.payload?.type || record.metadata?.type || record.notification_type,
  };

  const response = await fetch(expoUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${expoAccessToken}`,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title: record.title || 'Menta update',
      body: record.body || 'Open Menta to see the update.',
      data: dataPayload,
      priority: getExpoPriority(record),
      channelId: getAndroidChannelId(record),
    }),
  });

  const responseData = await response.json();
  const ticket = Array.isArray(responseData.data)
    ? responseData.data[0]
    : responseData.data;

  if (!response.ok || ticket?.status === 'error') {
    const errorInfo = ticket?.details?.error;
    if (errorInfo === 'DeviceNotRegistered') {
      return {
        kind: 'retired',
        reason: 'DeviceNotRegistered',
        token: expoPushToken,
      };
    }
    const errorMessage = `Expo API error: ${ticket?.message || 'unknown'} - ${errorInfo || 'no details'}`;
    throw new Error(errorMessage);
  }

  if (ticket?.status !== 'ok' || typeof ticket.id !== 'string' || !ticket.id) {
    throw new Error('Expo API accepted response did not include a ticket id.');
  }

  return {
    kind: 'accepted',
    providerMessageId: ticket.id,
    tokenFingerprint: await fingerprintToken(expoPushToken),
  };
}

async function sendOneSignalPush(
  record: NotificationRecord
): Promise<ProviderSendResult> {
  if (record.push_platform !== 'ios') {
    throw new Error('OneSignal delivery is restricted to iOS registrations.');
  }

  const appId = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';

  if (!isValidOneSignalAppId(appId) || !restApiKey.trim()) {
    return {
      kind: 'skipped',
      reason: 'SKIPPED_REMOTE_PROVIDER_NOT_CONFIGURED',
    };
  }

  const dataPayload = buildOneSignalDataPayload({
    action: record.payload?.action ?? record.metadata?.action,
    notificationId: record.id,
    notificationType:
      record.payload?.type || record.metadata?.type || record.notification_type,
  });

  const request = buildOneSignalRequest({
    appId,
    restApiKey,
    externalUserId: record.user_id,
    idempotencyKey: await createOneSignalIdempotencyKey(record.id),
    title: record.title || 'Menta update',
    body: record.body || 'Open Menta to see the update.',
    data: dataPayload,
  });

  const response = await fetch(request.url, {
    method: 'POST',
    headers: {
      Authorization: request.authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request.body),
    signal: AbortSignal.timeout(10_000),
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(
      `OneSignal HTTP ${response.status}: ${JSON.stringify(responseData)}`
    );
  }

  const accepted = parseOneSignalSendResponse(responseData);
  if (accepted.kind === 'no-valid-subscription') {
    return {
      kind: 'no-valid-subscription',
      reason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION',
    };
  }
  return { kind: 'accepted', providerMessageId: accepted.providerMessageId };
}

const expoProvider: RemoteNotificationProvider<
  NotificationRecord,
  ProviderSendResult
> = {
  name: 'expo',
  configured: true,
  send: sendExpoPush,
};

const oneSignalProvider: RemoteNotificationProvider<
  NotificationRecord,
  ProviderSendResult
> = {
  name: 'onesignal',
  configured:
    isValidOneSignalAppId(Deno.env.get('ONESIGNAL_APP_ID')) &&
    Boolean(Deno.env.get('ONESIGNAL_REST_API_KEY')?.trim()),
  send: sendOneSignalPush,
};

async function loadDeliveryPreference(
  userId: string
): Promise<DeliveryPreference | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'push_enabled, challenge_reminders, group_updates, streak_alerts, timezone, quiet_hours_start, quiet_hours_end, device_permission_status, push_platform'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not load delivery preferences for ${userId}: ${error.message}`
    );
  }
  return (data ?? null) as DeliveryPreference | null;
}

async function loadNotificationDeliveryPolicy(): Promise<NotificationDeliveryPolicy> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'notification_delivery_policy_v1')
    .maybeSingle();

  if (error) return parseNotificationDeliveryPolicy(null);
  return parseNotificationDeliveryPolicy(data?.value);
}

async function retireExpoToken(
  userId: string,
  token: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .update({
      expo_push_token: null,
      push_token_status: 'invalid',
      push_token_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('expo_push_token', token)
    .select('user_id')
    .maybeSingle();
  if (error) {
    throw new Error(
      `Could not retire Expo token for ${userId}: ${error.message}`
    );
  }
  return Boolean(data?.user_id);
}

async function retireExpoTokenByFingerprint(
  userId: string,
  expectedFingerprint: string | null
): Promise<boolean> {
  if (!expectedFingerprint) return false;
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('expo_push_token')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw new Error(
      `Could not verify current Expo token for ${userId}: ${error.message}`
    );
  }
  if (!data?.expo_push_token) return false;
  const currentFingerprint = await fingerprintToken(data.expo_push_token);
  if (currentFingerprint !== expectedFingerprint) return false;
  return retireExpoToken(userId, data.expo_push_token);
}

async function reconcileExpoReceipts(): Promise<{
  checked: number;
  delivered: number;
  failed: number;
  retired: number;
}> {
  const result = { checked: 0, delivered: 0, failed: 0, retired: 0 };
  const now = new Date();
  const readyBefore = new Date(now.getTime() - 5 * 60_000).toISOString();
  const retainedAfter = new Date(
    now.getTime() - 24 * 60 * 60_000
  ).toISOString();
  const checkAgainBefore = new Date(now.getTime() - 15 * 60_000).toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, provider_message_id, provider_token_fingerprint')
    .eq('delivery_provider', 'expo')
    .eq('provider_status', 'accepted')
    .is('provider_delivered_at', null)
    .not('provider_message_id', 'is', null)
    .lte('provider_accepted_at', readyBefore)
    .gte('provider_accepted_at', retainedAfter)
    .or(
      `provider_receipt_checked_at.is.null,provider_receipt_checked_at.lte.${checkAgainBefore}`
    )
    .limit(100);

  if (error) throw new Error(`Could not load Expo receipts: ${error.message}`);
  const pending = (data ?? []) as AcceptedExpoNotification[];
  if (pending.length === 0) return result;

  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (!expoAccessToken) {
    throw new Error('EXPO_ACCESS_TOKEN is not set in environment variables.');
  }
  const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${expoAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: pending.map(row => row.provider_message_id) }),
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(
      `Expo receipt HTTP ${response.status}: ${JSON.stringify(responseData)}`
    );
  }

  const receipts = responseData?.data ?? {};
  for (const row of pending) {
    const receipt = receipts[row.provider_message_id];
    if (!receipt) continue;
    result.checked += 1;
    const checkedAt = new Date().toISOString();
    if (receipt.status === 'ok') {
      const { error: deliveredError } = await supabase
        .from('notifications')
        .update({
          provider_delivered_at: checkedAt,
          provider_receipt_checked_at: checkedAt,
          provider_status: 'delivered',
          delivery_error: null,
        })
        .eq('id', row.id)
        .eq('provider_status', 'accepted');
      assertMutation(
        deliveredError,
        `Could not persist Expo delivery receipt for ${row.id}`
      );
      result.delivered += 1;
      continue;
    }

    const providerError = receipt?.details?.error ?? 'UNKNOWN_RECEIPT_ERROR';
    if (providerError === 'DeviceNotRegistered') {
      const retired = await retireExpoTokenByFingerprint(
        row.user_id,
        row.provider_token_fingerprint
      );
      if (retired) result.retired += 1;
    } else {
      result.failed += 1;
    }
    const { error: receiptError } = await supabase
      .from('notifications')
      .update({
        provider_receipt_checked_at: checkedAt,
        provider_status:
          providerError === 'DeviceNotRegistered' ? 'invalid_token' : 'failed',
        delivery_error: `Expo receipt: ${providerError}`,
        delivery_failed_at: checkedAt,
      })
      .eq('id', row.id)
      .eq('provider_status', 'accepted');
    assertMutation(
      receiptError,
      `Could not persist Expo failure receipt for ${row.id}`
    );
  }
  return result;
}

async function hasPendingOrApprovedProof(
  record: NotificationRecord
): Promise<boolean> {
  if (record.notification_type !== 'streak_reminder') {
    return false;
  }

  const challengeId = record.payload?.challengeId;
  const localDay = record.payload?.localDay;
  if (typeof challengeId !== 'string' || !challengeId) {
    return false;
  }
  if (typeof localDay !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(localDay)) {
    return false;
  }

  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', record.user_id)
    .eq('local_day', localDay)
    .in('status', ['pending', 'approved'])
    .limit(1);

  if (error) {
    throw new Error(
      `Could not re-check proof for ${record.user_id}: ${error.message}`
    );
  }

  return Array.isArray(data) && data.length > 0;
}

async function processRecord(
  record: NotificationRecord,
  deliveryPolicy: NotificationDeliveryPolicy
) {
  const currentAttempts = record.delivery_attempts || 0;
  let providerName: 'expo' | 'onesignal' = 'expo';
  let fallbackReason: 'ONESIGNAL_NO_VALID_SUBSCRIPTION' | null = null;

  try {
    if (await hasPendingOrApprovedProof(record)) {
      await markSkipped(
        record.job_id,
        record.id,
        providerName,
        'SKIPPED_PROOF_ALREADY_RECORDED',
        currentAttempts
      );
      return {
        ok: true,
        skipped: true,
        reason: 'SKIPPED_PROOF_ALREADY_RECORDED',
      };
    }

    const preference = await loadDeliveryPreference(record.user_id);
    record.push_platform = preference?.push_platform ?? null;
    providerName = resolveNotificationDeliveryProvider({
      oneSignalConfigured: oneSignalProvider.configured,
      platform: record.push_platform,
      policy: deliveryPolicy,
    });
    const deliveryGuard = evaluateDeliveryGuard({
      notificationType: record.notification_type,
      now: new Date(),
      preference,
    });
    if (deliveryGuard.kind === 'skip') {
      await markSkipped(
        record.job_id,
        record.id,
        providerName,
        deliveryGuard.reason,
        currentAttempts
      );
      return { ok: true, skipped: true, reason: deliveryGuard.reason };
    }
    if (deliveryGuard.kind === 'defer') {
      await markDeferred(
        record.job_id,
        record.id,
        providerName,
        deliveryGuard.until,
        'DEFERRED_QUIET_HOURS'
      );
      return {
        ok: true,
        skipped: true,
        deferred: true,
        reason: 'DEFERRED_QUIET_HOURS',
      };
    }

    const routedSend = await sendWithOneSignalCompatibilityFallback({
      providerName,
      sendExpo: () => expoProvider.send(record),
      sendOneSignal: () => oneSignalProvider.send(record),
    });
    providerName = routedSend.providerName;
    fallbackReason = routedSend.fallbackReason;
    const pushResult = routedSend.result;

    if (pushResult.kind === 'retired') {
      await retireExpoToken(record.user_id, pushResult.token);
      await markSkipped(
        record.job_id,
        record.id,
        providerName,
        'SKIPPED_DEVICE_NOT_REGISTERED',
        currentAttempts,
        fallbackReason
      );
      return {
        ok: true,
        skipped: true,
        retired: true,
        reason: 'SKIPPED_DEVICE_NOT_REGISTERED',
      };
    }

    if (pushResult.kind === 'skipped') {
      await markSkipped(
        record.job_id,
        record.id,
        providerName,
        pushResult.reason,
        currentAttempts,
        fallbackReason
      );
      return { ok: true, skipped: true, reason: pushResult.reason };
    }

    await markProviderAccepted(
      record.job_id,
      record.id,
      providerName,
      pushResult.providerMessageId,
      pushResult.tokenFingerprint,
      currentAttempts,
      fallbackReason
    );
    return { ok: true, skipped: false, accepted: true };
  } catch (err) {
    await markFailed(
      record.job_id,
      record.id,
      providerName,
      String(err),
      currentAttempts,
      fallbackReason
    );
    return { ok: false, error: String(err) };
  }
}

async function dequeue(batchSize: number): Promise<NotificationRecord[]> {
  const { data, error } = await supabase.rpc('claim_notification_batch_v1', {
    p_batch_size: batchSize,
    p_lease_seconds: 600,
  });

  if (error) {
    throw new Error(`Could not claim notification batch: ${error.message}`);
  }
  return (data || []).map((row: any) => ({
    job_id: row.claimed_job_id,
    id: row.notification_id,
    user_id: row.target_user_id,
    notification_type: row.notification_type,
    title: row.title,
    body: row.body,
    payload: row.payload,
    metadata: row.metadata,
    priority: row.priority,
    delivery_attempts: row.delivery_attempts,
  }));
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authenticationError = rejectUnauthorisedMaintenance(req);
  if (authenticationError) return authenticationError;

  try {
    const url = new URL(req.url);
    const batchSize = Number(url.searchParams.get('batch') || '100');

    let receipts = { checked: 0, delivered: 0, failed: 0, retired: 0 };
    let receiptError: string | null = null;
    try {
      receipts = await reconcileExpoReceipts();
    } catch (error) {
      receiptError = String(error);
    }

    const deliveryPolicy = await loadNotificationDeliveryPolicy();
    const queued = await dequeue(Math.max(1, Math.min(batchSize, 200)));

    let processed = 0;
    let accepted = 0;
    let skipped = 0;
    let failed = 0;

    for (const record of queued) {
      const result = await processRecord(record, deliveryPolicy);
      processed += 1;
      if (result.ok && result.skipped) skipped += 1;
      else if (result.ok) accepted += 1;
      else failed += 1;
    }

    return new Response(
      JSON.stringify({
        success: failed === 0 && receiptError === null,
        processed,
        accepted,
        skipped,
        failed,
        receipts,
        receiptError,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
