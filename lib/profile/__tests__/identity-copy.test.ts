import { getProfileIdentityMeta, getProfilePlanLabel } from '../identity-copy';

describe('You identity meta', () => {
  it('names a free account as Member, not an internal plan token', () => {
    expect(getProfilePlanLabel(false)).toBe('Member');
    expect(getProfileIdentityMeta('mia', false)).toBe('@mia · Member');
    expect(getProfileIdentityMeta('mia', false).toLowerCase()).not.toMatch(
      /free|plan|tier|subscriber/
    );
  });

  it('names confirmed Pro as Menta Pro', () => {
    expect(getProfilePlanLabel(true)).toBe('Menta Pro');
    expect(getProfileIdentityMeta('mia', true)).toBe('@mia · Menta Pro');
  });
});
