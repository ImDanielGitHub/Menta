import {
  preservePromiseSubmissionStateAfterReadFailure,
  unconfirmedPromiseSubmissionState,
  type PromiseSubmissionState,
} from '@/lib/promise-submission-read';

describe('promise submission status read boundary', () => {
  it('blocks sending until the first authoritative status read succeeds', () => {
    expect(unconfirmedPromiseSubmissionState.canSubmit).toBe(false);
    expect(unconfirmedPromiseSubmissionState.shouldShowApproved).toBe(false);
    expect(unconfirmedPromiseSubmissionState.shouldShowPending).toBe(false);
  });

  it('retains a confirmed pending state after a later read failure', () => {
    const pending: PromiseSubmissionState = {
      hasSubmittedToday: true,
      submissionStatus: 'pending',
      canSubmit: false,
      shouldShowPending: true,
      shouldShowApproved: false,
      shouldShowRejected: false,
    };

    expect(preservePromiseSubmissionStateAfterReadFailure(pending)).toBe(
      pending
    );
  });

  it('does not translate a failed read into a fresh submit state', () => {
    const failedRead = preservePromiseSubmissionStateAfterReadFailure(
      unconfirmedPromiseSubmissionState
    );

    expect(failedRead.canSubmit).toBe(false);
  });
});
