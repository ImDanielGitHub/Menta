import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginEsMX = {
  'auth.login.error.keep_promise':
    'Menta no pudo guardar tu promesa en este celular. Inténtalo de nuevo antes de continuar.',
  'auth.login.error.cancel_recovery':
    'Se canceló el inicio de sesión, pero Menta no pudo guardar ese estado de recuperación. Tu promesa sigue en esta pantalla. Inténtalo de nuevo.',
  'auth.login.error.provider':
    'Menta no pudo completar el inicio de sesión con {provider}. Inténtalo de nuevo o elige otro método.',
  'auth.login.cancelled.title': 'Se canceló el inicio de sesión',
  'auth.login.cancelled.draft_detail':
    'Tu promesa sigue siendo privada en este celular. Inténtalo de nuevo o elige otro método de inicio de sesión.',
  'auth.login.cancelled.detail':
    'No se conectó ninguna cuenta. Inténtalo de nuevo o elige otro método de inicio de sesión.',
  'auth.login.action.retry_apple': 'Intentar con Apple de nuevo',
  'auth.login.action.retry_google': 'Intentar con Google de nuevo',
  'auth.login.action.email': 'Usar correo',
  'auth.login.action.keep_editing': 'Seguir editando mi promesa',
  'auth.login.draft_title': 'Guardar tu promesa',
  'auth.login.title': 'Inicia sesión en Menta',
  'auth.login.draft_detail':
    'Tu promesa es privada en este celular hasta que inicies sesión.',
  'auth.login.error.title': 'No pudimos iniciar tu sesión',
  'auth.login.action.apple': 'Iniciar sesión con Apple',
  'auth.login.action.google': 'Iniciar sesión con Google',
  'auth.login.action.replay_intro': 'Ver cómo funciona Menta',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
