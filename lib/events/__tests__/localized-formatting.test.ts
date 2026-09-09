import {
  formatEventCompletedDate,
  formatEventDateTime,
  formatEventShortDateTime,
} from '@/lib/events/localized-formatting';
import { translate } from '@/lib/localization';

describe('event localisation', () => {
  it('keeps event messages whole while interpolating counts and names', () => {
    expect(
      translate('en-NZ', 'events.review.pending_count', { count: 1 })
    ).toBe('1 photo needs a decision.');
    expect(
      translate('en-NZ', 'events.review.pending_count', { count: 3 })
    ).toBe('3 photos need a decision.');
    expect(
      translate('en-NZ', 'events.review.item_accessibility', {
        attendee: 'Aroha',
        status: 'QR check-in confirmed · photo ready',
      })
    ).toBe('Review Aroha: QR check-in confirmed · photo ready');
  });

  it('formats event dates with the active locale and uses a safe fallback', () => {
    const value = '2026-08-23T09:30:00.000Z';
    const english = formatEventDateTime({
      value,
      locale: 'en-NZ',
      timeZone: 'Pacific/Auckland',
      fallback: 'Time to be confirmed',
    });
    const french = formatEventDateTime({
      value,
      locale: 'fr-FR',
      timeZone: 'Pacific/Auckland',
      fallback: 'Time to be confirmed',
    });

    expect(english).not.toBe(french);
    expect(
      formatEventShortDateTime({
        value: 'not-a-date',
        locale: 'en-NZ',
        fallback: 'Time unavailable',
      })
    ).toBe('Time unavailable');
    expect(
      formatEventCompletedDate({
        value,
        locale: 'en-NZ',
        timeZone: 'Pacific/Auckland',
        fallback: 'Event completed',
      })
    ).toContain('2026');
  });
});
