import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FoundationKey = Extract<
  keyof EnglishCatalogue,
  | `brand.${string}`
  | `term.${string}`
  | `screenshot.${string}`
  | `accessibility.${string}`
  | `count.${string}`
>;

export const foundationPtPT = {
  'brand.name': 'Menta',
  'brand.currency': 'Momenta',
  'brand.tagline': 'Cumpra as promessas que faz a si próprio.',
  'term.promise': 'promessa',
  'term.proof': 'comprovativo',
  'term.note': 'uma nota',
  'term.photo': 'uma fotografia',
  'term.video': 'um vídeo',
  'term.review': 'análise',
  'term.group': 'grupo',
  'term.streak': 'sequência',
  'term.today': 'Hoje',
  'screenshot.01': 'Cumpra as promessas que faz a si próprio.',
  'screenshot.02': 'Escolha o que conta como comprovativo.',
  'screenshot.03': 'Faça o check-in quando terminar.',
  'screenshot.04': 'Peça a alguém que acompanhe o seu compromisso.',
  'screenshot.05': 'Organize os seus eventos na Menta.',
  'screenshot.06': 'Use Momenta para proteger a sua sequência.',
  'accessibility.back': 'Voltar',
  'accessibility.close': 'Fechar',
  'count.promise': '{count} promessas',
  'count.promise.one': '{count} promessa',
  'count.promise.other': '{count} promessas',
} as const satisfies Pick<EnglishCatalogue, FoundationKey>;
