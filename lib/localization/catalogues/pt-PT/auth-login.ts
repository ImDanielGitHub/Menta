import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginPtPT = {
  'auth.login.error.keep_promise':
    'A Menta não conseguiu guardar sua promessa neste telemóvel. Tente novamente antes de continuar.',
  'auth.login.error.cancel_recovery':
    'A entrada foi cancelada, mas a Menta não conseguiu guardar o ponto de recuperação. A sua promessa continua neste ecrã. Tente novamente.',
  'auth.login.error.provider':
    'A Menta não conseguiu concluir a sessão com {provider}. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.cancelled.title': 'Sessão cancelada',
  'auth.login.cancelled.draft_detail':
    'A sua promessa continua privada neste telemóvel. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.cancelled.detail':
    'Nenhuma conta foi ligada. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.action.retry_apple': 'Tentar Apple novamente',
  'auth.login.action.retry_google': 'Tentar Google novamente',
  'auth.login.action.email': 'Usar e-mail',
  'auth.login.action.keep_editing': 'Continuar a editar a minha promessa',
  'auth.login.draft_title': 'Guarde a sua promessa',
  'auth.login.title': 'Inicie sessão na Menta',
  'auth.login.draft_detail':
    'A sua promessa fica privada neste telemóvel até iniciar sessão.',
  'auth.login.error.title': 'Não foi possível entrar',
  'auth.login.action.apple': 'Iniciar sessão com a Apple',
  'auth.login.action.google': 'Iniciar sessão com o Google',
  'auth.login.action.replay_intro': 'Ver como a Menta funciona',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
