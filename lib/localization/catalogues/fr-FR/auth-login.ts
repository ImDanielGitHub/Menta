import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type AuthLoginKey = Extract<keyof EnglishCatalogue, `auth.login.${string}`>;

export const authLoginFrFR = {
  'auth.login.error.keep_promise':
    'Menta n’a pas pu enregistrer votre promesse sur ce téléphone. Réessayez avant de continuer.',
  'auth.login.error.cancel_recovery':
    'La connexion a été annulée, mais Menta n’a pas pu enregistrer l’étape de reprise. Votre promesse est toujours sur cet écran. Réessayez.',
  'auth.login.error.provider':
    'Menta n’a pas pu terminer la connexion avec {provider}. Réessayez ou choisissez une autre méthode.',
  'auth.login.cancelled.title': 'Connexion annulée',
  'auth.login.cancelled.draft_detail':
    'Votre promesse reste privée sur ce téléphone. Réessayez ou choisissez une autre méthode de connexion.',
  'auth.login.cancelled.detail':
    'Aucun compte n’a été connecté. Réessayez ou choisissez une autre méthode de connexion.',
  'auth.login.action.retry_apple': 'Réessayer avec Apple',
  'auth.login.action.retry_google': 'Réessayer avec Google',
  'auth.login.action.email': 'Utiliser l’adresse e-mail',
  'auth.login.action.keep_editing': 'Continuer à modifier ma promesse',
  'auth.login.draft_title': 'Enregistrez votre promesse',
  'auth.login.title': 'Connectez-vous à Menta',
  'auth.login.draft_detail':
    'Votre promesse reste privée sur ce téléphone jusqu’à votre connexion.',
  'auth.login.error.title': 'Connexion impossible',
  'auth.login.action.apple': 'Se connecter avec Apple',
  'auth.login.action.google': 'Se connecter avec Google',
  'auth.login.action.replay_intro': 'Voir comment fonctionne Menta',
  'auth.login.required.join_promise_title':
    'Connectez-vous pour rejoindre cette promesse',
  'auth.login.required.join_promise_detail':
    'Votre invitation reste liée à votre compte. Rien n’est encore rejoint.',
  'auth.login.required.create_promise_title':
    'Connectez-vous pour créer une promesse',
  'auth.login.required.create_promise_detail':
    'Votre brouillon reste sur ce téléphone jusqu’à votre connexion.',
  'auth.login.required.open_promise_title':
    'Connectez-vous pour ouvrir cette promesse',
  'auth.login.required.open_promise_detail':
    'Menta ouvre cette promesse sous votre compte.',
} as const satisfies Pick<EnglishCatalogue, AuthLoginKey>;
