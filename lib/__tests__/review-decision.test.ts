import {
  parseReviewDecision,
  ReviewDecisionError,
} from '@/lib/review-decision';

describe('review decision contract', () => {
  it('decodes a server-confirmed decision receipt', () => {
    expect(
      parseReviewDecision({
        success: true,
        data: {
          id: 'submission-1',
          status: 'approved',
          review_notes: null,
          reviewer_id: 'reviewer-1',
          reviewed_at: '2026-08-05T01:00:00.000Z',
        },
      })
    ).toEqual({
      success: true,
      receipt: {
        id: 'submission-1',
        status: 'approved',
        reviewNotes: null,
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-08-05T01:00:00.000Z',
      },
    });
  });

  it('keeps an already-decided result distinct from success', () => {
    expect(
      parseReviewDecision({
        success: false,
        code: 'ALREADY_DECIDED',
        message: 'This proof changed while you were reviewing it.',
        current_status: 'rejected',
      })
    ).toEqual({
      success: false,
      code: 'already_decided',
      message: 'This proof changed while you were reviewing it.',
      currentStatus: 'rejected',
    });
  });

  it('rejects an incomplete success payload instead of inventing a receipt', () => {
    expect(
      parseReviewDecision({ success: true, data: { status: 'approved' } })
    ).toMatchObject({ success: false, code: 'unknown' });
  });

  it('exposes typed conflict metadata to the review UI', () => {
    const error = new ReviewDecisionError('Reload proof', {
      code: 'changed_while_reviewing',
      currentStatus: 'approved',
    });

    expect(error.code).toBe('changed_while_reviewing');
    expect(error.currentStatus).toBe('approved');
  });
});
