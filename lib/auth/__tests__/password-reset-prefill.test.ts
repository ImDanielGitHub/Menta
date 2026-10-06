import {
  stagePasswordResetPrefill,
  takePasswordResetPrefill,
} from '@/lib/auth/password-reset-prefill';

describe('password reset email prefill', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns an opaque handoff and consumes the email once', () => {
    const id = stagePasswordResetPrefill('synthetic@example.invalid');
    expect(id).not.toContain('synthetic');
    expect(takePasswordResetPrefill(id)).toBe('synthetic@example.invalid');
    expect(takePasswordResetPrefill(id)).toBe('');
  });

  it('does not expose prefill to direct or unrelated route entry', () => {
    const id = stagePasswordResetPrefill('synthetic@example.invalid');
    expect(takePasswordResetPrefill()).toBe('');
    expect(takePasswordResetPrefill('unrelated')).toBe('');
    expect(takePasswordResetPrefill([id])).toBe('');
    expect(takePasswordResetPrefill(id)).toBe('synthetic@example.invalid');
  });

  it('expires an abandoned handoff', () => {
    const id = stagePasswordResetPrefill('synthetic@example.invalid');
    jest.advanceTimersByTime(60_000);
    expect(takePasswordResetPrefill(id)).toBe('');
  });

  it('replaces a prior attempt without allowing its expiry to clear the new one', () => {
    const first = stagePasswordResetPrefill('first@example.invalid');
    jest.advanceTimersByTime(30_000);
    const next = stagePasswordResetPrefill('next@example.invalid');
    jest.advanceTimersByTime(30_000);
    expect(takePasswordResetPrefill(first)).toBe('');
    expect(takePasswordResetPrefill(next)).toBe('next@example.invalid');
  });
});
