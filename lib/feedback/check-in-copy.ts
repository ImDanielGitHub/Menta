import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

type Translate = (key: TranslationKey, values?: TranslationValues) => string;

const defaultTranslate: Translate = (key, values) =>
  translate('en-NZ', key, values);

/** Localized first-promise check-in copy; the host retains its rating and feedback actions. */
export const getFeedbackCheckInCopy = (t: Translate = defaultTranslate) => ({
  accessibilityLabel: t('domain.feedback.checkin.a11y'),
  heading: t('domain.feedback.checkin.heading'),
  body: t('domain.feedback.checkin.body'),
  working: t('domain.feedback.checkin.working'),
  better: t('domain.feedback.checkin.better'),
  notNow: t('domain.feedback.checkin.not_now'),
});
