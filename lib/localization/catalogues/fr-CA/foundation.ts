import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FoundationKey = Extract<
  keyof EnglishCatalogue,
  | `brand.${string}`
  | `term.${string}`
  | `screenshot.${string}`
  | `accessibility.${string}`
  | `count.promise${string}`
>;

export const foundationFrCA = {
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Tenez les promesses que vous vous faites.',
  'term.promise': 'promesse',
  'term.proof': 'preuve',
  'term.note': 'une note',
  'term.photo': 'une photo',
  'term.video': 'une vidéo',
  'term.review': 'révision',
  'term.group': 'groupe',
  'term.streak': 'série',
  'term.today': 'aujourd’hui',
  'screenshot.01': 'Tenez les promesses que vous vous faites.',
  'screenshot.02': 'Choisissez ce qui compte comme preuve.',
  'screenshot.03': 'Faites le suivi quand vous avez terminé.',
  'screenshot.04': 'Demandez à quelqu’un de vous responsabiliser.',
  'screenshot.05': 'Organisez vos événements sur Menta.',
  'screenshot.06': 'Utilisez Momenta pour protéger votre série.',
  'accessibility.back': 'Retour',
  'accessibility.close': 'Fermer',
  'count.promise': '{count} promesses',
  'count.promise.one': '{count} promesse',
  'count.promise.other': '{count} promesses',
} as const satisfies Pick<EnglishCatalogue, FoundationKey>;
