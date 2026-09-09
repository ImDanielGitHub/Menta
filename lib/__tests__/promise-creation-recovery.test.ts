import {
  decodePromiseCreationError,
  getPromiseCreationRecovery,
} from '@/lib/promise-creation-recovery';

describe('promise creation recovery', () => {
  it('strictly decodes only known primitive error fields', () => {
    expect(
      decodePromiseCreationError({
        code: 409,
        message: '  Request timed out  ',
        name: ['AbortError'],
      })
    ).toEqual({
      code: null,
      message: 'Request timed out',
      name: null,
    });
  });

  it('blocks duplicate retry when a transport failure leaves the result unknown', () => {
    expect(
      getPromiseCreationRecovery(
        new Error('Network request failed before a response arrived')
      )
    ).toMatchObject({
      kind: 'unknown-result',
      title: 'Creation result unknown',
    });
  });

  it('routes an expired session to sign-in recovery', () => {
    expect(
      getPromiseCreationRecovery({ message: 'JWT expired', code: 'PGRST301' })
    ).toMatchObject({
      kind: 'session-expired',
      title: 'Sign in again',
    });
  });

  it('keeps definite failures retryable', () => {
    expect(
      getPromiseCreationRecovery({
        message: 'Title is required',
        code: '23514',
      })
    ).toEqual({
      kind: 'retryable',
      title: 'Promise not created',
      message: 'Title is required',
    });
  });

  it('names the live-promise cap instead of repeating the server code', () => {
    expect(
      getPromiseCreationRecovery({
        message: 'QUOTA_ACTIVE_PROMISES',
      })
    ).toMatchObject({
      kind: 'quota-active',
      title: 'You’re at the free promise limit',
    });
  });

  it('localises quota and missing-error recovery copy together', () => {
    expect(
      getPromiseCreationRecovery({ message: 'QUOTA_ACTIVE_PROMISES' }, 'de-DE')
    ).toMatchObject({
      kind: 'quota-active',
      title: 'Kostenloses Versprechen-Limit erreicht',
    });
    expect(getPromiseCreationRecovery({ message: '' }, 'de-DE').message).toBe(
      'Menta konnte dieses Versprechen nicht erstellen.'
    );
  });
});
