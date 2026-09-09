import { translate } from '@/lib/localization';

type UnknownRecord = Record<string, unknown>;

export type PromiseDetailRecoveryKind =
  | 'session-expired'
  | 'offline'
  | 'access-denied'
  | 'not-found'
  | 'retryable';

export type PromiseDetailLoadFailure = {
  code: string | null;
  status: number | null;
  message: string | null;
  name: string | null;
};

export type PromiseDetailRecovery = {
  kind: PromiseDetailRecoveryKind;
  title: string;
  message: string;
  primaryLabel: string;
  canRetry: boolean;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const readStatus = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) ? value : null;

const includesAny = (value: string, terms: readonly string[]) =>
  terms.some(term => value.includes(term));

const summaryFor = (failure: PromiseDetailLoadFailure) =>
  `${failure.code ?? ''} ${failure.status ?? ''} ${failure.name ?? ''} ${
    failure.message ?? ''
  }`.toLowerCase();

/**
 * Preserve the query's typed failure facts while keeping raw technical text
 * out of the route UI. Supabase/PostgREST, fetch, and Error values do not
 * share one class, so this intentionally reads only primitive fields.
 */
export const decodePromiseDetailLoadFailure = (
  value: unknown
): PromiseDetailLoadFailure => {
  const details = isRecord(value) ? value : null;
  const error = value instanceof Error ? value : null;

  return {
    code: readString(details?.code),
    status: readStatus(details?.status),
    message: error?.message || readString(details?.message),
    name: readString(error?.name ?? details?.name),
  };
};

export const createPromiseDetailLoadFailure = (args: {
  code?: string | null;
  status?: number | null;
  message?: string | null;
  name?: string | null;
}): PromiseDetailLoadFailure => ({
  code: args.code?.trim() || null,
  status: args.status ?? null,
  message: args.message?.trim() || null,
  name: args.name?.trim() || null,
});

const isSessionFailure = (failure: PromiseDetailLoadFailure) => {
  const summary = summaryFor(failure);
  return (
    failure.status === 401 ||
    includesAny(summary, [
      'pgrst301',
      'session_required',
      'auth_required',
      'auth_session_revoked',
      'jwt expired',
      'session expired',
      'not authenticated',
      'invalid jwt',
      'authentication required',
      'unauthorized',
    ])
  );
};

const isAccessDeniedFailure = (failure: PromiseDetailLoadFailure) => {
  const summary = summaryFor(failure);
  return (
    failure.code === '42501' ||
    failure.status === 403 ||
    includesAny(summary, [
      'insufficient privilege',
      'permission denied',
      'row-level security',
      'rls',
      'forbidden',
    ])
  );
};

const isNetworkFailure = (failure: PromiseDetailLoadFailure) =>
  includesAny(summaryFor(failure), [
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

/**
 * Keep the detail route honest about why it cannot show a promise. In
 * particular, an RLS response, an offline fetch failure, and PGRST116 mean
 * materially different things and should never collapse into "not found".
 */
export const getPromiseDetailRecovery = (args: {
  failure: PromiseDetailLoadFailure | null;
  isOnline: boolean;
  locale?: string | null;
}): PromiseDetailRecovery => {
  const failure = args.failure;
  const locale = args.locale ?? 'en-NZ';

  if (failure && isSessionFailure(failure)) {
    return {
      kind: 'session-expired',
      title: translate(locale, 'todayProof.residual.sign_in_to_return'),
      message: translate(
        locale,
        'todayProof.residual.this_promise_needs_your_account_before_menta_can_show_its_proof_'
      ),
      primaryLabel: translate(locale, 'todayProof.create.sign_in'),
      canRetry: false,
    };
  }

  if (failure && isAccessDeniedFailure(failure)) {
    return {
      kind: 'access-denied',
      title: translate(
        locale,
        'todayProof.residual.promise_not_available_to_this_account'
      ),
      message: translate(
        locale,
        'todayProof.residual.menta_could_not_confirm_that_this_account_can_open_the_promise_a'
      ),
      primaryLabel: translate(locale, 'todayProof.solo.back'),
      canRetry: false,
    };
  }

  if (failure?.code === 'PGRST116' || failure?.code === 'ROUTE_NOT_FOUND') {
    return {
      kind: 'not-found',
      title: translate(locale, 'todayProof.residual.promise_unavailable'),
      message: translate(
        locale,
        'todayProof.residual.this_promise_could_not_be_found_for_the_current_account_it_may_h'
      ),
      primaryLabel: translate(locale, 'todayProof.solo.back'),
      canRetry: false,
    };
  }

  if (!args.isOnline || (failure && isNetworkFailure(failure))) {
    return {
      kind: 'offline',
      title: translate(
        locale,
        'todayProof.residual.promise_unavailable_offline'
      ),
      message: translate(
        locale,
        'todayProof.residual.menta_cannot_confirm_the_latest_promise_proof_or_review_state_wi'
      ),
      primaryLabel: translate(locale, 'todayProof.promise.try_again'),
      canRetry: true,
    };
  }

  return {
    kind: 'retryable',
    title: translate(locale, 'todayProof.residual.promise_could_not_load'),
    message: translate(
      locale,
      'todayProof.residual.menta_could_not_refresh_this_promise_retry_before_acting_on_a_mi'
    ),
    primaryLabel: translate(locale, 'todayProof.promise.try_again'),
    canRetry: true,
  };
};
