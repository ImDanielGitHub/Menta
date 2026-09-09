import { supabase } from '@/lib/supabase';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

export type PromiseMutationOperation = 'leave' | 'delete';

export type PromiseMutationTranslator = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const defaultTranslate: PromiseMutationTranslator = (key, values) =>
  translate('en-NZ', key, values);

export type PromiseMutationReceipt = {
  id: string;
  challengeId: string;
  clientEventId: string | null;
  idempotent: boolean;
  verifiedBy: 'mutation-response' | 'status-check';
};

export type PromiseMutationResult =
  | {
      outcome: 'confirmed';
      operation: PromiseMutationOperation;
      challengeId: string;
      code: string;
      message: string;
      receipt: PromiseMutationReceipt;
    }
  | {
      outcome: 'failed';
      operation: PromiseMutationOperation;
      challengeId: string;
      clientEventId: string | null;
      code: string;
      message: string;
      safeToRetry: boolean;
    }
  | {
      outcome: 'unknown';
      operation: PromiseMutationOperation;
      challengeId: string;
      clientEventId: string | null;
      code: string;
      message: string;
      recovery: 'status-check' | 'safe-retry';
      requiresStatusCheck: true;
    };

export type ReceiptBoundPromiseMutationRequest = {
  operation: PromiseMutationOperation;
  challengeId: string;
  clientEventId: string;
};

export type PromiseMutationRpcAttempt =
  | { contract: 'available'; result: PromiseMutationResult }
  | { contract: 'unavailable' };

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const serverOperation = (operation: PromiseMutationOperation) =>
  operation === 'leave' ? 'PROMISE_ACCOUNTABILITY_LEAVE' : 'PROMISE_DELETE';

const rpcName = (operation: PromiseMutationOperation) =>
  operation === 'leave'
    ? 'leave_promise_accountability_v2'
    : 'delete_accountability_challenge_v2';

const defaultUnknownMessage = (
  operation: PromiseMutationOperation,
  localise: PromiseMutationTranslator = defaultTranslate
) =>
  operation === 'leave'
    ? localise('todayProof.promise.leave_result_unknown')
    : localise('todayProof.promise.delete_result_unknown');

export const confirmedPromiseMutation = ({
  operation,
  challengeId,
  code,
  message,
  receiptId,
  clientEventId,
  idempotent = false,
  verifiedBy = 'mutation-response',
}: {
  operation: PromiseMutationOperation;
  challengeId: string;
  code: string;
  message: string;
  receiptId: string;
  clientEventId: string | null;
  idempotent?: boolean;
  verifiedBy?: PromiseMutationReceipt['verifiedBy'];
}): PromiseMutationResult => ({
  outcome: 'confirmed',
  operation,
  challengeId,
  code,
  message,
  receipt: {
    id: receiptId,
    challengeId,
    clientEventId,
    idempotent,
    verifiedBy,
  },
});

export const failedPromiseMutation = ({
  operation,
  challengeId,
  clientEventId,
  code,
  message,
  safeToRetry = false,
}: {
  operation: PromiseMutationOperation;
  challengeId: string;
  clientEventId: string | null;
  code: string;
  message: string;
  safeToRetry?: boolean;
}): PromiseMutationResult => ({
  outcome: 'failed',
  operation,
  challengeId,
  clientEventId,
  code,
  message,
  safeToRetry,
});

export const unknownPromiseMutation = ({
  operation,
  challengeId,
  clientEventId,
  code = 'RESULT_UNKNOWN',
  message,
  recovery = 'status-check',
  localise = defaultTranslate,
}: {
  operation: PromiseMutationOperation;
  challengeId: string;
  clientEventId: string | null;
  code?: string;
  message?: string;
  recovery?: Extract<PromiseMutationResult, { outcome: 'unknown' }>['recovery'];
  localise?: PromiseMutationTranslator;
}): PromiseMutationResult => {
  const resolvedMessage = message ?? defaultUnknownMessage(operation, localise);
  return {
    outcome: 'unknown',
    operation,
    challengeId,
    clientEventId,
    code,
    message: resolvedMessage,
    recovery,
    requiresStatusCheck: true,
  };
};

const envelopeMessage = (
  operation: PromiseMutationOperation,
  outcome: unknown,
  code: string,
  localise: PromiseMutationTranslator
): string => {
  if (outcome === 'confirmed') {
    if (operation === 'delete') {
      return localise('todayProof.promise.deleted');
    }
    return code === 'ALREADY_LEFT'
      ? localise('todayProof.promise.already_left')
      : localise('todayProof.promise.left_detail');
  }
  if (outcome === 'failed') {
    return code === 'AUTH_REQUIRED'
      ? localise('domain.auth.authentication_required')
      : localise('todayProof.promise.not_changed');
  }
  return defaultUnknownMessage(operation, localise);
};

const rpcContractUnavailable = (
  error: unknown,
  operation: PromiseMutationOperation
) => {
  if (!isRecord(error)) return false;
  const code = stringValue(error.code);
  const message = stringValue(error.message) ?? '';
  const expectedRpc = rpcName(operation);
  return (
    code === 'PGRST202' ||
    (message.includes('Could not find the function') &&
      message.includes(expectedRpc))
  );
};

export const decodePromiseMutationEnvelope = (
  value: unknown,
  request: ReceiptBoundPromiseMutationRequest,
  verifiedBy: PromiseMutationReceipt['verifiedBy'],
  localise: PromiseMutationTranslator = defaultTranslate
): PromiseMutationResult => {
  const envelope = isRecord(value) ? value : null;
  if (
    !envelope ||
    envelope.operation !== serverOperation(request.operation) ||
    (envelope.client_event_id !== undefined &&
      envelope.client_event_id !== request.clientEventId)
  ) {
    return unknownPromiseMutation({
      ...request,
      code: 'RECEIPT_MISMATCH',
      message: localise('todayProof.promise.result_mismatch'),
    });
  }

  const code = stringValue(envelope.code) ?? 'UNRECOGNISED_RESULT';
  // The server message is diagnostic/provider copy. Keep the stable result
  // code as protocol data and derive all customer copy from a literal key so
  // the installed locale, not the backend language, owns what is displayed.
  const message = envelopeMessage(
    request.operation,
    envelope.outcome,
    code,
    localise
  );

  if (envelope.outcome === 'confirmed') {
    const receipt = isRecord(envelope.receipt) ? envelope.receipt : null;
    const receiptId = receipt ? stringValue(receipt.receipt_id) : null;
    if (
      !receipt ||
      !receiptId ||
      receipt.challenge_id !== request.challengeId ||
      receipt.client_event_id !== request.clientEventId
    ) {
      return unknownPromiseMutation({
        ...request,
        code: 'RECEIPT_MISMATCH',
        message: localise('todayProof.promise.confirmation_mismatch'),
      });
    }

    return confirmedPromiseMutation({
      operation: request.operation,
      challengeId: request.challengeId,
      clientEventId: request.clientEventId,
      code,
      message,
      receiptId,
      idempotent: envelope.idempotent === true || receipt.idempotent === true,
      verifiedBy,
    });
  }

  if (envelope.outcome === 'failed') {
    return failedPromiseMutation({
      operation: request.operation,
      challengeId: request.challengeId,
      clientEventId: request.clientEventId,
      code,
      message,
      safeToRetry: envelope.safe_to_retry === true,
    });
  }

  return unknownPromiseMutation({
    ...request,
    code,
    message,
  });
};

const callReceiptBoundPromiseMutation = async (
  request: ReceiptBoundPromiseMutationRequest,
  checkOnly: boolean,
  localise: PromiseMutationTranslator = defaultTranslate
): Promise<PromiseMutationRpcAttempt> => {
  try {
    const response =
      request.operation === 'leave'
        ? await supabase.rpc('leave_promise_accountability_v2', {
            p_challenge_id: request.challengeId,
            p_client_event_id: request.clientEventId,
            p_check_only: checkOnly,
          })
        : await supabase.rpc('delete_accountability_challenge_v2', {
            p_challenge_id: request.challengeId,
            p_client_event_id: request.clientEventId,
            p_check_only: checkOnly,
          });

    if (response.error) {
      if (rpcContractUnavailable(response.error, request.operation)) {
        return { contract: 'unavailable' };
      }
      return {
        contract: 'available',
        result: unknownPromiseMutation({
          ...request,
          message: defaultUnknownMessage(request.operation, localise),
        }),
      };
    }

    return {
      contract: 'available',
      result: decodePromiseMutationEnvelope(
        response.data,
        request,
        checkOnly ? 'status-check' : 'mutation-response',
        localise
      ),
    };
  } catch {
    return {
      contract: 'available',
      result: unknownPromiseMutation({
        ...request,
        message: defaultUnknownMessage(request.operation, localise),
      }),
    };
  }
};

export const submitReceiptBoundPromiseMutation = (
  request: ReceiptBoundPromiseMutationRequest,
  localise: PromiseMutationTranslator = defaultTranslate
) => callReceiptBoundPromiseMutation(request, false, localise);

export const readReceiptBoundPromiseMutationStatus = (
  request: ReceiptBoundPromiseMutationRequest,
  localise: PromiseMutationTranslator = defaultTranslate
) => callReceiptBoundPromiseMutation(request, true, localise);
