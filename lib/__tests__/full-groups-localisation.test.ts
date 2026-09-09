import { translate } from '@/lib/localization';

describe('full groups localisation catalogue', () => {
  it('selects singular and plural group counts', () => {
    expect(translate('en-NZ', 'groups.preview.member', { count: 1 })).toBe(
      '1 member'
    );
    expect(translate('en-NZ', 'groups.preview.member', { count: 3 })).toBe(
      '3 members'
    );
    expect(translate('en-NZ', 'groups.preview.promise', { count: 1 })).toBe(
      '1 promise'
    );
  });

  it('keeps group names and costs as interpolated values', () => {
    expect(
      translate('en-NZ', 'groups.join.review_title', {
        name: 'Morning Miles',
      })
    ).toBe('Join Morning Miles?');
    expect(translate('en-NZ', 'groups.join.confirm', { cost: 50 })).toBe(
      'Join with 50 Momenta'
    );
    expect(
      translate('en-NZ', 'groups.invite.qr_label', { code: 'WALK7K2' })
    ).toContain('WALK7K2');
  });
});
