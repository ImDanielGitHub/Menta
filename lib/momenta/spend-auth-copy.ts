import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * spendMomenta can see a missing session after the wallet already has an
 * account id. Nothing was spent. The person needs to sign in again.
 */
export function getMomentaSpendSignInCopy(
  translateCopy: TranslateCopy = defaultTranslate
): { title: string; detail: string } {
  return {
    title: translateCopy('sourceGate.momenta.loginRequired'),
    detail: translateCopy('sourceGate.momenta.loginRequiredDetail'),
  };
}
