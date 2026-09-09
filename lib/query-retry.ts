type QueryErrorLike = {
  code?: unknown;
  message?: unknown;
  status?: unknown;
};

const normaliseError = (error: unknown): QueryErrorLike =>
  error && typeof error === 'object' ? (error as QueryErrorLike) : {};

export const isGroupMembershipError = (error: unknown): boolean => {
  const candidate = normaliseError(error);
  const code = String(candidate.code ?? candidate.status ?? '').toUpperCase();
  const message = String(candidate.message ?? '').toUpperCase();

  return (
    code === '42501' ||
    code === '401' ||
    code === '403' ||
    message.includes('GROUP_MEMBERSHIP_REQUIRED')
  );
};

export const isNonRetryableQueryError = (error: unknown): boolean => {
  const candidate = normaliseError(error);
  const status = Number(candidate.status);
  const code = String(candidate.code ?? '').toUpperCase();

  if (Number.isFinite(status) && status >= 400 && status < 500) return true;
  if (isGroupMembershipError(error)) return true;

  return (
    code === 'PGRST116' ||
    code.startsWith('PGRST3') ||
    code === '404' ||
    code === '409'
  );
};
