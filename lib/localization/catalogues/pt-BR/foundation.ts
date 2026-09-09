import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FoundationKey = Extract<
  keyof EnglishCatalogue,
  | `brand.${string}`
  | `term.${string}`
  | `screenshot.${string}`
  | `accessibility.${string}`
  | `count.${string}`
>;

export const foundationPtBR = {
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Cumpra as promessas que você faz a si mesmo.',
  'term.promise': 'promessa',
  'term.proof': 'comprovação',
  'term.note': 'uma nota',
  'term.photo': 'uma foto',
  'term.video': 'um vídeo',
  'term.review': 'análise',
  'term.group': 'grupo',
  'term.streak': 'sequência',
  'term.today': 'Hoje',
  'screenshot.01': 'Cumpra as promessas que você faz a si mesmo.',
  'screenshot.02': 'Escolha o que conta como comprovação.',
  'screenshot.03': 'Faça o check-in quando terminar.',
  'screenshot.04': 'Convide alguém para ajudar você a manter o compromisso.',
  'screenshot.05': 'Organize seus eventos na Menta.',
  'screenshot.06': 'Use Momenta para proteger sua sequência.',
  'accessibility.back': 'Voltar',
  'accessibility.close': 'Fechar',
  'count.promise': '{count} promessas',
  'count.promise.one': '{count} promessa',
  'count.promise.other': '{count} promessas',
} as const satisfies Pick<EnglishCatalogue, FoundationKey>;
