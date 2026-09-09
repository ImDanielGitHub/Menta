import { enNZ } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

describe('domain feedback localisation', () => {
  it('keeps lower-level error copy in complete templates', () => {
    expect(translate('en-NZ', 'domain.error.network')).toBe(
      'Connection issue detected. Please check your internet connection and try again.'
    );
    expect(translate('en-NZ', 'domain.events.photo_arrival_unknown')).toContain(
      'Check this photo before sending another one.'
    );
  });

  it('preserves placeholders in domain notification templates', () => {
    expect(
      translate('en-NZ', 'domain.notifications.group_activity_named', {
        memberName: 'Sam',
        groupName: 'Morning walk',
      })
    ).toBe('Sam has an update in Morning walk');
    expect(
      translate('en-NZ', 'domain.notifications.ending_in', {
        hours: 2,
        hourLabel: 'hours',
      })
    ).toBe('Ends in 2 hours');
  });

  it('exposes the complete domain catalogue through en-NZ', () => {
    expect(enNZ['domain.handoff.invite_saved']).toBe('Invite saved');
    expect(enNZ['domain.commitment.move_daily_description']).toContain(
      'A walk, workout, stretch, or sport all count.'
    );
  });
});
