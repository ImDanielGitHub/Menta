import {
  buildReviewQueueDeepLink,
  buildReviewQueuePath,
  buildReviewQueueRouteParams,
  normalizeReviewQueueParams,
} from '@/lib/navigation/review-queue-params';

describe('review queue params', () => {
  it('normalizes Expo Router string and array search params', () => {
    expect(
      normalizeReviewQueueParams({
        groupId: ['group-1', 'ignored'],
        challengeId: 'challenge-1',
        submissionId: ['submission-1'],
        entryPoint: ['proof_receipt'],
      })
    ).toEqual({
      groupId: 'group-1',
      challengeId: 'challenge-1',
      submissionId: 'submission-1',
      entryPoint: 'proof_receipt',
    });
  });

  it('drops empty params before routing', () => {
    expect(
      buildReviewQueueRouteParams({
        groupId: ' ',
        challengeId: 'challenge-1',
        submissionId: '',
        entryPoint: ' ',
      })
    ).toEqual({
      challengeId: 'challenge-1',
    });
  });

  it('drops unknown entry points instead of trusting arbitrary route state', () => {
    expect(
      normalizeReviewQueueParams({
        groupId: 'group-1',
        entryPoint: 'somewhere_untrusted',
      })
    ).toEqual({
      groupId: 'group-1',
      challengeId: undefined,
      submissionId: undefined,
      entryPoint: undefined,
    });
  });

  it('builds notification-safe review queue deep links', () => {
    expect(
      buildReviewQueueDeepLink({
        groupId: 'group 1',
        challengeId: 'challenge/1',
        submissionId: 'submission+1',
        entryPoint: 'proof_receipt',
      })
    ).toBe(
      'review-queue?groupId=group+1&challengeId=challenge%2F1&submissionId=submission%2B1&entryPoint=proof_receipt'
    );
  });

  it('builds internal app paths for protected-route handoff', () => {
    expect(
      buildReviewQueuePath({
        challengeId: 'challenge-1',
        entryPoint: 'proof_receipt',
      })
    ).toBe('/review-queue?challengeId=challenge-1&entryPoint=proof_receipt');
  });
});
