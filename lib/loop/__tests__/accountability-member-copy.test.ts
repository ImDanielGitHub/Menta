import { resolveAccountabilityMemberName } from '../accountability-member-copy';

describe('resolveAccountabilityMemberName', () => {
  it('keeps a real display name', () => {
    expect(resolveAccountabilityMemberName('Aroha Ngata', 'aroha')).toBe(
      'Aroha Ngata'
    );
  });

  it('uses the username when the display name is blank', () => {
    expect(resolveAccountabilityMemberName('   ', 'aroha')).toBe('aroha');
  });

  it('names an unnamed person as Member without a user-id fragment', () => {
    expect(resolveAccountabilityMemberName(null, null)).toBe('Member');
    expect(resolveAccountabilityMemberName('', '   ')).toBe('Member');
    expect(resolveAccountabilityMemberName(undefined, undefined)).toBe(
      'Member'
    );
    expect(resolveAccountabilityMemberName(null, null)).not.toMatch(
      /[0-9a-f]{8}/i
    );
  });

  it('uses the active translator for the unnamed fallback', () => {
    const t = jest.fn(() => 'Mitglied');
    expect(resolveAccountabilityMemberName(null, '', t)).toBe('Mitglied');
    expect(t).toHaveBeenCalledWith('groups.source.member.fallback');
  });
});
