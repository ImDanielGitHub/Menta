import { translate } from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

type TranslateCopy = (
  key: TranslationKey,
  values?: Record<string, string | number>
) => string;

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export type GroupSettingsNoticeCopy = {
  title: string;
  message: string;
};

/**
 * Group settings receipts after save, leave, or delete.
 * These are owner outcomes, not generic toast tokens.
 */
export function getGroupSettingsOwnerOnlyCopy(
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy('groupsHome.adminNotice.ownerOnlyTitle'),
    message: translateCopy('groupsHome.adminNotice.ownerOnlyDetail'),
  };
}

export function getGroupSettingsNameRequiredCopy(
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy('groupsHome.adminNotice.nameRequiredTitle'),
    message: translateCopy('groupsHome.adminNotice.nameRequiredDetail'),
  };
}

export function getGroupSettingsSaveUnconfirmedCopy(
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy('groupsHome.adminNotice.saveUnconfirmedTitle'),
    message: translateCopy('groupsHome.adminNotice.saveUnconfirmedDetail'),
  };
}

export function getGroupSettingsSavedCopy(
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy('groupsHome.adminNotice.savedTitle'),
    message: translateCopy('groupsHome.adminNotice.savedDetail'),
  };
}

export function getGroupSettingsSaveFailedCopy(
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy('groupsHome.adminNotice.saveFailedTitle'),
    message: translateCopy('groupsHome.adminNotice.saveFailedDetail'),
  };
}

export function getGroupSettingsLeaveNoticeCopy(
  kind: 'unknown' | 'failed',
  outcomeMessage: string,
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy(
      kind === 'unknown'
        ? 'groupsHome.adminNotice.leaveUnknownTitle'
        : 'groupsHome.adminNotice.leaveFailedTitle'
    ),
    message: outcomeMessage,
  };
}

export function getGroupSettingsDeleteNoticeCopy(
  kind: 'unknown' | 'failed',
  outcomeMessage: string,
  translateCopy: TranslateCopy = defaultTranslate
): GroupSettingsNoticeCopy {
  return {
    title: translateCopy(
      kind === 'unknown'
        ? 'groupsHome.adminNotice.deleteUnconfirmedTitle'
        : 'groupsHome.adminNotice.deleteFailedTitle'
    ),
    message:
      kind === 'unknown'
        ? translateCopy('groupsHome.adminNotice.deleteUnconfirmedDetail')
        : outcomeMessage,
  };
}
