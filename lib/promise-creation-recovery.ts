import { describeCreatePromiseQuotaError } from '@/lib/economy/create-promise-quote';
import {
  translate,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/localization';

type UnknownRecord = Record<string, unknown>;

export type PromiseCreationRecoveryKind =
  | 'session-expired'
  | 'unknown-result'
  | 'quota-active'
  | 'quota-monthly'
  | 'retryable';

export type PromiseCreationRecovery = {
  kind: PromiseCreationRecoveryKind;
  title: string;
  message: string;
};

export type DecodedPromiseCreationError = {
  code: string | null;
  message: string;
  name: string | null;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Decode only the primitive fields the creation UI needs. Supabase errors,
 * native fetch failures, and ordinary Error instances have different shapes;
 * the UI must not assume one of them is authoritative.
 */
export const decodePromiseCreationError = (
  value: unknown,
  locale = 'en-NZ'
): DecodedPromiseCreationError => {
  if (value instanceof Error) {
    const details = isRecord(value) ? value : null;
    return {
      code: readString(details?.code),
      message:
        value.message || translate(locale, 'todayProof.source.creation.failed'),
      name: readString(value.name),
    };
  }

  const details = isRecord(value) ? value : null;
  return {
    code: readString(details?.code),
    message:
      readString(details?.message) ??
      translate(locale, 'todayProof.source.creation.failed'),
    name: readString(details?.name),
  };
};

const includesAny = (value: string, terms: readonly string[]) =>
  terms.some(term => value.includes(term));

const isSessionFailure = (error: DecodedPromiseCreationError) => {
  const summary =
    `${error.code ?? ''} ${error.name ?? ''} ${error.message}`.toLowerCase();
  return includesAny(summary, [
    'jwt expired',
    'session expired',
    'not authenticated',
    'invalid jwt',
    'authentication required',
    'unauthorized',
  ]);
};

/**
 * A timeout or transport interruption can happen after the RPC reached the
 * server. Without an RPC idempotency key, retrying would risk a second promise,
 * so this state directs the person to inspect Today before another submit.
 */
const isAmbiguousTransportFailure = (error: DecodedPromiseCreationError) => {
  const summary =
    `${error.code ?? ''} ${error.name ?? ''} ${error.message}`.toLowerCase();
  return includesAny(summary, [
    'aborterror',
    'econnreset',
    'enetunreach',
    'etimedout',
    'failed to fetch',
    'network request failed',
    'network error',
    'socket',
    'timed out',
    'timeout',
  ]);
};

export const getPromiseCreationRecovery = (
  value: unknown,
  locale = 'en-NZ'
): PromiseCreationRecovery => {
  const error = decodePromiseCreationError(value, locale);

  if (isSessionFailure(error)) {
    return {
      kind: 'session-expired',
      title: translate(locale, 'todayProof.residual.sign_in_again'),
      message: translate(
        locale,
        'todayProof.residual.your_session_ended_before_menta_could_start_this_promise_sign_in'
      ),
    };
  }

  if (isAmbiguousTransportFailure(error)) {
    return {
      kind: 'unknown-result',
      title: translate(locale, 'todayProof.residual.creation_result_unknown'),
      message: translate(
        locale,
        'todayProof.residual.menta_did_not_receive_a_final_answer_we_cannot_say_whether_this_'
      ),
    };
  }

  const localise = (key: TranslationKey, values: TranslationValues = {}) =>
    translate(locale, key, values);
  const quota = describeCreatePromiseQuotaError(
    error.code,
    error.message,
    localise
  );
  if (quota) {
    return {
      kind: quota.reason === 'active' ? 'quota-active' : 'quota-monthly',
      title: quota.title,
      message: quota.message,
    };
  }

  return {
    kind: 'retryable',
    title: translate(locale, 'todayProof.residual.promise_not_created'),
    message: error.message,
  };
};
