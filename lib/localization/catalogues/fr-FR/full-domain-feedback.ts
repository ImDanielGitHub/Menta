import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullDomainFeedbackKey = Extract<
  keyof EnglishCatalogue,
  `domain.${string}`
>;

export const fullDomainFeedbackFrFR = {
  'domain.error.network':
    'Problème de connexion détecté. Vérifiez votre connexion Internet et réessayez.',
  'domain.error.authentication':
    'Authentification requise. Connectez-vous pour continuer.',
  'domain.error.permission':
    'Autorisation requise pour continuer. Accordez les autorisations nécessaires.',
  'domain.error.validation': 'Vérifiez vos renseignements et réessayez.',
  'domain.error.camera':
    'Problème de caméra détecté. Vérifiez les autorisations de la caméra et réessayez.',
  'domain.error.upload':
    'Échec de l’envoi. Vérifiez votre connexion et réessayez.',
  'domain.error.submission':
    'Échec de l’envoi. Réessayez d’envoyer votre preuve.',
  'domain.error.review':
    'Échec de la vérification. Réessayez ou contactez le support.',
  'domain.error.database':
    'Problème de synchronisation des données. Réessayez dans un instant.',
  'domain.error.challenge':
    'Problème d’état de la promesse. Actualisez et réessayez.',
  'domain.error.group': 'L’action du groupe a échoué. Réessayez.',
  'domain.error.unknown': 'Un problème est survenu. Réessayez.',
  'domain.error.title.network': 'Erreur de connexion',
  'domain.error.title.authentication': 'Authentification nécessaire',
  'domain.error.title.permission': 'Nécessite autorisation',
  'domain.error.title.validation': 'Entrée invalide',
  'domain.error.title.camera': 'Erreur de caméra',
  'domain.error.title.upload': 'Erreur de téléchargement',
  'domain.error.title.submission': 'Erreur de soumission',
  'domain.error.title.review': 'Erreur de vérification',
  'domain.error.title.database': 'Erreur de synchronisation',
  'domain.error.title.challenge': 'Erreur de test',
  'domain.error.title.group': 'Erreur de groupe',
  'domain.error.title.unknown': 'Erreur',
  'domain.error.connection_tips': 'Suggestions pour les connexions',
  'domain.error.connection_tips_body':
    'Essayez de changer entre une connexion Wi-Fi et une connexion mobile ou de vous déplacer dans une zone avec une meilleure signal.',
  'domain.error.camera_permissions': 'Autorisations de la caméra',
  'domain.error.camera_permissions_body':
    "Assurez-vous que Menta a la autorisation d'accès à la caméra dans les réglages de votre appareil.",
  'domain.action.try_again': 'Réessayez',
  'domain.action.check_connection': 'Vérifiez votre connexion',
  'domain.action.log_in': 'Se connecter',
  'domain.action.grant_permissions': 'Grant Autorisations',
  'domain.action.open_settings': 'Ouvrir Réglages',
  'domain.action.check_permissions': 'Vérifiez les autorisations',
  'domain.action.save_draft': 'Enregistrer le document',
  'domain.action.retry_submission': 'Réessayer l’envoi',
  'domain.action.save_for_later': 'Enregistrer pour plus tard',
  'domain.challenge.proof_default.fitness.photo':
    'Présentez pendant ou après votre entraînement une photo montrant ce que vous avez fait.',
  'domain.challenge.proof_default.fitness.video':
    'Enregistrez un court morceau de vidéo d’une pratique que vous avez terminée.',
  'domain.challenge.proof_default.fitness.text':
    'Écrivez ce que vous avez fait de l’exercice et pour combien de temps.',
  'domain.challenge.proof_default.fitness.none':
    'Marquez l’entraînement comme terminé après l’avoir fini. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.mindfulness.photo':
    'Présentez une photo de la pièce ou de la configuration que vous avez utilisée pour la pratique.',
  'domain.challenge.proof_default.mindfulness.video':
    'Enregistrez une réflexion courte sur la pratique que vous avez terminée.',
  'domain.challenge.proof_default.mindfulness.text':
    'Écrivez ce que vous avez fait de la pratique et pour combien de temps.',
  'domain.challenge.proof_default.mindfulness.none':
    'Marquez la pratique comme terminée après l’avoir finie. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.learning.photo':
    'Présentez une photo de vos notes, de livre ou de travail que vous avez terminé.',
  'domain.challenge.proof_default.learning.video':
    'Enregistrez un court morceau de vidéo expliquant ce que vous avez appris.',
  'domain.challenge.proof_default.learning.text':
    'Écrivez ce que vous avez étudié et une chose que vous avez appris.',
  'domain.challenge.proof_default.learning.none':
    'Marquez la séance d’étude comme terminée après l’avoir finie. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.productivity.photo':
    'Pose une photo de votre travail terminé ou de votre liste de tâches terminées.',
  'domain.challenge.proof_default.productivity.video':
    'Enregistrez une courte vidéo montrant votre travail terminé.',
  'domain.challenge.proof_default.productivity.text':
    'Écrivez quelle tâche vous avez terminé.',
  'domain.challenge.proof_default.productivity.none':
    'Marquez les tâches comme terminées après les avoir finies. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.health.photo':
    "Pose une photo qui montre la chose que vous avez fait ou que vous avez choisie aujourd'hui.",
  'domain.challenge.proof_default.health.video':
    "Enregistrez une courte vidéo décrivant la chose que vous avez fait ou que vous avez choisie aujourd'hui.",
  'domain.challenge.proof_default.health.text':
    "Écrivez ce que vous avez fait aujourd'hui.",
  'domain.challenge.proof_default.health.none':
    'Marquez le choix santé comme terminé après l’avoir fait. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.creativity.photo':
    "Pose une photo de ce que vous avez fait ou de la manière dont vous l'avez accompli.",
  'domain.challenge.proof_default.creativity.video':
    'Enregistrez une courte vidéo de votre processus ou de votre travail terminé.',
  'domain.challenge.proof_default.creativity.text':
    "Écrivez ce que vous avez fait et comment vous l'avez accompli.",
  'domain.challenge.proof_default.creativity.none':
    'Marquez le travail créatif comme terminé après l’avoir fini. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.social.photo':
    'Ouvrez une photo de votre temps passé ensemble.',
  'domain.challenge.proof_default.social.video':
    'Entrez une courte réflexion personnelle sur les moments passés ensemble.',
  'domain.challenge.proof_default.social.text':
    'Écrivez qui vous avez passé de temps et ce qui vous avez fait ensemble.',
  'domain.challenge.proof_default.social.none':
    'Marquez la promesse sociale comme terminée après l’avoir tenue. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.fallback.photo':
    'Ouvrez une photo qui montre que votre promesse sociale a été achevée.',
  'domain.challenge.proof_default.fallback.video':
    'Faites valider votre clip vidéo qui montre que votre promesse sociale a été achevée.',
  'domain.challenge.proof_default.fallback.text':
    "Écrivez ce que vous avez accompli aujourd'hui.",
  'domain.challenge.proof_default.fallback.none':
    'Marquez la promesse d’aujourd’hui comme terminée après l’avoir tenue. Aucun envoi n’est requis.',
  'domain.auth.user_not_authenticated': 'Utilisateur non authentifié',
  'domain.auth.session_validation_failed': 'Validation du session non valide',
  'domain.auth.no_valid_session': 'Aucune session valide trouvée',
  'domain.auth.user_id_mismatch': 'Une ID utilisateur ne correspond pas',
  'domain.auth.validation_failed': "Validation d'authentification échouée",
  'domain.auth.authentication_required': 'Authentification requise',
  'domain.monitoring.login_again': 'Veuillez vous reconnecter pour continuer',
  'domain.monitoring.more_momenta':
    'Vous avez besoin de plus de Momenta pour terminer cette action',
  'domain.monitoring.network':
    'Erreur réseau. Veuillez vérifier votre connexion et essayer à nouveau',
  'domain.monitoring.duration_range': 'La durée doit être entre 1 et 365 jours',
  'domain.monitoring.name_range': 'Le nom doit être entre 3 et 50 caractères',
  'domain.monitoring.invalid_values':
    'Une ou plusieurs valeurs ne répondent pas aux exigences. Vérifiez vos entrées',
  'domain.monitoring.group_name_exists':
    'Un groupe avec ce nom existe déjà. Choisissez un nom différent',
  'domain.monitoring.invite_code_exists':
    "Ce code d'invitation est déjà utilisé. Veuillez essayez de nouveau",
  'domain.monitoring.already_exists':
    'Cette valeur existe déjà. Essayez une autre valeur',
  'domain.monitoring.referenced_item_missing':
    "L'article requis n'existe plus. Veuillez accéder à la fonctionnalité.",
  'domain.monitoring.required_missing':
    'Les informations requises ne sont pas disponibles. Veuillez remplir toutes les cases.',
  'domain.monitoring.access_denied':
    "Vous n'avez pas accès à cette action. Veuillez vérifier.",
  'domain.monitoring.permission_denied':
    "Vous n'êtes pas autorisé à effectuer cette action. Veuillez vérifier les réglages.",
  'domain.monitoring.rate_limited':
    'Vous faites ça de manière trop rapide. Veuillez patienter une seconde et réessayez.',
  'domain.monitoring.usage_limit':
    'Vous avez atteint votre limite de utilisation. Démarrer Pro pour plus de promesses et de groupes, ainsi que des abonnements mensuels Momenta.',
  'domain.monitoring.generic':
    "Une erreur technique s'est produite. Veuillez réessayer.",
  'domain.network.no_connection':
    "Il n'y a pas de connexion Internet. Veuillez vérifier votre réseau et réessayez.",
  'domain.network.request_timed_out': 'Request timeout. Veuillez réessayer.',
  'domain.network.error':
    'Erreur de connexion réseau. Veuillez vérifier votre connexion.',
  'domain.network.try_later':
    'Erreur de connexion réseau. Veuillez réessayer plus tard.',
  'domain.network.service_unavailable':
    'Le service est actuellement indisponible. Veuillez réessayer dans un court-temps.',
  'domain.network.unknown_error': 'Erreur inconnue',
  'domain.network.generic_error': 'Une erreur est survenue. Réessayez.',
  'domain.oauth.offline':
    "Vous n'êtes pas connecté. Rendez-vous en ligne et réessayez.",
  'domain.oauth.google_unavailable':
    "L’authentification avec Google n'est pas disponible dans cette version de Menta. Utilisez un e-mail.",
  'domain.oauth.google_finish':
    "Authentification avec Google n'a pas pu se finaliser. Réessayez.",
  'domain.oauth.apple_unavailable':
    "L’authentification avec Apple n'est pas disponible sur ce appareil. Utilisez un e-mail.",
  'domain.oauth.apple_finish':
    "Authentification avec Apple n'a pas pu se finaliser. Réessayez.",
  'domain.oauth.google_cancelled': 'Authentification annulée',
  'domain.oauth.apple_cancelled': 'Authentification annulée',
  'domain.oauth.google_failed':
    "Authentification avec Google n'a pas pu se finaliser. Réessayez ou utilisez un e-mail.",
  'domain.oauth.google_already_open':
    'Authentification avec Google est déjà ouverte.',
  'domain.oauth.google_device_unavailable':
    "Authentification avec Google n'est pas disponible sur ce appareil. Utilisez un e-mail.",
  'domain.oauth.google_open':
    "Authentification Google n'a pas réussi. Réessayez ou utilisez le e-mail.",
  'domain.oauth.google_not_finished':
    "Authentification Google n'a pas été finie. Retournez à Menta et réessayez.",
  'domain.oauth.google_unsafe':
    "Authentification Google n'a pas été finie de manière sûre. Commencez à nouveau de Menta.",
  'domain.oauth.google_unauthorised':
    "Authentification Google n'a pas été autorisée. Réessayez ou utilisez le e-mail.",
  'domain.oauth.google_return':
    "Authentification Google n'a pas été finie. Réessayez ou utilisez le e-mail.",
  'domain.oauth.apple_open':
    "Authentification Apple n'a pas réussi. Réessayez ou utilisez le e-mail.",
  'domain.oauth.apple_not_finished':
    "Authentification Apple n'a pas été finie. Retournez à Menta et réessayez.",
  'domain.oauth.apple_unsafe':
    "Authentification Apple n'a pas été finie de manière sûre. Commencez à nouveau de Menta.",
  'domain.oauth.apple_unauthorised':
    "Authentification Apple n'a pas été autorisée. Réessayez ou utilisez le e-mail.",
  'domain.oauth.apple_return':
    "Authentification Apple n'a pas été finie. Réessayez ou utilisez le e-mail.",
  'domain.edge.failed':
    "S'agissant de {functionName}, quelque chose a échoué. Veuillez réessayez.",
  'domain.edge.maintenance_failed':
    'Opération de maintenance a échouée. Veuillez contacter le support si cette situation persiste.',
  'domain.edge.user_failed':
    'Impossible de {displayName}. Vérifiez votre connexion et réessayez.',
  'domain.events.saved_photo_unavailable':
    "Le photo enregistré n'est plus disponible sur ce appareil.",
  'domain.events.saved_photo_changed':
    "Le photo enregistré a changé avant d'être envoyée.",
  'domain.events.photo_arrival_unknown':
    "Nous ne pouvons pas déterminer s'il a bien reçu cette photo. Vérifiez cette photo avant de réenvoyer une photo.",
  'domain.events.photo_status_updating':
    "La photo a été envoyée, mais son état de l'événement est toujours en cours de mise à jour.",
  'domain.events.date_format':
    'Utilisez YYYY-MM-DD pour la date et 24 heures HH:MM pour la heure.',
  'domain.events.invalid_date_time': 'Choisissez une date et heure valides.',
  'domain.events.future_start': 'Choisissez une heure de début dans le futur.',
  'domain.eventStore.publishing_account_changed':
    "Vous avez changé d'identités pendant que Menta a publié cet événement. Reconnectez-vous à nouveau sur l'ancienne compte et vérifiez cette même photo de cet événement.",
  'domain.eventStore.event_other_account':
    "Cet événement appartient à un autre compte signé. Assurez-vous d'aller dans la section 'Organiseur' et de publier.",
  'domain.eventStore.photo_other_account':
    "Cette photo enregistrée de l'événement appartient à un autre compte signé.",
  'domain.eventStore.checking_saved_photo':
    "Vous avez changé d'identités pendant que Menta vérifiait la photo enregistrée de cet événement.",
  'domain.eventStore.prepare_photo_account_changed':
    "Vous avez changé d'comptes avant que Menta puisse préparer l'image de l'événement.",
  'domain.eventStore.send_photo_account_changed':
    "Vous avez changé d'comptes avant que Menta puisse envoyer l'image de l'événement.",
  'domain.eventStore.checking_photo_arrival':
    "Vous avez changé d'comptes pendant que Menta vérifiait si l'image arrivait.",
  'domain.eventStore.photo_status_updating':
    "Vous avez changé d'comptes pendant que l'état de l'image de l'événement était mis à jour.",
  'domain.eventStore.event_open_account_changed':
    "Vous avez changé d'comptes pendant que l'image de l'événement était ouverte. Réessayez.",
  'domain.eventStore.event_load_account_changed':
    "Vous avez changé d'comptes pendant que l'image de l'événement était chargée. Réessayez.",
  'domain.eventStore.details_open_account_changed':
    "Vous avez changé d'comptes pendant que les détailss de l'événement étaient ouverts. Réessayez.",
  'domain.eventStore.details_load_account_changed':
    "Vous avez changé d'comptes pendant que les détailss de l'événement étaient chargés. Réessayez.",
  'domain.eventStore.album_open_account_changed':
    "Vous avez changé d'comptes pendant que l'album des invités était ouvert. Réessayez.",
  'domain.eventStore.sign_in_album':
    "Connectez-vous pour ouvrir l'album des invités.",
  'domain.eventStore.album_load_account_changed':
    "Vous avez changé d'comptes pendant que l'album des invités était chargé. Réessayez.",
  'domain.eventStore.review_open_account_changed':
    "Vous avez changé d'comptes pendant que la vérification de l'organisateur était ouverte. Réessayez.",
  'domain.eventStore.sign_in_review':
    'Insérez-vous pour consulter les photos des participants.',
  'domain.eventStore.review_load_account_changed':
    "Vous avez changé d'comptes pendant que la récapitulation de l'événement était en cours. Réessayez.",
  'domain.eventStore.recap_open_account_changed':
    "Vous avez changé d'comptes pendant que la récapitulation de l'événement était ouverte. Réessayez.",
  'domain.eventStore.sign_in_recap':
    "Insérez-vous pour ouvrir la récapitulation de l'événement.",
  'domain.eventStore.recap_load_account_changed':
    "Vous avez changé d'comptes pendant que la récapitulation de l'événement était en cours. Réessayez.",
  'domain.eventStore.join_start_account_changed':
    "Vous avez changé d'comptes avant que l'événement ne commençât. Réessayez.",
  'domain.eventStore.join_save_account_changed':
    "Vous avez changé d'comptes avant de rejoindre commencé. Réessayez.",
  'domain.eventStore.leave_start_account_changed':
    "Vous avez changé d'comptes avant de quitter commencé. Réessayez.",
  'domain.eventStore.leave_update_account_changed':
    "Vous avez changé d'comptes pendant que Menta était enregistrant votre place. Veuillez réinsérer et vérifier l'inscription.",
  'domain.eventStore.checkin_start_account_changed':
    "Vous avez changé d'comptes avant que la photo du groupe ne soit envoyée. Réessayez.",
  'domain.eventStore.checkin_finish_account_changed':
    "Vous avez changé d'comptes pendant que la photographie du groupe était en cours. Réessayez.",
  'domain.eventStore.photo_send_start_account_changed':
    "Vous avez changé d'comptes avant que la photo du groupe ne soit envoyée. Réessayez.",
  'domain.eventStore.sign_in_send_photo':
    "Connectez-vous avant de poster une photo d'un événement.",
  'domain.eventStore.photo_status_check_account_changed':
    "Vous avez changé d'comptes pendant que l'état de photo sauvegardée était en cours d'actualisation. Reconnectez-vous à nouveau et vérifiez la photo.",
  'domain.eventStore.saved_photo_continue_account_changed':
    "Vous avez changé d'comptes avant que la sauvegarde photo ne puisse continuer. Réessayez.",
  'domain.eventStore.sign_in_resume_photo':
    "Connectez-vous avant de reprendre une photo d'événement.",
  'domain.eventStore.saved_photo_unavailable':
    "La sauvegarde photo sauvegardée n'est plus disponible sur ce appareil.",
  'domain.eventStore.saved_photo_status_account_changed':
    "Vous avez changé d'comptes pendant que l'état des photos sauvegardées était en cours d'actualisation. Reconnectez-vous à nouveau et vérifiez la photo.",
  'domain.eventStore.saved_photos_status_account_changed':
    "Vous avez changé d'comptes pendant que les états des photos sauvegardées étaient en cours d'actualisation.",
  'domain.eventStore.photo_review_start_account_changed':
    "Vous avez changé d'comptes avant que la décision photo ne commence. Réessayez.",
  'domain.eventStore.photo_decision_account_changed':
    "Vous avez changé d'comptes pendant que la décision photo était en cours d'actualisation. Vérifiez la photo avant de décider à nouveau.",
  'domain.eventStore.organiser_decision_start_account_changed':
    "Vous avez changé d'comptes avant que la décision de la photo ne commence. Réessayez.",
  'domain.eventStore.organiser_decision_account_changed':
    "Vous avez changé d'comptes pendant que la décision de la photo était en cours d'actualisation. Vérifiez la photo avant de décider à nouveau.",
  'domain.eventStore.photo_delete_start_account_changed':
    "Vous avez changé d'comptes avant que la décision photo ne commence. Réessayez.",
  'domain.eventStore.photo_delete_finish_account_changed':
    "Vous avez changé d'identité pendant que le supprimé des photos se terminait. Vérifiez si le photo est toujours présent.",
  'domain.handoff.invite_saved': 'Invitation sauvegardée',
  'domain.handoff.referral_saved': 'Code de parrainage sauvegardé',
  'domain.handoff.invite_description':
    '{action} et Menta ouvriront votre invitation sauvegardée {inviteType}.',
  'domain.handoff.referral_login_description':
    "Si c'est une nouvelle compte, Menta vérifiera le code après l'inscription. Toute récompense disponible apparaîtra dans votre compte.",
  'domain.handoff.referral_signup_description':
    'Créez votre compte et Menta vérifiera si le code est qualifié pour une récompense.',
  'domain.handoff.referral_login_new_description':
    "Si c'est une nouvelle compte, Menta vérifiera le code après l'inscription.",
  'domain.handoff.referral_finish_description':
    'Terminé de la mise en place et Menta vérifiera si le code est qualifié pour une récompense.',
  'domain.handoff.referral_setup_description':
    'Créez votre compte et Menta vérifiera le code après la mise en place.',
  'domain.handoff.next': 'Suivant',
  'domain.handoff.then': 'Ensuite',
  'domain.handoff.step_one': 'Étape 1',
  'domain.handoff.step_two': 'Étape 2',
  'domain.handoff.step_three': 'Étape 3',
  'domain.handoff.promise': 'Promesse',
  'domain.handoff.invite': 'Invitation',
  'domain.handoff.account': 'Compte',
  'domain.handoff.sign_in_any_method':
    'Se connecter avec n’importe quelle méthode',
  'domain.handoff.open_saved_invite':
    'Ouvrir l’invitation {inviteType} enregistrée',
  'domain.handoff.sign_in_or_create': 'Se connecter ou créer un compte',
  'domain.handoff.check_referral': 'Vérifier le code de parrainage enregistré',
  'domain.handoff.check_referral_short': 'Vérifier le code de parrainage',
  'domain.handoff.create_account': 'Créer un compte',
  'domain.handoff.open_menta': 'Ouvrir Menta',
  'domain.handoff.continue_invite': 'Continuer depuis l’invitation',
  'domain.handoff.show_reward': 'Afficher toute récompense disponible',
  'domain.handoff.create_first_promise': 'Créer votre première promesse',
  'domain.handoff.continue_menta': 'Continuer dans Menta',
  'domain.handoff.saving_account': 'Enregistrement dans votre compte',
  'domain.handoff.waiting_after_sign_in': 'En attente après la connexion',
  'domain.handoff.connecting': 'Connexion',
  'domain.handoff.open_today': 'Ouvrir Aujourd’hui',
  'domain.handoff.finish_setup': 'Terminer la configuration',
  'domain.handoff.create_your_account': 'Créer votre compte',
  'domain.handoff.complete_sign_in': 'Terminer la connexion',
  'domain.handoff.sign_in': 'Connectez-vous',
  'domain.coach.default_promise': 'votre promesse',
  'domain.coach.default_due_time': '18:00',
  'domain.coach.proof_due': 'La preuve est attendue.',
  'domain.coach.proof_due_body':
    'Ajoutez la preuve avant {proofDueLabel} pour terminer le suivi d’aujourd’hui.',
  'domain.coach.today_counts': 'Aujourd’hui compte toujours.',
  'domain.coach.hours_left':
    'Il reste {hours} {hourLabel} pour envoyer la preuve d’aujourd’hui.',
  'domain.coach.add_before_day_end':
    'Ajoutez la preuve d’aujourd’hui avant la fin de la journée.',
  'domain.coach.log_proof': 'Ajoutez la preuve d’aujourd’hui.',
  'domain.coach.promises_need_proof':
    '{count} {promiseLabel} ont encore besoin d’une preuve. Commencez par une promesse.',
  'domain.coach.add_to_finish': "Notez le preuve pour finir aujourd'hui.",
  'domain.coach.still_time': 'Il reste du temps aujourd’hui.',
  'domain.coach.proof_open_until':
    'La preuve d’aujourd’hui reste ouverte jusqu’à {proofDueLabel}.',
  'domain.coach.proof_still_open': 'La preuve de demain reste ouverte.',
  'domain.coach.completed_add_proof':
    'Si vous avez complété votre promesse, ajoutez la preuve avant la fin de la journée.',
  'domain.coach.next_small_step': 'Choisissez le prochain pas petit.',
  'domain.coach.proof_remains_open':
    'La preuve de demain reste ouverte jusqu’à la fin de la journée.',
  'domain.coach.hour_count': '{count} {hourLabel}',
  'domain.coach.hour_count.one': '{count} heure',
  'domain.coach.hour_count.other': '{count} heures',
  'domain.coach.promise_count': '{count} {promiseLabel}',
  'domain.coach.promise_count.one': '{count} promesse',
  'domain.coach.promise_count.other': '{count} promesses',
  'domain.coach.hour': 'heure',
  'domain.coach.hours': 'heures',
  'domain.coach.promise': 'promesse',
  'domain.coach.promises': 'promesses',
  'domain.report.draft_saved':
    'Les déclarations ont été sauvegardées sur cette application',
  'domain.report.nothing_sent': "Aucune réponse de support n'a été envoyée.",
  'domain.report.sending': 'Envoyer la vérification',
  'domain.report.waiting_confirmation':
    'Menta attend que le serveur confirme cette exacte vérification.',
  'domain.report.not_sent': "La vérification n'a pas été envoyée",
  'domain.report.remains_on_phone':
    "La vérification reste sur cette application. Aucune réponse de support n'a été envoyée.",
  'domain.report.result_unknown': 'La réponse à la vérification est inconnue',
  'domain.report.could_not_confirm':
    'Menta ne peut pas confirmer la réponse du serveur. Retournez utiliser le même identifiant de vérification.',
  'domain.report.received': 'La vérification a été reçue',
  'domain.report.confirmed':
    'Menta a confirmé que la vérification a été envoyée au serveur.',
  'domain.commitment.move_daily': 'Mettez-vous en mouvement une fois par jour.',
  'domain.commitment.move_daily_description':
    'Mettez-vous en mouvement une fois par jour. Un petit déplacement, une activité physique, une détente ou une activité physique toutes comptent.',
  'domain.commitment.move_daily_promise':
    'J’irai me faire un peu exercer chaque jour.',
  'domain.commitment.move_daily_verification':
    "Envoie-moi une photo claire après avoir fini. Elle indique la façon dont vous avez fait la marche, l'exercice, la route, la matrice, le gymnase ou le résultat.",
  'domain.commitment.move_daily_submission':
    "Explicite ce que vous avez fait aujourd'hui et combien de temps vous avez passé en mouvement.",
  'domain.commitment.daily_movement_group': 'Séance de sport',
  'domain.commitment.fitness': 'sport',
  'domain.commitment.focused_study': 'étude concentrée',
  'domain.commitment.focused_study_description':
    "Terminez une séance d'étude concentrée chaque jour et note ce que vous avez travaillé.",
  'domain.commitment.focused_study_promise':
    "Je terminerai une séance d'étude concentrée chaque jour.",
  'domain.commitment.focused_study_verification':
    'Notez ce que vous avez étudié, combien de temps vous avez consacré à l’étude et une chose que vous comprenez mieux maintenant.',
  'domain.commitment.focused_study_submission':
    'Indiquez le sujet étudié, votre temps de concentration et une chose que vous comprenez mieux maintenant.',
  'domain.commitment.learning': 'apprendre',
  'domain.commitment.morning_walk': 'passe-partout',
  'domain.commitment.morning_walk_description':
    "Découvrez votre manière d'apprendre",
  'domain.commitment.morning_walk_promise': 'Apprenez à apprendre',
  'domain.commitment.morning_walk_verification':
    'Téléchargez et installez votre app',
  'domain.commitment.morning_walk_submission': 'Enregistrer vos notes',
  'domain.commitment.morning_walk_group': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset_description': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset_promise': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset_verification': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset_submission': 'Apprenez à apprendre',
  'domain.commitment.sleep_reset_group': 'Réinitialisation du sommeil groupe',
  'domain.commitment.no_sugar': 'Sans sucre ajouté',
  'domain.commitment.no_sugar_description':
    'Maintenez une seule règle de alimentation claire pour sept jours: sans ajout de sucre.',
  'domain.commitment.no_sugar_hub': 'Sans ajout de sucre',
  'domain.commitment.no_sugar_promise':
    "Je vais éviter l'addition de sucre aujourd'hui.",
  'domain.commitment.no_sugar_verification':
    'Écrivez si vous avez respecté la règle et notez les moments où cela a été difficile.',
  'domain.commitment.no_sugar_submission':
    'Ajoutez le moment le plus difficile et ce que vous avez choisi en lieu de place.',
  'domain.commitment.no_sugar_group': 'Groupe sans ajout de sucre',
  'domain.commitment.creative_minutes': 'Minutes créatives',
  'domain.commitment.creative_minutes_description':
    'Passer 20 minutes à faire quelque chose ou à améliorer chaque jour.',
  'domain.commitment.creative_minutes_promise':
    'Je vais passer 20 minutes à faire quelque chose.',
  'domain.commitment.creative_minutes_verification':
    "Envoyez une photo ou un capture d'écran de votre travail réalisé ou modifié aujourd'hui, par exemple, un brouillon, une esquisse, un chronogramme ou des notes de texte.",
  'domain.commitment.creative_minutes_submission':
    'Écrivez ce que vous avez fait ou amélioré pendant les 20 minutes',
  'domain.commitment.creativity': 'créativité',
  'domain.commitment.health': 'santé',
  'domain.commitment.creative_minutes_group': 'Groupe de minutes créatives',
  'domain.intensity.flexible': 'Flexible',
  'domain.intensity.standard': 'Normal',
  'domain.intensity.fixed': 'Fixe',
  'domain.intensity.shop_note':
    'Un prolongement de 12 heures ou un gel des série est acheté dans le magasin, non choisi ici.',
  'domain.intensity.flexible_note': 'Mieux pour un semaine bien chargée.',
  'domain.intensity.standard_note': 'Un avertissement quotidien normal.',
  'domain.intensity.fixed_note': 'Le plus difficile de trois.',
  'domain.notifications.channel_updates': 'Mentions Menta',
  'domain.notifications.channel_reminders':
    'Remarques avant que la preuve soit due',
  'domain.notifications.channel_groups':
    'Vos rapports, vérification de vérification requise et changements de groupe',
  'domain.notifications.channel_progress':
    'Série, badge, marqué et notifications',
  'domain.notifications.channel_proof':
    'Lorsque la preuve est en attente, acceptée ou nécessitant une deuxième tentative',
  'domain.notifications.new_milestone': 'Nouvelle marque',
  'domain.notifications.group_milestone_named': '{groupName} : {milestone}',
  'domain.notifications.group_milestone_reached': 'Marque de groupe atteinte',
  'domain.notifications.proof_due': 'La preuve est due',
  'domain.notifications.proof_for':
    'Envoyez la preuve pour « {challengeTitle} ».',
  'domain.notifications.group_milestone': 'Marque de groupe atteinte',
  'domain.notifications.group_activity': 'Nouveau groupe d’activité',
  'domain.notifications.group_activity_named':
    '{memberName} a une mise à jour dans {groupName}',
  'domain.notifications.proof_due_for':
    'Le support est nécessaire pour "{challengeTitle}"',
  'domain.notifications.proof_due_promise':
    'Le support est nécessaire pour votre promesse',
  'domain.notifications.open_update': 'Ouvrez Menta pour voir l’mise à jour.',
  'domain.notifications.updated': 'Mise à jour de Menta',
  'domain.notifications.streak_updated': 'Série mise à jour',
  'domain.notifications.streak_protected': 'Série protégée',
  'domain.notifications.promise_started': 'Promesse commencée',
  'domain.notifications.promise_complete': 'Promesse terminée',
  'domain.notifications.promise_ending': 'Promesse qui se termine bientôt',
  'domain.notifications.promise_ended': 'Promesse terminée',
  'domain.notifications.review_needed':
    'Le support est nécessaire pour votre vérification',
  'domain.notifications.proof_waiting':
    'Le support est nécessaire pour votre vérification en cours',
  'domain.notifications.proof_approved': 'La preuve est approuvée',
  'domain.notifications.proof_retry':
    'La preuve nécessite une nouvelle tentative',
  'domain.notifications.group_update': 'Mise à jour du groupe',
  'domain.notifications.group_attention': "Groupe attendu d'attention",
  'domain.notifications.daily_reminder': 'Rappel quotidien',
  'domain.notifications.check_in_reminder': 'Rappel de suivi',
  'domain.notifications.badge_unlocked': 'Badge déverrouillé',
  'domain.notifications.momenta_added': 'Momenta ajouté',
  'domain.notifications.menta_updated': 'Menta mis à jour',
  'domain.notifications.menta_maintenance': 'Maintenance de Menta',
  'domain.notifications.test': 'Notification test de Menta',
  'domain.notifications.ending_in': 'Se termine dans {hours} {hourLabel}',
  'domain.notifications.ending_soon': 'Se termine bientôt',
  'domain.notifications.group_submissions': 'Postes de groupe',
  'domain.notifications.members': 'Membres',
  'domain.notifications.review': 'vérification',
  'domain.notifications.reviews': 'vérifications',
} as const satisfies Pick<EnglishCatalogue, FullDomainFeedbackKey>;
