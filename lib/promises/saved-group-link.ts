import { supabase } from '@/lib/supabase';

export type PromiseSavedGroupLinkRequest = {
  challengeId: string;
  groupId: string;
  clientEventId: string;
};

export type PromiseSavedGroupLinkReceipt = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  groupId: string;
  groupName: string;
  clientEventId: string;
  linkedAt: string;
  idempotent: boolean;
  promiseContainerPreserved: true;
  confirmedMembersCanView: true;
  reviewAuthority: 'confirmed_saved_group_members';
};

export type PromiseSavedGroupLinkResult =
  | {
      outcome: 'confirmed';
      code: 'PROMISE_LINKED' | 'PROMISE_ALREADY_LINKED_TO_GROUP';
      receipt: PromiseSavedGroupLinkReceipt;
    }
  | {
      outcome: 'failed';
      code:
        | 'AUTH_REQUIRED'
        | 'AUTH_SESSION_REVOKED'
        | 'INVALID_REQUEST'
        | 'PROMISE_NOT_AVAILABLE'
        | 'GROUP_NOT_AVAILABLE'
        | 'PROMISE_ALREADY_LINKED'
        | 'PROMISE_ACCOUNTABILITY_UNAVAILABLE'
        | 'IDEMPOTENCY_MISMATCH';
      safeToRetry: false;
    }
  | {
      outcome: 'unknown';
      code: 'RESULT_UNKNOWN' | 'RECEIPT_MISMATCH';
      request: PromiseSavedGroupLinkRequest;
      retryWithSameClientEvent: true;
    };

type UnknownRecord = Record<string, unknown>;

type RpcResult = {
  data: unknown;
  error: unknown;
};

type UntypedRpc = (
  name: string,
  args: Record<string, unknown>
) => Promise<RpcResult>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown, maximum = 200): string | null =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= maximum
    ? value.trim()
    : null;

const uuidValue = (value: unknown): string | null => {
  const candidate = stringValue(value, 36);
  return candidate && UUID_PATTERN.test(candidate) ? candidate : null;
};

const isIsoTimestamp = (value: string): boolean =>
  !Number.isNaN(Date.parse(value));

const FAILED_CODES = new Set<
  Extract<PromiseSavedGroupLinkResult, { outcome: 'failed' }>['code']
>([
  'AUTH_REQUIRED',
  'AUTH_SESSION_REVOKED',
  'INVALID_REQUEST',
  'PROMISE_NOT_AVAILABLE',
  'GROUP_NOT_AVAILABLE',
  'PROMISE_ALREADY_LINKED',
  'PROMISE_ACCOUNTABILITY_UNAVAILABLE',
  'IDEMPOTENCY_MISMATCH',
]);

const unknownResult = (
  request: PromiseSavedGroupLinkRequest,
  code: Extract<
    PromiseSavedGroupLinkResult,
    { outcome: 'unknown' }
  >['code'] = 'RESULT_UNKNOWN'
): PromiseSavedGroupLinkResult => ({
  outcome: 'unknown',
  code,
  request,
  retryWithSameClientEvent: true,
});

export const decodePromiseSavedGroupLinkResult = (
  value: unknown,
  request: PromiseSavedGroupLinkRequest
): PromiseSavedGroupLinkResult => {
  if (!isRecord(value) || value.operation !== 'PROMISE_SAVED_GROUP_LINK') {
    return unknownResult(request, 'RECEIPT_MISMATCH');
  }

  const code = stringValue(value.code, 80);
  if (value.success === false) {
    return code && FAILED_CODES.has(code as never)
      ? {
          outcome: 'failed',
          code: code as Extract<
            PromiseSavedGroupLinkResult,
            { outcome: 'failed' }
          >['code'],
          safeToRetry: false,
        }
      : unknownResult(request);
  }

  if (
    value.success !== true ||
    value.status !== 'confirmed' ||
    (code !== 'PROMISE_LINKED' && code !== 'PROMISE_ALREADY_LINKED_TO_GROUP') ||
    !isRecord(value.receipt)
  ) {
    return unknownResult(request, 'RECEIPT_MISMATCH');
  }

  const receiptId = uuidValue(value.receipt.receipt_id);
  const clientEventId = uuidValue(value.receipt.client_event_id);
  const challengeId = uuidValue(value.receipt.challenge_id);
  const challengeTitle = stringValue(value.receipt.challenge_title);
  const groupId = uuidValue(value.receipt.group_id);
  const groupName = stringValue(value.receipt.group_name, 120);
  const linkedAt = stringValue(value.receipt.linked_at, 80);

  if (
    !receiptId ||
    clientEventId !== request.clientEventId ||
    challengeId !== request.challengeId ||
    groupId !== request.groupId ||
    !challengeTitle ||
    !groupName ||
    !linkedAt ||
    !isIsoTimestamp(linkedAt) ||
    value.receipt.promise_container_preserved !== true ||
    value.receipt.confirmed_members_can_view !== true ||
    value.receipt.review_authority !== 'confirmed_saved_group_members'
  ) {
    return unknownResult(request, 'RECEIPT_MISMATCH');
  }

  return {
    outcome: 'confirmed',
    code,
    receipt: {
      id: receiptId,
      clientEventId,
      challengeId,
      challengeTitle,
      groupId,
      groupName,
      linkedAt,
      idempotent: value.receipt.idempotent === true,
      promiseContainerPreserved: true,
      confirmedMembersCanView: true,
      reviewAuthority: 'confirmed_saved_group_members',
    },
  };
};

/**
 * Reuse the same request after an unknown result. The server receipt is keyed
 * by actor and client event, so retrying with a fresh event ID would lose the
 * only safe correlation to a response that may already have committed.
 */
export const attachPromiseToSavedGroup = async (
  request: PromiseSavedGroupLinkRequest
): Promise<PromiseSavedGroupLinkResult> => {
  const rpc = supabase.rpc.bind(supabase) as unknown as UntypedRpc;

  try {
    const { data, error } = await rpc(
      'attach_personal_promise_to_saved_group_v1',
      {
        p_challenge_id: request.challengeId,
        p_group_id: request.groupId,
        p_client_event_id: request.clientEventId,
      }
    );

    if (error) return unknownResult(request);
    return decodePromiseSavedGroupLinkResult(data, request);
  } catch {
    return unknownResult(request);
  }
};
