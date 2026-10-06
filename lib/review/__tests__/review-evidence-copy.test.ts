import { translate } from '@/lib/localization/translate';
import { getReviewEvidenceImageAlt } from '../review-evidence-copy';

describe('review evidence image alt', () => {
  it('names the photo with the existing proof preview receipt', () => {
    expect(getReviewEvidenceImageAlt()).toBe('Proof photo preview');
  });

  it('does not keep leftover English about proof submitted for review', () => {
    expect(getReviewEvidenceImageAlt()).not.toBe('Proof submitted for review');
  });

  it('uses the active locale instead of a hardcoded English alt', () => {
    expect(
      getReviewEvidenceImageAlt((key, values) =>
        translate('de-DE', key, values)
      )
    ).toBe(translate('de-DE', 'todayProof.proof.photo_preview'));
  });
});
