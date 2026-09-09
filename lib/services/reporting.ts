import { supabase } from '@/lib/supabase';

export type ReportTargetType = 'verification' | 'group' | 'challenge' | 'user';
export type ReportReasonCode =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'copyright'
  | 'misleading'
  | 'other';
export type ReportDeliveryOutcome = 'confirmed' | 'not-sent' | 'result-unknown';

export type ContentReportAttachmentFacts = {
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
};

export type ContentReportFacts = {
  title: string;
  description: string;
  observed_behavior: string | null;
  expected_behavior: string | null;
  steps_to_reproduce: string | null;
  source: string;
  report_kind: string;
  challenge_id: string | null;
  group_id: string | null;
  submission_id: string | null;
  target_user_id: string | null;
  target_user_label: string | null;
  context_label: string | null;
  crash_reference: string | null;
  attachments: ContentReportAttachmentFacts[];
  attachment_state: string;
  snapshot_created_at: string;
  report_draft_id: string;
};

export type SubmitContentReportInput = {
  expectedReporterId: string;
  clientEventId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReasonCode;
  facts: ContentReportFacts;
};

export interface ReportResult {
  success: boolean;
  outcome: ReportDeliveryOutcome;
  code: string;
  message?: string;
  reporterId?: string;
  clientEventId?: string;
  receiptId?: string;
  status?: 'open' | 'reviewed' | 'dismissed' | 'actioned';
  receivedAt?: string;
  replayed?: boolean;
}

export type RecordBlockInput = {
  expectedBlockerId: string;
  clientEventId: string;
  blockedUserId: string;
  reason?: string | null;
};

export interface BlockResult {
  success: boolean;
  outcome: ReportDeliveryOutcome;
  code: string;
  message?: string;
  blockerId?: string;
  blockedUserId?: string;
  clientEventId?: string;
  receivedAt?: string;
  replayed?: boolean;
}

type RpcError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

type RpcResponse = {
  data: unknown;
  error: RpcError | null;
};

type RpcInvoker = (
  functionName: string,
  args: Record<string, unknown>
) => Promise<RpcResponse>;

const invokeRpc: RpcInvoker = (functionName, args) =>
  (supabase.rpc as unknown as RpcInvoker).call(supabase, functionName, args);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

const isReportStatus = (
  value: unknown
): value is NonNullable<ReportResult['status']> =>
  value === 'open' ||
  value === 'reviewed' ||
  value === 'dismissed' ||
  value === 'actioned';

const definitivePreflightRpcCodes = new Set([
  '22P02',
  '28000',
  '42501',
  '42883',
  'PGRST100',
  'PGRST202',
  'PGRST203',
  'PGRST301',
  'PGRST302',
]);

const rpcErrorOutcome = (error: RpcError): ReportDeliveryOutcome =>
  error.code && definitivePreflightRpcCodes.has(error.code)
    ? 'not-sent'
    : 'result-unknown';

const reportFailure = (
  outcome: Exclude<ReportDeliveryOutcome, 'confirmed'>,
  code: string,
  message: string
): ReportResult => ({ success: false, outcome, code, message });

const blockFailure = (
  outcome: Exclude<ReportDeliveryOutcome, 'confirmed'>,
  code: string,
  message: string
): BlockResult => ({ success: false, outcome, code, message });

const readCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
};

const parseReportResponse = (
  value: unknown,
  input: SubmitContentReportInput
): ReportResult => {
  if (!isRecord(value)) {
    return reportFailure(
      'result-unknown',
      'MALFORMED_REPORT_RECEIPT',
      'Menta could not verify the report receipt. Retry with the same saved report.'
    );
  }

  const code = nonEmptyString(value.code) ?? 'REPORT_REJECTED';
  const message = nonEmptyString(value.message) ?? undefined;
  if (value.success === false && value.outcome === 'not_sent') {
    return {
      success: false,
      outcome: 'not-sent',
      code,
      message: message ?? 'Menta did not send this report.',
    };
  }

  if (
    value.success !== true ||
    value.outcome !== 'confirmed' ||
    value.code !== 'REPORT_RECEIVED' ||
    value.reporter_id !== input.expectedReporterId ||
    value.client_event_id !== input.clientEventId ||
    !isUuid(value.receipt_id) ||
    !isReportStatus(value.status) ||
    typeof value.received_at !== 'string' ||
    typeof value.replayed !== 'boolean'
  ) {
    return reportFailure(
      'result-unknown',
      'MALFORMED_REPORT_RECEIPT',
      'Menta could not verify the report receipt. Retry with the same saved report.'
    );
  }

  return {
    success: true,
    outcome: 'confirmed',
    code: 'REPORT_RECEIVED',
    reporterId: value.reporter_id,
    clientEventId: value.client_event_id,
    receiptId: value.receipt_id,
    status: value.status,
    receivedAt: value.received_at,
    replayed: value.replayed,
  };
};

const submitContentReport = async (
  input: SubmitContentReportInput
): Promise<ReportResult> => {
  const preflightUserId = await readCurrentUserId();
  if (!preflightUserId) {
    return reportFailure(
      'not-sent',
      'AUTH_REQUIRED',
      'Sign in again before sending this report.'
    );
  }
  if (preflightUserId !== input.expectedReporterId) {
    return reportFailure(
      'not-sent',
      'ACCOUNT_CHANGED',
      'The signed-in account changed before this report was sent.'
    );
  }

  let response: RpcResponse;
  try {
    response = await invokeRpc('submit_content_report_v1', {
      p_expected_reporter_id: input.expectedReporterId,
      p_client_event_id: input.clientEventId,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_reason: input.reason,
      p_facts: input.facts,
    });
  } catch {
    return reportFailure(
      'result-unknown',
      'REPORT_RESPONSE_UNAVAILABLE',
      'Menta could not confirm the server response. Retry with the same saved report.'
    );
  }

  const parsed = response.error
    ? reportFailure(
        rpcErrorOutcome(response.error) === 'not-sent'
          ? 'not-sent'
          : 'result-unknown',
        response.error.code ?? 'REPORT_RESPONSE_UNAVAILABLE',
        response.error.message ??
          'Menta could not confirm the server response. Retry with the same saved report.'
      )
    : parseReportResponse(response.data, input);

  const postflightUserId = await readCurrentUserId();
  if (postflightUserId !== input.expectedReporterId) {
    if (parsed.outcome === 'confirmed') {
      return reportFailure(
        'result-unknown',
        'ACCOUNT_CHANGED_AFTER_SEND',
        'The account changed while Menta was confirming this report. Sign in to the original account and retry the saved report.'
      );
    }
    return parsed;
  }

  return parsed;
};

const parseBlockResponse = (
  value: unknown,
  input: RecordBlockInput
): BlockResult => {
  if (!isRecord(value)) {
    return blockFailure(
      'result-unknown',
      'MALFORMED_BLOCK_RECEIPT',
      'Menta could not verify the block receipt.'
    );
  }
  const code = nonEmptyString(value.code) ?? 'BLOCK_REJECTED';
  const message = nonEmptyString(value.message) ?? undefined;
  if (value.success === false && value.outcome === 'not_sent') {
    return {
      success: false,
      outcome: 'not-sent',
      code,
      message: message ?? 'Menta did not save this block.',
    };
  }
  if (
    value.success !== true ||
    value.outcome !== 'confirmed' ||
    value.code !== 'BLOCK_RECORDED' ||
    value.blocker_id !== input.expectedBlockerId ||
    value.blocked_user_id !== input.blockedUserId ||
    value.client_event_id !== input.clientEventId ||
    typeof value.received_at !== 'string' ||
    typeof value.replayed !== 'boolean'
  ) {
    return blockFailure(
      'result-unknown',
      'MALFORMED_BLOCK_RECEIPT',
      'Menta could not verify the block receipt.'
    );
  }
  return {
    success: true,
    outcome: 'confirmed',
    code: 'BLOCK_RECORDED',
    blockerId: value.blocker_id,
    blockedUserId: value.blocked_user_id,
    clientEventId: value.client_event_id,
    receivedAt: value.received_at,
    replayed: value.replayed,
  };
};

/**
 * Prepared authority boundary for a later bilateral block experience. Product
 * controls remain hidden until every relevant read path applies block filters.
 */
const recordBlock = async (input: RecordBlockInput): Promise<BlockResult> => {
  const preflightUserId = await readCurrentUserId();
  if (!preflightUserId || preflightUserId !== input.expectedBlockerId) {
    return blockFailure(
      'not-sent',
      preflightUserId ? 'ACCOUNT_CHANGED' : 'AUTH_REQUIRED',
      'Sign in to the original account before saving this block.'
    );
  }

  let response: RpcResponse;
  try {
    response = await invokeRpc('block_user_v1', {
      p_expected_blocker_id: input.expectedBlockerId,
      p_client_event_id: input.clientEventId,
      p_blocked_user_id: input.blockedUserId,
      p_reason: input.reason?.trim() || null,
    });
  } catch {
    return blockFailure(
      'result-unknown',
      'BLOCK_RESPONSE_UNAVAILABLE',
      'Menta could not confirm whether the block was saved.'
    );
  }

  const parsed = response.error
    ? blockFailure(
        rpcErrorOutcome(response.error) === 'not-sent'
          ? 'not-sent'
          : 'result-unknown',
        response.error.code ?? 'BLOCK_RESPONSE_UNAVAILABLE',
        response.error.message ??
          'Menta could not confirm whether the block was saved.'
      )
    : parseBlockResponse(response.data, input);

  const postflightUserId = await readCurrentUserId();
  if (
    parsed.outcome === 'confirmed' &&
    postflightUserId !== input.expectedBlockerId
  ) {
    return blockFailure(
      'result-unknown',
      'ACCOUNT_CHANGED_AFTER_SEND',
      'The account changed while Menta was confirming this block.'
    );
  }
  return parsed;
};

export const reportingService = {
  submitContentReport,
  recordBlock,
};
