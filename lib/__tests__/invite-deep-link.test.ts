import { getInviteDeepLinkAction } from '@/lib/navigation/invite-deep-link';

describe('getInviteDeepLinkAction', () => {
  it('routes signed-in group links into the join-group handoff', () => {
    expect(
      getInviteDeepLinkAction('https://menta.quest/join?invite=abc123', true)
    ).toEqual({
      kind: 'open_group_join',
      code: 'ABC123',
    });
  });

  it('saves signed-out group links for auth/onboarding handoff', () => {
    expect(
      getInviteDeepLinkAction('menta://join?invite=abc123', false)
    ).toEqual({
      kind: 'save_group',
      code: 'ABC123',
    });
  });

  it('opens the inviter and promise preview before funding details', () => {
    expect(
      getInviteDeepLinkAction(
        'lockedinprod://join?type=challenge&code=fit2026',
        true
      )
    ).toEqual({
      kind: 'open_challenge_preview',
      code: 'FIT2026',
    });
  });

  it('saves challenge links while auth or onboarding is incomplete', () => {
    expect(
      getInviteDeepLinkAction(
        'https://menta.quest/join/challenge/fit2026',
        false
      )
    ).toEqual({
      kind: 'save_challenge',
      code: 'FIT2026',
    });
  });

  it('keeps malformed and unsupported links out of invite state', () => {
    expect(
      getInviteDeepLinkAction('https://example.com/join?invite=ABC123', false)
    ).toBeNull();
    expect(
      getInviteDeepLinkAction('menta://checkin?challengeId=1', false)
    ).toBeNull();
  });
});
