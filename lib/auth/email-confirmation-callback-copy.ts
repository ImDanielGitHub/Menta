import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type Localise = (key: TranslationKey, values?: TranslationValues) => string;

const defaultTranslate: Localise = (key, values) =>
  translate('en-NZ', key, values);

export type EmailConfirmationCallbackPhase = 'checking' | 'confirmed';

/**
 * Names the email-confirmation callback while the link is exchanged and the
 * saved promise is restored. Reuses the existing restoring receipt so this
 * handoff stays in the same language as the waiting confirmation screen.
 */
export function getEmailConfirmationCallbackCopy(
  phase: EmailConfirmationCallbackPhase,
  localise: Localise = defaultTranslate
): string {
  switch (phase) {
    case 'checking':
    case 'confirmed':
      return localise('fullAuth.source.email_confirmation.restoring');
    default: {
      const exhaustive: never = phase;
      return exhaustive;
    }
  }
}
