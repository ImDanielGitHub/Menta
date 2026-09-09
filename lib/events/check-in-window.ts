import { translate } from '@/lib/localization';

/**
 * Attendee check-in copy. Publishing sets check-in to open 30 minutes before
 * `starts_at` and close at `ends_at`. The client names that window; the
 * server still enforces it.
 */

export const EVENT_CHECK_IN_OPENS_MINUTES_BEFORE = 30;

export const EVENT_CHECK_IN_WINDOW_COPY = translate(
  'en-NZ',
  'events.check_in.window_copy'
);

export const getEventJoinHelperCopy = (): string =>
  translate('en-NZ', 'events.detail.join_helper');

export const getEventJoinedReceiptCopy = (): string =>
  translate('en-NZ', 'events.detail.joined_receipt');

export const getEventCheckInFactDetail = (): string =>
  translate('en-NZ', 'events.check_in.fact_detail');

export const getEventCheckInEntryCopy = (): string =>
  translate('en-NZ', 'events.check_in.entry_details');

export function isEventCheckInWindowClosed(code?: string | null): boolean {
  return (code ?? '').trim().toUpperCase() === 'CHECKIN_UNAVAILABLE';
}

export function getEventCheckInRejectedCopy(
  code?: string | null,
  message?: string | null
): { title: string; description: string } {
  if (isEventCheckInWindowClosed(code)) {
    return {
      title: translate('en-NZ', 'events.check_in.closed_title'),
      description: translate('en-NZ', 'events.check_in.closed_body'),
    };
  }

  const reason =
    (message ?? '').trim() ||
    translate('en-NZ', 'events.check_in.rejected_reason');
  return {
    title: translate('en-NZ', 'events.check_in.rejected_title'),
    description: translate('en-NZ', 'events.check_in.rejected_body', {
      reason,
    }),
  };
}
