import { buildReviewReminderDigests } from '../review-digest';

describe('review reminder digest', () => {
  it('creates one bounded digest per reviewer without private content', () => {
    expect(
      buildReviewReminderDigests([
        { reviewer_id: 'reviewer-1', pending_count: 2 },
        { reviewer_id: 'reviewer-1', pending_count: 1 },
        { reviewer_id: 'reviewer-2', pending_count: 1 },
      ])
    ).toEqual([
      { reviewerId: 'reviewer-1', pendingCount: 3 },
      { reviewerId: 'reviewer-2', pendingCount: 1 },
    ]);
  });

  it('ignores missing reviewers and normalises unusable counts', () => {
    expect(
      buildReviewReminderDigests([
        { reviewer_id: '', pending_count: 3 },
        { reviewer_id: 'reviewer-1', pending_count: Number.NaN },
      ])
    ).toEqual([{ reviewerId: 'reviewer-1', pendingCount: 1 }]);
  });
});
