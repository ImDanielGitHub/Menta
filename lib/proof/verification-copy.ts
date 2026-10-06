import type { TranslationKey } from '@/lib/localization/en-NZ';
import type { TranslationValues } from '@/lib/localization/translate';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type ProofSubmissionReceiptCode =
  'DAILY_SUBMISSION_EXISTS' | 'NOT_JOINED' | string;

/** Names why proof did not send without leaking server English. */
export function getProofSubmissionReceiptOverride(
  code: ProofSubmissionReceiptCode | null | undefined,
  t: TranslateCopy
): string | null {
  if (code === 'DAILY_SUBMISSION_EXISTS') {
    return t('todayProof.proof.already_sent');
  }
  if (code === 'NOT_JOINED') {
    return t('todayProof.proof.not_joined');
  }
  return null;
}

export function getProofFailedDetail(t: TranslateCopy): string {
  return t('todayProof.proof.failed_detail');
}

export function getTextProofValidationError(t: TranslateCopy): string {
  return t('todayProof.proof.text_too_generic');
}

export function getProofSafetyDisclosure(t: TranslateCopy): string {
  return t('todayProof.proof.safety_disclosure');
}
