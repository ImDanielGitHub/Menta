import { describeJoinPromiseSkipAction } from '@/lib/promises/join-promise-copy';

describe('join promise skip copy', () => {
  it('names Today as the destination for an established account', () => {
    expect(
      describeJoinPromiseSkipAction({
        signedIn: true,
        onboardingComplete: true,
      })
    ).toBe('Back to Today');
  });

  it('does not say Not now when the person is still setting up', () => {
    expect(
      describeJoinPromiseSkipAction({
        signedIn: true,
        onboardingComplete: false,
      })
    ).toBe('Keep browsing');
    expect(
      describeJoinPromiseSkipAction({
        signedIn: false,
        onboardingComplete: false,
      })
    ).toBe('Keep browsing');
  });
});
