import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type Localise = (key: TranslationKey, values?: TranslationValues) => string;

const defaultTranslate: Localise = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Names the review-queue photo for VoiceOver. Reuses the same photo preview
 * receipt used on the sender’s proof surfaces. Video already has
 * `todayProof.review.video_submitted`.
 */
export function getReviewEvidenceImageAlt(
  localise: Localise = defaultTranslate
): string {
  return localise('todayProof.proof.photo_preview');
}
