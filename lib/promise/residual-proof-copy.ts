import type { TranslationKey } from '@/lib/localization/en-NZ';
import { translate } from '@/lib/localization/translate';

type Translate = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

export type ResidualSavedProofCopy = {
  title: string;
  detail: string;
  checkAgain: string;
};

/**
 * Saved proof that has not been confirmed yet. Today does not count until
 * Menta confirms it. Do not mention a server receipt or invite a second send.
 */
export const getResidualSavedProofCopy = (
  t: Translate = defaultTranslate
): ResidualSavedProofCopy => ({
  title: t('todayProof.residual.not_counted_yet'),
  detail: t(
    'todayProof.residual.the_saved_proof_remains_on_this_device_until_menta_confirms_the_'
  ),
  checkAgain: t(
    'todayProof.residual.check_the_current_server_status_before_sending_or_retrying_proof'
  ),
});
