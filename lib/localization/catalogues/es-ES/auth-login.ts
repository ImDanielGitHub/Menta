import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginEsES = {
  'auth.login.error.keep_promise':
    'Menta no pudo guardar tu promesa en este teléfono. Vuelve a intentarlo antes de continuar.',
  'auth.login.error.cancel_recovery':
    'El inicio de sesión se canceló, pero Menta no pudo guardar el punto de recuperación. Tu promesa sigue en esta pantalla. Vuelve a intentarlo.',
  'auth.login.error.provider':
    'Menta no pudo completar el inicio de sesión con {provider}. Vuelve a intentarlo o elige otro método.',
  'auth.login.cancelled.title': 'Inicio de sesión cancelado',
  'auth.login.cancelled.draft_detail':
    'Tu promesa sigue siendo privada en este teléfono. Vuelve a intentarlo o elige otro método para iniciar sesión.',
  'auth.login.cancelled.detail':
    'No se conectó ninguna cuenta. Vuelve a intentarlo o elige otro método para iniciar sesión.',
  'auth.login.action.retry_apple': 'Volver a probar con Apple',
  'auth.login.action.retry_google': 'Volver a probar con Google',
  'auth.login.action.email': 'Usar correo electrónico',
  'auth.login.action.keep_editing': 'Seguir editando mi promesa',
  'auth.login.draft_title': 'Guarda tu promesa',
  'auth.login.title': 'Inicia sesión en Menta',
  'auth.login.draft_detail':
    'Tu promesa es privada en este teléfono hasta que inicies sesión.',
  'auth.login.error.title': 'No pudimos iniciar tu sesión',
  'auth.login.action.apple': 'Iniciar sesión con Apple',
  'auth.login.action.google': 'Iniciar sesión con Google',
  'auth.login.action.replay_intro': 'Ver cómo funciona Menta',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
