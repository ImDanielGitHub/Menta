export type PromiseSubmissionState = {
  hasSubmittedToday: boolean;
  submissionStatus: 'none' | 'pending' | 'approved' | 'rejected';
  canSubmit: boolean;
  shouldShowPending: boolean;
  shouldShowApproved: boolean;
  shouldShowRejected: boolean;
};

export const unconfirmedPromiseSubmissionState: PromiseSubmissionState = {
  hasSubmittedToday: false,
  submissionStatus: 'none',
  canSubmit: false,
  shouldShowPending: false,
  shouldShowApproved: false,
  shouldShowRejected: false,
};

/**
 * A failed status read cannot prove that no proof exists. Preserve the last
 * confirmed state and let the caller block mutations until another read
 * succeeds.
 */
export const preservePromiseSubmissionStateAfterReadFailure = (
  confirmedState: PromiseSubmissionState
): PromiseSubmissionState => confirmedState;
