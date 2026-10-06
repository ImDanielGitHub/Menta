import { describeJoinEventSkipAction } from '@/lib/events/join-event-copy';

describe('join event skip copy', () => {
  it('names Events as the destination for an established account', () => {
    expect(
      describeJoinEventSkipAction({
        signedIn: true,
        onboardingComplete: true,
      })
    ).toBe('Browse events');
  });

  it('does not say Not now when the person is still setting up', () => {
    expect(
      describeJoinEventSkipAction({
        signedIn: true,
        onboardingComplete: false,
      })
    ).toBe('Keep browsing');
    expect(
      describeJoinEventSkipAction({
        signedIn: false,
        onboardingComplete: false,
      })
    ).toBe('Keep browsing');
  });
});
