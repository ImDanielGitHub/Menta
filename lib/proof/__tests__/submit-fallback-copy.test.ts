import { translate } from '@/lib/localization/translate';
import { getProofSubmitFallbackCopy } from '../submit-fallback-copy';

describe('proof submit fallback copy', () => {
  it('names an unrecognised send as a failed proof that stayed on the phone', () => {
    expect(getProofSubmitFallbackCopy()).toBe(
      'Proof was not sent. Check your connection and try again. Your draft stays here if it was saved locally.'
    );
  });

  it('does not call the promise a challenge', () => {
    expect(getProofSubmitFallbackCopy().toLowerCase()).not.toContain(
      'challenge'
    );
    expect(getProofSubmitFallbackCopy()).not.toBe(
      'Failed to submit challenge proof'
    );
  });

  it('uses the active locale instead of a hardcoded English fallback', () => {
    expect(
      getProofSubmitFallbackCopy((key, values) =>
        translate('de-DE', key, values)
      )
    ).toBe(translate('de-DE', 'todayProof.proof.failed_detail'));
  });
});
