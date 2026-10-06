import { getLocales } from 'expo-localization';
import {
  resolveCatalogueLocale,
  translate,
} from '@/lib/localization/translate';

export type EventActionUnknownKind = 'transport' | 'malformed';

export const resolveEventActionLocale = (locale?: string | null): string => {
  if (locale) return resolveCatalogueLocale(locale);
  try {
    return resolveCatalogueLocale(getLocales()[0]?.languageTag ?? 'en-NZ');
  } catch {
    return 'en-NZ';
  }
};

/** Names an unknown event receipt without leftover English. Do not retry blindly. */
export const getEventActionUnknownCopy = (
  kind: EventActionUnknownKind,
  locale?: string | null
): string => {
  const resolved = resolveEventActionLocale(locale);
  if (kind === 'transport') {
    return translate(resolved, 'events.action.transport_unknown');
  }
  return translate(resolved, 'events.action.malformed_unknown');
};
