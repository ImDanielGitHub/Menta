import { createClientEventId } from '@/lib/client-event-id';
import { supabase } from '@/lib/supabase';
import {
  decodeMentaOverview,
  decodeMentaMediaPermission,
  decodeMentaToday,
} from '@/lib/menta-check/decode';
import type {
  MentaCheckOverview,
  MentaRpcResult,
  MentaTodayItem,
  PromiseReviewMode,
} from '@/lib/menta-check/types';

const newEventId = (): string => createClientEventId();

const asResult = <T extends object>(data: unknown): MentaRpcResult<T> => {
  if (data && typeof data === 'object' && 'success' in data) {
    return data as MentaRpcResult<T>;
  }
  return { success: false, code: 'UNKNOWN_RESPONSE' };
};

const deviceTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export async function getMentaCheckToday(): Promise<MentaTodayItem[]> {
  const { data, error } = await supabase.rpc('get_menta_check_today_v1', {
    p_timezone: deviceTimezone(),
  });
  if (error) throw error;
  return decodeMentaToday(data);
}

export async function getMentaCheckOverview(): Promise<MentaCheckOverview | null> {
  const { data, error } = await supabase.rpc('get_menta_check_overview_v1');
  if (error) throw error;
  return decodeMentaOverview(data);
}

/** Readback uses the independent active v2 receipt owned by the current session. */
export async function getMentaCheckMediaPermissionV2(): Promise<
  'allowed' | 'needs-review'
> {
  const { data, error } = await supabase.rpc(
    'get_menta_check_media_consent_v2'
  );
  if (error) throw error;
  const state = decodeMentaMediaPermission(data);
  if (state === 'unavailable') throw new Error('CONSENT_NOT_CONFIRMED');
  return state;
}

export type MentaConsentSource =
  'onboarding' | 'create' | 'settings' | 'intro' | 'group';

export async function setMentaCheckConsent(
  accept: boolean,
  source: MentaConsentSource
): Promise<MentaRpcResult<{ consented: boolean }>> {
  const { data, error } = await supabase.rpc('set_menta_check_consent_v1', {
    p_accept: accept,
    p_source: source,
  });
  if (error) throw error;
  return asResult(data);
}

/** Explicit media disclosure acceptance; legacy consent is never v2 evidence. */
export async function acceptMentaCheckMediaConsentV2(
  source: MentaConsentSource
): Promise<
  MentaRpcResult<{
    consented: true;
    policy_version: 2;
    acknowledgement_id: string;
    acknowledged_at: string;
  }>
> {
  const { data, error } = await supabase.rpc('set_menta_check_consent_v2', {
    p_accept: true,
    p_source: source,
    p_policy_version: 2,
  });
  if (error) throw error;
  const result = asResult<{
    consented: boolean;
    policy_version: number;
    acknowledgement_id: string;
    acknowledged_at: string;
  }>(data);
  if (result.success === false) return result;
  if (
    result.success !== true ||
    result.consented !== true ||
    result.policy_version !== 2 ||
    typeof result.acknowledgement_id !== 'string' ||
    result.acknowledgement_id.length === 0 ||
    typeof result.acknowledged_at !== 'string' ||
    !Number.isFinite(Date.parse(result.acknowledged_at))
  ) {
    return { success: false, code: 'CONSENT_NOT_CONFIRMED' };
  }
  return {
    success: true,
    consented: true,
    policy_version: 2,
    acknowledgement_id: result.acknowledgement_id,
    acknowledged_at: result.acknowledged_at,
  };
}

export async function setPromiseReviewMode(
  challengeId: string,
  mode: PromiseReviewMode,
  backupHours: 12 | 24 | 48 | null = null
): Promise<
  MentaRpcResult<{
    review_mode: PromiseReviewMode;
    backup_hours: number | null;
  }>
> {
  const { data, error } = await supabase.rpc('set_promise_menta_check_v1', {
    p_challenge_id: challengeId,
    p_mode: mode,
    p_backup_hours: backupHours,
  });
  if (error) throw error;
  return asResult(data);
}

export async function buyMentaCheckPass(
  challengeId: string,
  autoRenew = true
): Promise<MentaRpcResult<{ active_until: string; new_balance?: number }>> {
  const { data, error } = await supabase.rpc('buy_menta_check_pass_v1', {
    p_challenge_id: challengeId,
    p_auto_renew: autoRenew,
    p_client_event_id: newEventId(),
  });
  if (error) throw error;
  return asResult(data);
}

export async function stopMentaCheckPass(
  challengeId: string
): Promise<MentaRpcResult> {
  const { data, error } = await supabase.rpc('stop_menta_check_pass_v1', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  return asResult(data);
}

export async function countMentaProofAnyway(
  submissionId: string,
  clientEventId: string = newEventId()
): Promise<
  MentaRpcResult<{
    submission_id: string;
    new_balance: number;
    overrides_left: number;
  }>
> {
  const { data, error } = await supabase.rpc('count_menta_proof_anyway_v1', {
    p_submission_id: submissionId,
    p_client_event_id: clientEventId,
  });
  if (error) throw error;
  return asResult(data);
}

export async function askFriendForMentaProof(
  submissionId: string,
  clientEventId: string = newEventId()
): Promise<MentaRpcResult<{ submission_id: string; challenge_id: string }>> {
  const { data, error } = await supabase.rpc('ask_friend_for_menta_proof_v1', {
    p_submission_id: submissionId,
    p_client_event_id: clientEventId,
  });
  if (error) throw error;
  return asResult(data);
}

export type MentaReportKind =
  'false_negative' | 'false_positive' | 'group_question';

export async function reportMentaCheck(
  submissionId: string,
  kind: MentaReportKind
): Promise<MentaRpcResult> {
  const { data, error } = await supabase.rpc('report_menta_check_v1', {
    p_submission_id: submissionId,
    p_kind: kind,
    p_client_event_id: newEventId(),
  });
  if (error) throw error;
  return asResult(data);
}

export type MentaReviewHint = 'matches' | 'unsure';

export async function getMentaReviewHint(
  submissionId: string
): Promise<MentaReviewHint | null> {
  const { data, error } = await supabase.rpc('get_menta_check_hint_v1', {
    p_submission_id: submissionId,
  });
  if (error) return null;
  return data === 'matches' || data === 'unsure' ? data : null;
}

export { newEventId as newMentaEventId };
