import {
  decodePromiseDetailLoadFailure,
  getPromiseDetailRecovery,
} from '@/lib/promise-detail-recovery';

describe('promise detail recovery', () => {
  it('preserves a typed PGRST116 fact instead of flattening it into a string', () => {
    const failure = decodePromiseDetailLoadFailure({
      code: 'PGRST116',
      status: 406,
      message: 'JSON object requested, multiple (or no) rows returned',
    });

    expect(failure).toEqual({
      code: 'PGRST116',
      status: 406,
      message: 'JSON object requested, multiple (or no) rows returned',
      name: null,
    });
    expect(getPromiseDetailRecovery({ failure, isOnline: true })).toMatchObject(
      {
        kind: 'not-found',
        primaryLabel: 'Go back',
        canRetry: false,
      }
    );
  });

  it('keeps an expired session, RLS denial, and network failure distinct', () => {
    expect(
      getPromiseDetailRecovery({
        failure: decodePromiseDetailLoadFailure({
          code: '42501',
          status: 403,
          message: 'AUTH_SESSION_REVOKED',
        }),
        isOnline: true,
      })
    ).toMatchObject({ kind: 'session-expired', primaryLabel: 'Sign in' });

    expect(
      getPromiseDetailRecovery({
        failure: decodePromiseDetailLoadFailure({
          code: '42501',
          status: 403,
          message: 'new row violates row-level security policy',
        }),
        isOnline: true,
      })
    ).toMatchObject({ kind: 'access-denied', primaryLabel: 'Go back' });

    expect(
      getPromiseDetailRecovery({
        failure: decodePromiseDetailLoadFailure(
          new TypeError('Network request failed')
        ),
        isOnline: true,
      })
    ).toMatchObject({ kind: 'offline', canRetry: true });
  });

  it('does not turn an offline failure into a missing promise', () => {
    expect(
      getPromiseDetailRecovery({
        failure: null,
        isOnline: false,
      })
    ).toMatchObject({
      kind: 'offline',
      title: 'Promise unavailable offline',
      canRetry: true,
    });
  });

  it('does not let uncertain reachability hide an explicit server outcome', () => {
    expect(
      getPromiseDetailRecovery({
        failure: decodePromiseDetailLoadFailure({
          code: 'PGRST116',
          status: 406,
          message: 'No rows returned',
        }),
        isOnline: false,
      })
    ).toMatchObject({ kind: 'not-found', primaryLabel: 'Go back' });

    expect(
      getPromiseDetailRecovery({
        failure: decodePromiseDetailLoadFailure({
          code: '42501',
          status: 403,
          message: 'row-level security policy',
        }),
        isOnline: false,
      })
    ).toMatchObject({ kind: 'access-denied', primaryLabel: 'Go back' });
  });
});
