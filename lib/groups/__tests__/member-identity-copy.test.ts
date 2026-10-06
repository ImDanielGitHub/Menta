import { resolveGroupMemberIdentityName } from '@/lib/groups/member-identity-copy';
import { translate } from '@/lib/localization/translate';

describe('group member identity copy', () => {
  it('keeps a display name or username when one exists', () => {
    expect(
      resolveGroupMemberIdentityName({
        displayName: 'Mia Chen',
        username: 'mia',
      })
    ).toBe('Mia Chen');
    expect(
      resolveGroupMemberIdentityName({
        displayName: '   ',
        username: 'mia',
      })
    ).toBe('mia');
  });

  it('names an unnamed member as Member instead of a UUID fragment', () => {
    expect(
      resolveGroupMemberIdentityName({
        displayName: null,
        username: '',
      })
    ).toBe('Member');
    expect(
      resolveGroupMemberIdentityName({
        displayName: null,
        username: null,
      })
    ).toBe(translate('en-NZ', 'groups.source.member.fallback'));
    expect(
      resolveGroupMemberIdentityName({
        displayName: '  ',
        username: '  ',
      })
    ).not.toMatch(/[0-9a-f]{8}/i);
  });

  it('uses the active translator so unnamed members can localise', () => {
    expect(
      resolveGroupMemberIdentityName(
        { displayName: null, username: null },
        key => translate('de-DE', key)
      )
    ).toBe('Mitglied');
  });
});
