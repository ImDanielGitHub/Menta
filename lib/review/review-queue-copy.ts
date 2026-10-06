import type { TranslationKey } from '@/lib/localization/en-NZ';
import type { TranslationValues } from '@/lib/localization/translate';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type ReviewQueueFilter = 'all' | 'pending' | 'approved' | 'rejected';

/** Names the empty review filter in product language, never raw status tokens. */
export function getReviewQueueEmptyTitle(
  filterStatus: ReviewQueueFilter,
  t: TranslateCopy,
  options?: { entryPoint?: string }
): string {
  if (filterStatus === 'pending') {
    return options?.entryPoint === 'proof_receipt'
      ? t('todayProof.review.nothing_else')
      : t('todayProof.review.no_submissions');
  }
  if (filterStatus === 'approved') {
    return t('todayProof.review.empty_title_approved');
  }
  if (filterStatus === 'rejected') {
    return t('todayProof.review.empty_title_retry');
  }
  return t('todayProof.review.empty_title_all');
}
