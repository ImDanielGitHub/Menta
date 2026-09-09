import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FoundationKey = Extract<
  keyof EnglishCatalogue,
  | `brand.${string}`
  | `term.${string}`
  | `screenshot.${string}`
  | `accessibility.${string}`
  | `count.promise${string}`
>;

export const foundationDeDE = {
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Halte die Versprechen, die du dir selbst gibst.',
  'term.promise': 'Versprechen',
  'term.proof': 'Nachweis',
  'term.note': 'eine Notiz',
  'term.photo': 'ein Foto',
  'term.video': 'ein Video',
  'term.review': 'Prüfung',
  'term.group': 'Gruppe',
  'term.streak': 'Tagesserie',
  'term.today': 'Heute',
  'screenshot.01': 'Halte die Versprechen, die du dir selbst gibst.',
  'screenshot.02': 'Wähle, was als Nachweis zählt.',
  'screenshot.03': 'Melde dich, wenn du fertig bist.',
  'screenshot.04': 'Lass dich von jemandem zur Verantwortung ziehen.',
  'screenshot.05': 'Organisiere deine Veranstaltungen mit Menta.',
  'screenshot.06': 'Schütze deine Tagesserie mit Momenta.',
  'accessibility.back': 'Zurück',
  'accessibility.close': 'Schließen',
  'count.promise': '{count} Versprechen',
  'count.promise.one': '{count} Versprechen',
  'count.promise.other': '{count} Versprechen',
} as const satisfies Pick<EnglishCatalogue, FoundationKey>;
