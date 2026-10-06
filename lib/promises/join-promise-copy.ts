import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

export type JoinPromiseSkipContext = {
  signedIn: boolean;
  onboardingComplete: boolean;
};

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Skipping a promise invite leaves the preview without joining.
 * Established accounts go to Today. Everyone else keeps onboarding.
 */
export function describeJoinPromiseSkipAction(
  context: JoinPromiseSkipContext,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return context.signedIn && context.onboardingComplete
    ? translateCopy('groups.source.accountability.join_promise.back_today')
    : translateCopy('groups.source.accountability.common.keep_browsing');
}
