import type { TranslationKey } from '@/lib/localization/en-NZ';
import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

export type NotificationPermissionOffCopy = {
  title: string;
  body: string;
  action: string;
  settings: string;
};

/**
 * Declining the OS permission is a skip, not a generic continue. Name the
 * result: the person keeps going without reminders.
 */
export function getNotificationPermissionOffCopy(
  localise?: TranslateCopy
): NotificationPermissionOffCopy {
  const copy =
    localise ?? ((key, values) => translate('en-NZ', key, values ?? {}));

  return {
    title: copy('notifications.onboarding.permission_off.title'),
    body: copy('notifications.onboarding.permission_off.body'),
    action: copy('notifications.onboarding.permission_off.action'),
    settings: copy('notifications.onboarding.permission_off.settings'),
  };
}
