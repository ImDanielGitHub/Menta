import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type Localise = (key: TranslationKey, values?: TranslationValues) => string;

const defaultTranslate: Localise = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Names a proof send that returned no recognised receipt message. Reuses the
 * existing failed-send receipt so the draft staying on the phone is still
 * named, without calling the promise a challenge.
 */
export function getProofSubmitFallbackCopy(
  localise: Localise = defaultTranslate
): string {
  return localise('todayProof.proof.failed_detail');
}
