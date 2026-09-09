import {
  isGroupMembershipError,
  isNonRetryableQueryError,
} from '@/lib/query-retry';

describe('query retry decisions', () => {
  it.each([
    { code: '42501', message: 'GROUP_MEMBERSHIP_REQUIRED' },
    { status: 403, message: 'Forbidden' },
    { code: '403', message: 'Forbidden' },
  ])('does not retry permanent group access failures', error => {
    expect(isGroupMembershipError(error)).toBe(true);
    expect(isNonRetryableQueryError(error)).toBe(true);
  });

  it('does not retry other client-side query failures', () => {
    expect(isNonRetryableQueryError({ status: 404 })).toBe(true);
    expect(isNonRetryableQueryError({ code: 'PGRST116' })).toBe(true);
  });

  it('keeps transient transport and server failures retryable', () => {
    expect(isNonRetryableQueryError(new Error('Network request failed'))).toBe(
      false
    );
    expect(isNonRetryableQueryError({ status: 503 })).toBe(false);
  });
});
