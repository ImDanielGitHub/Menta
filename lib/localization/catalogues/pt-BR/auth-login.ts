import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginPtBR = {
  'auth.login.error.keep_promise':
    'A Menta não conseguiu guardar sua promessa neste celular. Tente novamente antes de continuar.',
  'auth.login.error.cancel_recovery':
    'A entrada foi cancelada, mas a Menta não conseguiu guardar o ponto de recuperação. Sua promessa continua nesta tela. Tente novamente.',
  'auth.login.error.provider':
    'A Menta não conseguiu concluir o login com {provider}. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.cancelled.title': 'Login cancelado',
  'auth.login.cancelled.draft_detail':
    'Sua promessa continua privada neste celular. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.cancelled.detail':
    'Nenhuma conta foi conectada. Tente novamente ou escolha outra forma de entrar.',
  'auth.login.action.retry_apple': 'Tentar Apple novamente',
  'auth.login.action.retry_google': 'Tentar Google novamente',
  'auth.login.action.email': 'Usar e-mail',
  'auth.login.action.keep_editing': 'Continuar editando minha promessa',
  'auth.login.draft_title': 'Guarde sua promessa',
  'auth.login.title': 'Entre na Menta',
  'auth.login.draft_detail':
    'Sua promessa fica privada neste celular até você entrar.',
  'auth.login.error.title': 'Não foi possível entrar',
  'auth.login.action.apple': 'Entrar com Apple',
  'auth.login.action.google': 'Entrar com Google',
  'auth.login.action.replay_intro': 'Ver como a Menta funciona',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
