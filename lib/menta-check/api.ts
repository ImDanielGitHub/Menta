import { createClientEventId } from '@/lib/client-event-id';
import { supabase } from '@/lib/supabase';
import {
  decodeMentaOverview,
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
