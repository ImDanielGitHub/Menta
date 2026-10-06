import { getLoginInviteSkipCopy } from '@/lib/auth/login-invite-skip-copy';
import { translate } from '@/lib/localization/translate';

describe('login invite skip copy', () => {
  it('names keeping onboarding instead of Not now', () => {
    expect(getLoginInviteSkipCopy()).toBe('Keep browsing');
    expect(getLoginInviteSkipCopy().toLowerCase()).not.toContain('not now');
  });

  it('does not rewrite the shared login Not now key', () => {
    expect(getLoginInviteSkipCopy()).toBe(
      translate('en-NZ', 'groups.source.accountability.common.keep_browsing')
    );
    expect(
      translate('en-NZ', 'groups.source.accountability.common.not_now')
    ).toBe('Not now');
  });
});
