import { translate } from '@/lib/localization/translate';
import { supabase } from '@/lib/supabase';
import type { PromiseAccountabilityRole } from '@/lib/promises/accountability';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_PATTERN = /^[A-Z0-9]{4,32}$/;

type UnknownRecord = Record<string, unknown>;

export type ChallengeJoinTarget = {
  challengeId: string | null;
  inviteCode: string | null;
};

export type ChallengeJoinEligibilityCode =
  | 'ELIGIBLE'
  | 'INSUFFICIENT_BALANCE'
  | 'ALREADY_JOINED';

export type ChallengeJoinFailureCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_SESSION_REVOKED'
  | 'INVALID_REQUEST'
  | 'INVALID_INVITE'
  | 'INVITE_EXPIRED'
  | 'CHALLENGE_NOT_FOUND'
  | 'CHALLENGE_INACTIVE'
  | 'GROUP_INACTIVE'
  | 'SOLO_CHALLENGE'
  | 'PROFILE_NOT_FOUND'
  | 'INSUFFICIENT_BALANCE'
  | 'ALREADY_JOINED'
  | 'QUOTE_STALE'
  | 'QUOTA_ACTIVE_PROMISES'
  | 'IDEMPOTENCY_MISMATCH'
  | 'JOIN_IN_PROGRESS'
  | 'JOIN_FAILED';

export type ChallengeJoinOperation =
  | 'CHALLENGE_JOIN_QUOTE'
  | 'CHALLENGE_JOIN'
  | 'CHALLENGE_JOIN_STATUS';

export type ChallengeJoinQuote = {
  source: 'server';
  quoteId: string;
  challengeId: string;
  challengeTitle: string;
  challengeDescription: string | null;
  groupId: string | null;
  groupName: string | null;
  inviterName?: string | null;
  cost: number;
  availableBalance: number;
  shortfall: number;
  eligible: boolean;
  eligibilityCode: ChallengeJoinEligibilityCode;
  accountabilityRole?: PromiseAccountabilityRole | null;
};

export type ChallengeJoinReceipt = {
  source: 'server';
  receiptId: string;
  clientEventId: string;
  quoteId: string;
  challengeId: string;
  challengeTitle: string;
  groupId: string | null;
  groupName: string | null;
  inviterName?: string | null;
  joinedAt: string;
  debitAmount: number;
  newBalance: number;
  firstProofTitle: string;
  firstDueAt: string | null;
  idempotent: boolean;
  accountabilityRole?: PromiseAccountabilityRole | null;
};

export type ChallengeJoinFailure = {
  operation: ChallengeJoinOperation;
  code: ChallengeJoinFailureCode;
  message: string;
};

export type ChallengeJoinStatusSnapshot = {
  challengeId: string;
  isMember: boolean;
  availableBalance: number;
};

export type ChallengeJoinQuoteResult =
  | { kind: 'quote'; quote: ChallengeJoinQuote }
  | { kind: 'failure'; failure: ChallengeJoinFailure }
  | { kind: 'unavailable'; message: string };

export type ChallengeJoinMutationResult =
  | { kind: 'confirmed'; receipt: ChallengeJoinReceipt }
  | { kind: 'failure'; failure: ChallengeJoinFailure }
  | { kind: 'unknown'; message: string };

export type ChallengeJoinStatusResult =
  | { kind: 'confirmed'; receipt: ChallengeJoinReceipt }
  | { kind: 'snapshot'; status: ChallengeJoinStatusSnapshot }
  | { kind: 'failure'; failure: ChallengeJoinFailure }
  | { kind: 'unavailable'; message: string };

const quoteKeys = [
  'quote_id',
  'challenge_id',
  'challenge_title',
  'challenge_description',
  'group_id',
  'group_name',
  'inviter_name',
  'cost',
  'available_balance',
  'shortfall',
  'eligible',
  'eligibility_code',
  'accountability_role',
] as const;

const receiptKeys = [
  'receipt_id',
  'client_event_id',
  'quote_id',
  'challenge_id',
  'challenge_title',
  'group_id',
  'group_name',
  'inviter_name',
  'joined_at',
  'debit_amount',
  'new_balance',
  'first_proof_title',
  'first_due_at',
  'idempotent',
  'accountability_role',
] as const;

const failureCodes = new Set<ChallengeJoinFailureCode>([
  'AUTH_REQUIRED',
  'AUTH_SESSION_REVOKED',
  'INVALID_REQUEST',
  'INVALID_INVITE',
  'INVITE_EXPIRED',
  'CHALLENGE_NOT_FOUND',
  'CHALLENGE_INACTIVE',
  'GROUP_INACTIVE',
  'SOLO_CHALLENGE',
  'PROFILE_NOT_FOUND',
  'INSUFFICIENT_BALANCE',
  'ALREADY_JOINED',
  'QUOTE_STALE',
  'QUOTA_ACTIVE_PROMISES',
  'IDEMPOTENCY_MISMATCH',
  'JOIN_IN_PROGRESS',
  'JOIN_FAILED',
]);

const operations = new Set<ChallengeJoinOperation>([
  'CHALLENGE_JOIN_QUOTE',
  'CHALLENGE_JOIN',
  'CHALLENGE_JOIN_STATUS',
]);

const eligibilityCodes = new Set<ChallengeJoinEligibilityCode>([
  'ELIGIBLE',
  'INSUFFICIENT_BALANCE',
  'ALREADY_JOINED',
]);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: UnknownRecord,
  permitted: readonly string[]
): boolean => Object.keys(value).every(key => permitted.includes(key));

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.includes('T') &&
  Number.isFinite(new Date(value).getTime());

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const nullableString = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && value.trim().length > 0);

const groupPairIsValid = (id: unknown, name: unknown): boolean =>
  (id === null && name === null) ||
  (isUuid(id) && typeof name === 'string' && name.trim().length > 0);

const accountabilityRole = (
  value: unknown
): PromiseAccountabilityRole | null | undefined =>
  value === undefined || value === null
    ? null
    : value === 'partner' || value === 'reviewer' || value === 'supporter'
      ? value
      : undefined;

const optionalName = (value: unknown): string | null | undefined =>
  value === undefined || value === null
    ? null
    : typeof value === 'string' && value.trim() && value.trim().length <= 120
      ? value.trim()
      : undefined;

export const normaliseChallengeJoinTarget = (input: {
  challengeId?: string | null;
  inviteCode?: string | null;
}): ChallengeJoinTarget | null => {
  const challengeId = input.challengeId?.trim() || null;
  const inviteCode = input.inviteCode
    ? input.inviteCode
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '')
    : null;

  if (challengeId && !UUID_PATTERN.test(challengeId)) return null;
  if (inviteCode && !INVITE_PATTERN.test(inviteCode)) return null;
  if (!challengeId && !inviteCode) return null;

  return { challengeId, inviteCode };
};

export const challengeJoinTargetKey = (target: ChallengeJoinTarget): string =>
  `${target.challengeId ?? ''}:${target.inviteCode ?? ''}`;

export const decodeChallengeJoinQuote = (
  value: unknown
): ChallengeJoinQuote | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, quoteKeys)) return null;

  const eligibilityCode = value.eligibility_code;
  const role = accountabilityRole(value.accountability_role);
  const inviterName = optionalName(value.inviter_name);
  if (
    !isUuid(value.quote_id) ||
    !isUuid(value.challenge_id) ||
    typeof value.challenge_title !== 'string' ||
    value.challenge_title.trim().length === 0 ||
    !nullableString(value.challenge_description) ||
    !groupPairIsValid(value.group_id, value.group_name) ||
    !isNonNegativeInteger(value.cost) ||
    !isNonNegativeInteger(value.available_balance) ||
    !isNonNegativeInteger(value.shortfall) ||
    typeof value.eligible !== 'boolean' ||
    typeof eligibilityCode !== 'string' ||
    !eligibilityCodes.has(eligibilityCode as ChallengeJoinEligibilityCode) ||
    role === undefined ||
    inviterName === undefined
  ) {
    return null;
  }

  const expectedShortfall = Math.max(value.cost - value.available_balance, 0);
  if (value.shortfall !== expectedShortfall) return null;
  if ((eligibilityCode === 'ELIGIBLE') !== value.eligible) return null;
  if (eligibilityCode === 'INSUFFICIENT_BALANCE' && value.shortfall === 0) {
    return null;
  }

  return {
    source: 'server',
    quoteId: value.quote_id,
    challengeId: value.challenge_id,
    challengeTitle: value.challenge_title.trim(),
    challengeDescription:
      typeof value.challenge_description === 'string'
        ? value.challenge_description.trim()
        : null,
    groupId: value.group_id as string | null,
    groupName:
      typeof value.group_name === 'string' ? value.group_name.trim() : null,
    inviterName,
    cost: value.cost,
    availableBalance: value.available_balance,
    shortfall: value.shortfall,
    eligible: value.eligible,
    eligibilityCode: eligibilityCode as ChallengeJoinEligibilityCode,
    accountabilityRole: role,
  };
};

export const decodeChallengeJoinReceipt = (
  value: unknown
): ChallengeJoinReceipt | null => {
  if (!isRecord(value) || !hasOnlyKeys(value, receiptKeys)) return null;

  const role = accountabilityRole(value.accountability_role);
  const inviterName = optionalName(value.inviter_name);
  if (
    !isUuid(value.receipt_id) ||
    !isUuid(value.client_event_id) ||
    !isUuid(value.quote_id) ||
    !isUuid(value.challenge_id) ||
    typeof value.challenge_title !== 'string' ||
    value.challenge_title.trim().length === 0 ||
    !groupPairIsValid(value.group_id, value.group_name) ||
    !isIsoTimestamp(value.joined_at) ||
    !isNonNegativeInteger(value.debit_amount) ||
    !isNonNegativeInteger(value.new_balance) ||
    typeof value.first_proof_title !== 'string' ||
    value.first_proof_title.trim().length === 0 ||
    !(value.first_due_at === null || isIsoTimestamp(value.first_due_at)) ||
    typeof value.idempotent !== 'boolean' ||
    role === undefined ||
    inviterName === undefined
  ) {
    return null;
  }

  return {
    source: 'server',
    receiptId: value.receipt_id,
    clientEventId: value.client_event_id,
    quoteId: value.quote_id,
    challengeId: value.challenge_id,
    challengeTitle: value.challenge_title.trim(),
    groupId: value.group_id as string | null,
    groupName:
      typeof value.group_name === 'string' ? value.group_name.trim() : null,
    inviterName,
    joinedAt: value.joined_at,
    debitAmount: value.debit_amount,
    newBalance: value.new_balance,
    firstProofTitle: value.first_proof_title.trim(),
    firstDueAt: value.first_due_at as string | null,
    idempotent: value.idempotent,
    accountabilityRole: role,
  };
};

export const challengeJoinReceiptMatchesRequest = (
  receipt: ChallengeJoinReceipt,
  request: {
    clientEventId: string;
    challengeId: string;
    quoteId?: string;
  }
): boolean =>
  receipt.clientEventId === request.clientEventId &&
  receipt.challengeId === request.challengeId &&
  (request.quoteId === undefined || receipt.quoteId === request.quoteId);

export const challengeJoinQuoteMatchesTarget = (
  quote: ChallengeJoinQuote,
  target: ChallengeJoinTarget
): boolean =>
  target.challengeId === null || quote.challengeId === target.challengeId;

export const decodeChallengeJoinFailure = (
  value: unknown,
  expectedOperation?: ChallengeJoinOperation
): ChallengeJoinFailure | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['success', 'operation', 'code', 'message']) ||
    value.success !== false ||
    typeof value.operation !== 'string' ||
    !operations.has(value.operation as ChallengeJoinOperation) ||
    (expectedOperation && value.operation !== expectedOperation) ||
    typeof value.code !== 'string' ||
    !failureCodes.has(value.code as ChallengeJoinFailureCode) ||
    typeof value.message !== 'string' ||
    value.message.trim().length === 0
  ) {
    return null;
  }

  return {
    operation: value.operation as ChallengeJoinOperation,
    code: value.code as ChallengeJoinFailureCode,
    message: value.message.trim(),
  };
};

const decodeQuoteEnvelope = (value: unknown): ChallengeJoinQuote | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['success', 'operation', 'code', 'quote']) ||
    value.success !== true ||
    value.operation !== 'CHALLENGE_JOIN_QUOTE' ||
    value.code !== 'QUOTE_READY'
  ) {
    return null;
  }
  return decodeChallengeJoinQuote(value.quote);
};

const decodeReceiptEnvelope = (
  value: unknown,
  operation: 'CHALLENGE_JOIN' | 'CHALLENGE_JOIN_STATUS',
  code: 'JOIN_CONFIRMED' | 'RECEIPT_FOUND'
): ChallengeJoinReceipt | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['success', 'operation', 'code', 'receipt']) ||
    value.success !== true ||
    value.operation !== operation ||
    value.code !== code
  ) {
    return null;
  }
  return decodeChallengeJoinReceipt(value.receipt);
};

const decodeStatusSnapshotEnvelope = (
  value: unknown
): ChallengeJoinStatusSnapshot | null => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ['success', 'operation', 'code', 'status']) ||
    value.success !== true ||
    value.operation !== 'CHALLENGE_JOIN_STATUS' ||
    value.code !== 'NO_RECEIPT' ||
    !isRecord(value.status) ||
    !hasOnlyKeys(value.status, [
      'challenge_id',
      'is_member',
      'available_balance',
    ]) ||
    !isUuid(value.status.challenge_id) ||
    typeof value.status.is_member !== 'boolean' ||
    !isNonNegativeInteger(value.status.available_balance)
  ) {
    return null;
  }

  return {
    challengeId: value.status.challenge_id,
    isMember: value.status.is_member,
    availableBalance: value.status.available_balance,
  };
};

const rpcMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (
    isRecord(error) &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim();
  }
  return fallback;
};

export const fetchChallengeJoinQuote = async (
  target: ChallengeJoinTarget
): Promise<ChallengeJoinQuoteResult> => {
  const { data, error } = await supabase.rpc(
    'quote_promise_accountability_join_v2',
    {
      p_challenge_id: target.challengeId,
      p_invite_code: target.inviteCode,
    }
  );

  if (error) {
    return {
      kind: 'unavailable',
      message: rpcMessage(
        error,
        translate('en-NZ', 'groups.funding.quote_unavailable')
      ),
    };
  }

  const quote = decodeQuoteEnvelope(data);
  if (quote && challengeJoinQuoteMatchesTarget(quote, target)) {
    return { kind: 'quote', quote };
  }
  if (quote) {
    return {
      kind: 'unavailable',
      message: translate('en-NZ', 'groups.funding.terms_mismatch'),
    };
  }

  const failure = decodeChallengeJoinFailure(data, 'CHALLENGE_JOIN_QUOTE');
  if (failure) return { kind: 'failure', failure };

  return {
    kind: 'unavailable',
    message: translate('en-NZ', 'groups.funding.quote_unavailable_detail'),
  };
};

export const submitChallengeJoin = async (input: {
  target: ChallengeJoinTarget;
  expectedChallengeId: string;
  quoteId: string;
  clientEventId: string;
}): Promise<ChallengeJoinMutationResult> => {
  try {
    const { data, error } = await supabase.rpc(
      'join_promise_accountability_v2',
      {
        // Code-only links have no target ID until the server quote resolves
        // it. The role-aware mutation requires that confirmed promise ID.
        p_challenge_id: input.expectedChallengeId,
        p_invite_code: input.target.inviteCode,
        p_quote_id: input.quoteId,
        p_client_event_id: input.clientEventId,
      }
    );

    if (error) {
      return {
        kind: 'unknown',
        message: rpcMessage(
          error,
          'Menta could not confirm whether the join completed.'
        ),
      };
    }

    const receipt = decodeReceiptEnvelope(
      data,
      'CHALLENGE_JOIN',
      'JOIN_CONFIRMED'
    );
    if (
      receipt &&
      challengeJoinReceiptMatchesRequest(receipt, {
        clientEventId: input.clientEventId,
        challengeId: input.expectedChallengeId,
        quoteId: input.quoteId,
      })
    ) {
      return { kind: 'confirmed', receipt };
    }
    if (receipt) {
      return {
        kind: 'unknown',
        message: translate('en-NZ', 'groups.funding.receipt_mismatch'),
      };
    }

    const failure = decodeChallengeJoinFailure(data, 'CHALLENGE_JOIN');
    if (failure) return { kind: 'failure', failure };

    return {
      kind: 'unknown',
      message: translate('en-NZ', 'groups.funding.join_unknown'),
    };
  } catch (error) {
    return {
      kind: 'unknown',
      message: rpcMessage(
        error,
        translate('en-NZ', 'groups.funding.join_unknown')
      ),
    };
  }
};

export const readChallengeJoinStatus = async (input: {
  challengeId: string;
  clientEventId: string;
  quoteId?: string;
}): Promise<ChallengeJoinStatusResult> => {
  try {
    const { data, error } = await supabase.rpc(
      'read_promise_accountability_join_status_v2',
      {
        p_challenge_id: input.challengeId,
        p_client_event_id: input.clientEventId,
      }
    );

    if (error) {
      return {
        kind: 'unavailable',
        message: rpcMessage(
          error,
          translate('en-NZ', 'groups.funding.status_unavailable')
        ),
      };
    }

    const receipt = decodeReceiptEnvelope(
      data,
      'CHALLENGE_JOIN_STATUS',
      'RECEIPT_FOUND'
    );
    if (
      receipt &&
      challengeJoinReceiptMatchesRequest(receipt, {
        clientEventId: input.clientEventId,
        challengeId: input.challengeId,
        quoteId: input.quoteId,
      })
    ) {
      return { kind: 'confirmed', receipt };
    }
    if (receipt) {
      return {
        kind: 'unavailable',
        message: translate('en-NZ', 'groups.funding.status_receipt_mismatch'),
      };
    }

    const status = decodeStatusSnapshotEnvelope(data);
    if (status?.challengeId === input.challengeId) {
      return { kind: 'snapshot', status };
    }
    if (status) {
      return {
        kind: 'unavailable',
        message: translate(
          'en-NZ',
          'groups.funding.status_membership_mismatch'
        ),
      };
    }

    const failure = decodeChallengeJoinFailure(data, 'CHALLENGE_JOIN_STATUS');
    if (failure) return { kind: 'failure', failure };

    return {
      kind: 'unavailable',
      message: translate('en-NZ', 'groups.funding.status_unknown'),
    };
  } catch (error) {
    return {
      kind: 'unavailable',
      message: rpcMessage(
        error,
        translate('en-NZ', 'groups.funding.status_unavailable')
      ),
    };
  }
};

export const formatChallengeJoinDue = (
  dueAt: string | null,
  timeZone?: string
): string => {
  if (!dueAt || !isIsoTimestamp(dueAt)) return 'Open group';

  try {
    return new Intl.DateTimeFormat('en-NZ', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    })
      .format(new Date(dueAt))
      .replace(',', ' ·');
  } catch {
    return 'Open group';
  }
};
