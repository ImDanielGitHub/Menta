import {
  getPromiseActiveSheetCopy,
  getPromiseCompleteCopy,
  getPromiseProgressLabel,
  getPromiseRecoveryCopy,
  getPromiseReviewModelCopy,
  getPromiseStatusNote,
  getPromiseVisibilityLabel,
  getPromiseWaitingTitle,
} from '../promise-detail-copy';

describe('promise detail copy authority', () => {
  it('names that pending proof is already sent and does not need sending again', () => {
    expect(getPromiseStatusNote('pending')).toBe(
      'Your proof has been sent. No need to submit twice.'
    );
  });

  it('keeps due, at-risk, approved, and join notes as separate facts', () => {
    expect(getPromiseStatusNote('due')).toBe(
      'Do the action, then send one clear proof.'
    );
    expect(getPromiseStatusNote('at-risk')).toBe(
      'Submit one clear proof before the day closes.'
    );
    expect(getPromiseStatusNote('approved')).toBe(
      'Today is logged. If someone needs review, that is the next useful action.'
    );
    expect(getPromiseStatusNote('join')).toBe(
      'Join first, then submit proof with everyone else.'
    );
  });

  it('reuses the retry and still-counts receipts instead of inventing recovery copy', () => {
    expect(
      getPromiseRecoveryCopy({ rejected: true, atRiskWithoutToday: true })
    ).toBe(
      'A retry does not reset the whole promise. Send proof that clearly shows the completed action.'
    );
    expect(
      getPromiseRecoveryCopy({ rejected: false, atRiskWithoutToday: true })
    ).toBe('Today still counts. No outcome changes until proof is resolved.');
    expect(
      getPromiseRecoveryCopy({ rejected: false, atRiskWithoutToday: false })
    ).toBeNull();
  });

  it('does not label a group promise as private on the active sheet', () => {
    expect(getPromiseVisibilityLabel({ isSolo: true })).toBe('Only you');
    expect(
      getPromiseVisibilityLabel({ isSolo: false, groupName: 'Morning walk' })
    ).toBe('Morning walk');
    expect(getPromiseVisibilityLabel({ isSolo: false, groupName: '  ' })).toBe(
      'Group promise'
    );
  });

  it('keeps queued proof as a saved-device fact that is not counted yet', () => {
    expect(getPromiseActiveSheetCopy('queued', {})).toEqual({
      dueLabel: 'Saved on this device',
      prompt:
        'Menta has not confirmed delivery yet. Open the saved proof before adding another one.',
    });
  });

  it('keeps a protected day distinct from today’s still-due proof', () => {
    expect(
      getPromiseActiveSheetCopy('active', { protectedOutcome: true }).dueLabel
    ).toBe('Streak protected · Proof due today');
    expect(
      getPromiseActiveSheetCopy('active', { protectedOutcome: false }).dueLabel
    ).toBe('Proof due today');
  });

  it('names the kept-promise result as approved days, not a slogan', () => {
    const copy = getPromiseCompleteCopy({
      title: 'Walk before work',
      approvedDays: 18,
      totalDays: 30,
      isSolo: true,
    });
    expect(copy.cue).toBe('Promise complete');
    expect(copy.title).toBe('18 of 30 days were approved.');
    expect(copy.visibility).toBe('Private promise');
    expect(copy.reviewerSummary).toBe('you reviewed your own proof');
    expect(copy.shareMessage).toBe(
      'Walk before work: 18 of 30 days approved on Menta.'
    );
  });

  it('names the reviewer who has the waiting proof', () => {
    expect(getPromiseWaitingTitle('Alex')).toBe('Alex has your proof.');
    expect(getPromiseWaitingTitle('  ')).toBe(
      'Your proof is waiting for a reviewer.'
    );
  });

  it('quotes the real review model instead of inventing peer counts', () => {
    expect(
      getPromiseReviewModelCopy({
        isSolo: true,
        requiresPeerReview: false,
        reviewersRequired: 1,
      })
    ).toBe('Self-review');
    expect(
      getPromiseReviewModelCopy({
        isSolo: false,
        requiresPeerReview: false,
        reviewersRequired: 1,
      })
    ).toBe('No peer review');
    expect(
      getPromiseReviewModelCopy({
        isSolo: false,
        requiresPeerReview: true,
        reviewersRequired: 1,
      })
    ).toBe('1 peer review');
    expect(
      getPromiseReviewModelCopy({
        isSolo: false,
        requiresPeerReview: true,
        reviewersRequired: 2,
      })
    ).toBe('2 peer reviews');
  });

  it('names approved progress separately from the promise length', () => {
    expect(getPromiseProgressLabel({ approvedDays: 4, totalDays: 30 })).toBe(
      '4 of 30 approved'
    );
    expect(getPromiseProgressLabel({ totalDays: 21 })).toBe('21-day promise');
  });
});
