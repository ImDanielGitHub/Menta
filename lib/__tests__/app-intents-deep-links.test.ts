import { getAppIntentDeepLinkAction } from '@/lib/app-intents/deep-links';

describe('getAppIntentDeepLinkAction', () => {
  it('normalizes custom-scheme check-in links where Expo puts the route in hostname', () => {
    expect(
      getAppIntentDeepLinkAction({
        hostname: 'checkin',
        path: null,
        queryParams: { challengeId: 'challenge-1' },
      })
    ).toEqual({
      type: 'checkin',
      challengeId: 'challenge-1',
    });
  });

  it('normalizes review queue links with optional review scope', () => {
    expect(
      getAppIntentDeepLinkAction({
        hostname: 'review-queue',
        queryParams: {
          challengeId: 'challenge-1',
          groupId: ['group-1'],
          submissionId: 'submission-1',
          entryPoint: 'proof_receipt',
        },
      })
    ).toEqual({
      type: 'reviewQueue',
      challengeId: 'challenge-1',
      groupId: 'group-1',
      submissionId: 'submission-1',
      entryPoint: 'proof_receipt',
    });

    expect(
      getAppIntentDeepLinkAction({
        hostname: 'review-queue',
        queryParams: {},
      })
    ).toEqual({
      type: 'reviewQueue',
      challengeId: undefined,
      groupId: undefined,
      submissionId: undefined,
      entryPoint: undefined,
    });
  });

  it('normalizes path-style review queue links from custom schemes and universal links', () => {
    expect(
      getAppIntentDeepLinkAction({
        hostname: null,
        path: 'review-queue',
        queryParams: {
          challengeId: 'challenge-1',
          entryPoint: 'proof_receipt',
        },
      })
    ).toEqual({
      type: 'reviewQueue',
      challengeId: 'challenge-1',
      groupId: undefined,
      submissionId: undefined,
      entryPoint: 'proof_receipt',
    });

    expect(
      getAppIntentDeepLinkAction({
        hostname: 'menta.quest',
        path: '/review-queue',
        queryParams: { submissionId: ['submission-1'] },
      })
    ).toEqual({
      type: 'reviewQueue',
      challengeId: undefined,
      groupId: undefined,
      submissionId: 'submission-1',
      entryPoint: undefined,
    });
  });

  it('normalizes join-by-code links for group and challenge targets', () => {
    expect(
      getAppIntentDeepLinkAction({
        hostname: 'join',
        queryParams: { code: 'GROUP1234', type: 'group' },
      })
    ).toEqual({
      type: 'join',
      code: 'GROUP1234',
      target: 'group',
    });

    expect(
      getAppIntentDeepLinkAction({
        hostname: 'join',
        queryParams: { code: 'CHAL1234', type: 'challenge' },
      })
    ).toEqual({
      type: 'join',
      code: 'CHAL1234',
      target: 'challenge',
    });
  });

  it('supports https path-style join links as a route shim contract', () => {
    expect(
      getAppIntentDeepLinkAction({
        hostname: 'menta.quest',
        path: 'join/GROUP1234',
        queryParams: {},
      })
    ).toEqual({
      type: 'join',
      code: 'GROUP1234',
      target: 'group',
    });

    expect(
      getAppIntentDeepLinkAction({
        hostname: 'lockedinpro.com',
        path: 'join/GROUP1234',
        queryParams: {},
      })
    ).toEqual({
      type: 'join',
      code: 'GROUP1234',
      target: 'group',
    });
  });
});
