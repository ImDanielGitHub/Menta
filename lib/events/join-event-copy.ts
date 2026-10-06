import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

export type JoinEventSkipContext = {
  signedIn: boolean;
  onboardingComplete: boolean;
};

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

/**
 * Skipping an event invite leaves the preview without joining.
 * Established accounts go to Events. Everyone else keeps onboarding.
 */
export function describeJoinEventSkipAction(
  context: JoinEventSkipContext,
  translateCopy: TranslateCopy = defaultTranslate
): string {
  return context.signedIn && context.onboardingComplete
    ? translateCopy('groups.source.accountability.event.browse_events')
    : translateCopy('groups.source.accountability.common.keep_browsing');
}
