import { describeFeedbackReviewCopy } from '../feedback-review-copy';

describe('feedback review copy', () => {
  it('names private delivery without mixing in report diagnostics', () => {
    const copy = describeFeedbackReviewCopy();

    expect(copy.privacy).toBe(
      'Your feedback and any screenshot you choose go privately to the Menta team.'
    );
    expect(copy.privacy).not.toContain('device diagnostics');
  });

  it('names sending as optional until the person is ready', () => {
    const copy = describeFeedbackReviewCopy();

    expect(copy.sendHelper).toBe(
      'Send when you are ready. You can go back and change anything.'
    );
    expect(copy.sendHelper).not.toContain('support reference');
  });
});
