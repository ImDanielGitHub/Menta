const FALLBACK_LOCALE = 'en-NZ';

/**
 * The resend-available clock uses the account language, not a
 * hardcoded New Zealand format.
 */
export function formatPasswordResetResendTime(
  availableAt: number,
  locale = FALLBACK_LOCALE
): string {
  const instant = new Date(availableAt);
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(instant);
  } catch {
    return new Intl.DateTimeFormat(FALLBACK_LOCALE, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(instant);
  }
}
