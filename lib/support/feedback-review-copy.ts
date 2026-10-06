import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type FeedbackReviewCopy = {
  privacy: string;
  sendHelper: string;
};

const copy = (
  key: TranslationKey,
  translateCopy?: TranslateCopy,
  values?: TranslationValues
): string =>
  translateCopy ? translateCopy(key, values) : translate('en-NZ', key, values);

export function describeFeedbackReviewCopy(
  translateCopy?: TranslateCopy
): FeedbackReviewCopy {
  return {
    privacy: copy('fullAuth.residual.report.feedback_privacy', translateCopy),
    sendHelper: copy(
      'fullAuth.residual.report.feedback_send_helper',
      translateCopy
    ),
  };
}
