import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FoundationKey = Extract<
  keyof EnglishCatalogue,
  | `brand.${string}`
  | `term.${string}`
  | `screenshot.${string}`
  | `accessibility.${string}`
  | `count.${string}`
>;

export const foundationEsMX = {
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Cumple las promesas que te haces.',
  'term.promise': 'promesa',
  'term.proof': 'prueba',
  'term.note': 'una nota',
  'term.photo': 'una foto',
  'term.video': 'un video',
  'term.review': 'revisión',
  'term.group': 'grupo',
  'term.streak': 'racha',
  'term.today': 'Hoy',
  'screenshot.01': 'Cumple las promesas que te haces.',
  'screenshot.02': 'Elige qué cuenta como prueba.',
  'screenshot.03': 'Registra cuando termines.',
  'screenshot.04': 'Pídele a alguien que te ayude a rendir cuentas.',
  'screenshot.05': 'Organiza tus eventos en Menta.',
  'screenshot.06': 'Usa Momenta para proteger tu racha.',
  'accessibility.back': 'Volver',
  'accessibility.close': 'Cerrar',
  'count.promise': '{count} promesas',
  'count.promise.one': '{count} promesa',
  'count.promise.other': '{count} promesas',
} as const satisfies Pick<EnglishCatalogue, FoundationKey>;
