import {
  resolveGroupInviteIdentityName,
  resolveGroupInviteSentenceName,
} from '../invite-copy';

describe('group invite name copy', () => {
  it('keeps a real group name for identity and sentence uses', () => {
    expect(resolveGroupInviteIdentityName('Morning walk group')).toBe(
      'Morning walk group'
    );
    expect(resolveGroupInviteSentenceName('Morning walk group')).toBe(
      'Morning walk group'
    );
  });

  it('does not call a missing name your group', () => {
    expect(resolveGroupInviteIdentityName('')).toBe('Group');
    expect(resolveGroupInviteIdentityName('   ')).toBe('Group');
    expect(resolveGroupInviteIdentityName(undefined)).toBe('Group');
    expect(resolveGroupInviteIdentityName(null)).toBe('Group');

    expect(resolveGroupInviteSentenceName('')).toBe('the group');
    expect(resolveGroupInviteSentenceName('   ')).toBe('the group');
    expect(resolveGroupInviteSentenceName(undefined)).toBe('the group');
    expect(resolveGroupInviteSentenceName(null)).toBe('the group');
  });
});
