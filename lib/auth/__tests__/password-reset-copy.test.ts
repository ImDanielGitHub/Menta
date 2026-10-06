import { formatPasswordResetResendTime } from '@/lib/auth/password-reset-copy';

describe('password reset resend time', () => {
  const morning = Date.UTC(2026, 8, 22, 21, 7, 0);

  it('formats the wait in the account language instead of en-NZ only', () => {
    const english = formatPasswordResetResendTime(morning, 'en-NZ');
    const german = formatPasswordResetResendTime(morning, 'de-DE');

    expect(english.length).toBeGreaterThan(0);
    expect(german.length).toBeGreaterThan(0);
    expect(german).not.toBe(english);
  });

  it('falls back to en-NZ when the locale is not a valid tag', () => {
    expect(formatPasswordResetResendTime(morning, 'not a locale')).toBe(
      formatPasswordResetResendTime(morning, 'en-NZ')
    );
  });
});
