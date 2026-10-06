/** Connection failures are recoverable; HTTP failures still need reporting. */
export const isAuthTransportError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const record = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
  };
  return (
    record.name === 'AuthRetryableFetchError' &&
    (record.status === undefined || record.status === 0) &&
    typeof record.message === 'string' &&
    /network|fetch failed|failed to fetch|load failed|connection.*lost/i.test(
      record.message
    )
  );
};
