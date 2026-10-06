import {
  translate,
  type TranslationValues,
} from '@/lib/localization/translate';
import type { TranslationKey } from '@/lib/localization/en-NZ';

export type JoinRedirectDestination = 'promise' | 'group' | 'unknown';

export type JoinRedirectParams = {
  challenge?: string | string[];
  code?: string | string[];
  invite?: string | string[];
  type?: string | string[];
};

type TranslateCopy = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

const firstParam = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

/**
 * A broken invite still knows whether it was for a promise or a group.
 * `parseInviteLink` returns null without a valid code, so the recovery
 * screen has to read the same query flags without inventing a code.
 */
export const resolveJoinRedirectDestination = (
  params: JoinRedirectParams
): JoinRedirectDestination => {
  const type = firstParam(params.type).toLowerCase();
  if (type === 'challenge' || firstParam(params.challenge)) {
    return 'promise';
  }
  if (type === 'group' || firstParam(params.invite)) {
    return 'group';
  }
  return 'unknown';
};

export type JoinRedirectMissingCodeCopy = {
  title: string;
  subtitle: string;
  noticeTitle: string;
  noticeDetail: string;
  canEnterGroupCode: boolean;
};

const defaultTranslate: TranslateCopy = (key, values) =>
  translate('en-NZ', key, values);

export const getJoinRedirectMissingCodeCopy = (
  destination: JoinRedirectDestination,
  localise: TranslateCopy = defaultTranslate
): JoinRedirectMissingCodeCopy => {
  if (destination === 'promise') {
    return {
      title: localise('groups.redirect.needs_promise_code'),
      subtitle: localise('groups.redirect.needs_promise_code_subtitle'),
      noticeTitle: localise('groups.redirect.missing_promise_code'),
      noticeDetail: localise('groups.redirect.missing_promise_code_detail'),
      canEnterGroupCode: false,
    };
  }

  return {
    title: localise('groups.redirect.needs_code'),
    subtitle: localise('groups.redirect.needs_code_subtitle'),
    noticeTitle: localise('groups.redirect.missing_code'),
    noticeDetail: localise('groups.redirect.missing_code_detail'),
    canEnterGroupCode: true,
  };
};
