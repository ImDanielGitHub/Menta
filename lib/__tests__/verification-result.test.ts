import { getVerificationOutcome } from '@/lib/verification-result';

describe('getVerificationOutcome', () => {
  it('treats approved status as solo by default', () => {
    const outcome = getVerificationOutcome({
      status: 'approved',
    });

    expect(outcome).toEqual({
      status: 'approved',
      isSolo: true,
    });
  });

  it('uses nested data fields when present', () => {
    const outcome = getVerificationOutcome({
      data: {
        status: 'pending',
        allowSelfReview: false,
      },
    });

    expect(outcome).toEqual({
      status: 'pending',
      isSolo: false,
    });
  });

  it('returns unknown for unsupported status values', () => {
    const outcome = getVerificationOutcome({
      status: 'other',
      allowSelfReview: false,
    });

    expect(outcome).toEqual({
      status: 'unknown',
      isSolo: false,
    });
  });
});
