import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsFrFR = {
  'notifications.topbar.back': 'Retour',
  'notifications.topbar.context': 'Facultatif',
  'notifications.topbar.title': 'Notifications',
  'notifications.education.title': 'Recevoir des rappels pour vos promesses ?',
  'notifications.education.body':
    'Menta peut vous prévenir avant la date limite d’une preuve et lorsqu’une personne envoie une preuve à vérifier. Votre téléphone va maintenant vous demander votre autorisation.',
  'notifications.education.proof_due.title': '« La preuve est attendue »',
  'notifications.education.proof_due.body':
    'Lorsqu’une promesse approche de sa date limite',
  'notifications.education.review.title': '« Une preuve est à vérifier »',
  'notifications.education.review.body':
    'Lorsqu’une personne envoie une preuve pour une promesse partagée',
  'notifications.action.turn_on': 'Activer les rappels',
  'notifications.action.continue_without': 'Continuer sans rappels',
  'notifications.action.open_settings': 'Ouvrir les réglages du téléphone',
  'notifications.action.retry': 'Réessayer de configurer les rappels',
  'notifications.action.back_to_settings':
    'Revenir aux réglages des notifications',
  'notifications.permission_prompt.hint':
    'Ouvre la demande d’autorisation des notifications du téléphone',
  'notifications.permission_off.title': 'Pas de rappels pour le moment',
  'notifications.permission_off.body':
    'Vos promesses restent actives. Consultez Aujourd’hui pour voir ce qui est attendu, ou activez les rappels plus tard dans Profil.',
  'notifications.permission_off.later.title': 'Les activer plus tard',
  'notifications.permission_off.later.body':
    'Ouvrez Profil, puis Notifications.',
  'notifications.registration_pending.title':
    'Les rappels ne sont pas encore prêts',
  'notifications.registration_pending.body':
    'Réessayez avant de compter sur les rappels, ou continuez et activez-les plus tard.',
  'notifications.phone.title': 'Notifications du téléphone',
  'notifications.phone.allowed': 'Les notifications sont autorisées',
  'notifications.phone.allowed_by_phone': 'Autorisées par ce téléphone',
  'notifications.status.on': 'Activées',
  'notifications.menta.title': 'Rappels Menta',
  'notifications.menta.not_connected': 'Cet appareil n’est pas encore connecté',
  'notifications.menta.connected': 'Cet appareil est connecté',
  'notifications.status.checking': 'Vérification…',
  'notifications.status.not_ready': 'Non prêts',
  'notifications.status.ready': 'Prêts',
  'notifications.granted.title':
    'Ce téléphone est prêt à recevoir les notifications Menta',
  'notifications.granted.body':
    'Choisissez les rappels que vous souhaitez recevoir dans les réglages des notifications.',
  'notifications.notice.setup_failed.title':
    'La configuration des rappels n’a pas abouti',
  'notifications.notice.setup_failed.body':
    'Réessayez ou continuez sans rappels.',
  'notifications.notice.still_off.title':
    'Les notifications sont toujours désactivées',
  'notifications.notice.still_off.body':
    'Vos promesses restent actives. Menta ne vous le redemandera pas ici.',
  'notifications.notice.allowed.title':
    'Votre téléphone autorise maintenant les notifications',
  'notifications.notice.allowed.body':
    'Menta termine la configuration des rappels sur ce téléphone.',
  'notifications.notice.check_failed.title':
    'Impossible de vérifier le réglage des notifications',
  'notifications.notice.continue_later.body':
    'Vous pouvez continuer sans rappels et réessayer plus tard.',
  'notifications.notice.sign_in.title':
    'Connectez-vous pour configurer les rappels',
  'notifications.notice.sign_in.body':
    'Menta a besoin d’un compte pour enregistrer les choix de rappels de ce téléphone.',
  'notifications.notice.prompt_failed.title':
    'Impossible d’ouvrir la demande de notifications',
  'notifications.notice.settings_opening.title':
    'Les réglages du téléphone vont s’ouvrir',
  'notifications.notice.settings_opening.body':
    'Choisissez si Menta peut envoyer des notifications, puis revenez ici.',
  'notifications.notice.settings_failed.title':
    'Impossible d’ouvrir les réglages',
  'notifications.notice.settings_failed.body':
    'Ouvrez les réglages du téléphone, choisissez Menta, puis Notifications pour modifier cette autorisation.',
  'notifications.onboarding.title': 'Ne ratez pas le moment.',
  'notifications.onboarding.body':
    'Menta a besoin de l’autorisation de vous envoyer des rappels lorsqu’une preuve est due ou que quelqu’un doit la vérifier.',
  'notifications.onboarding.trust':
    'Uniquement les rappels que vous choisissez. Modifiez ce choix quand vous voulez.',
  'notifications.onboarding.card.title': 'Preuve due dans 30 min',
  'notifications.onboarding.card.body':
    'Vous l’avez promis. Allez jusqu’au bout.',
  'notifications.onboarding.action.turn_on': 'Autoriser les notifications',
  'notifications.onboarding.action.not_now': 'Pas maintenant',
  'notifications.onboarding.permission_off.title': 'Aucun souci.',
  'notifications.onboarding.permission_off.body':
    'Menta fonctionne sans notifications. Vous pourrez activer les rappels plus tard dans les réglages.',
  'notifications.onboarding.permission_off.action': 'Continuer',
  'notifications.onboarding.permission_off.settings': 'Ouvrir les réglages',
  'notifications.onboarding.granted.title': 'Tout est prêt.',
  'notifications.onboarding.granted.body':
    'Menta terminera la connexion des rappels après votre connexion.',
  'notifications.onboarding.granted.action': 'Continuer vers la connexion',
  'notifications.onboarding.card.accessibility':
    'Aperçu d’une notification Menta. Preuve due dans 30 minutes. Vous l’avez promis. Allez jusqu’au bout.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
