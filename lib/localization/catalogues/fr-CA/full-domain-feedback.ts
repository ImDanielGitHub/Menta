import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullDomainFeedbackKey = Extract<
  keyof EnglishCatalogue,
  `domain.${string}`
>;

export const fullDomainFeedbackFrCA = {
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
  'domain.error.challenge': 'Problème d’état du défi. Actualisez et réessayez.',
  'domain.error.group': 'L’action du groupe a échoué. Réessayez.',
  'domain.error.unknown': 'Un problème est survenu. Réessayez.',
  'domain.error.title.network': 'Erreur de connexion',
  'domain.error.title.authentication': 'Authentification nécessaire',
  'domain.error.title.permission': 'Autorisation requise',
  'domain.error.title.validation': 'Entrée invalide',
  'domain.error.title.camera': 'Erreur de caméra',
  'domain.error.title.upload': 'Échec de l’envoi',
  'domain.error.title.submission': 'Échec de l’envoi',
  'domain.error.title.review': 'Erreur de vérification',
  'domain.error.title.database': 'Erreur de synchronisation',
  'domain.error.title.challenge': 'Erreur de défi',
  'domain.error.title.group': 'Erreur de groupe',
  'domain.error.title.unknown': 'Erreur',
  'domain.error.connection_tips': 'Conseils de connexion',
  'domain.error.connection_tips_body':
    'Essayez de passer du Wi-Fi aux données mobiles, ou déplacez-vous vers un endroit où le signal est meilleur.',
  'domain.error.camera_permissions': 'Autorisations de la caméra',
  'domain.error.camera_permissions_body':
    'Assurez-vous que Menta a accès à la caméra dans les paramètres de votre appareil.',
  'domain.action.try_again': 'Réessayer',
  'domain.action.check_connection': 'Vérifier la connexion',
  'domain.action.log_in': 'Se connecter',
  'domain.action.grant_permissions': 'Accorder les autorisations',
  'domain.action.open_settings': 'Ouvrir les paramètres',
  'domain.action.check_permissions': 'Vérifier les autorisations',
  'domain.action.save_draft': 'Enregistrer le brouillon',
  'domain.action.retry_submission': 'Réessayer l’envoi',
  'domain.action.save_for_later': 'Enregistrer pour plus tard',
  'domain.challenge.proof_default.fitness.photo':
    'Prenez une photo pendant ou après votre séance qui montre ce que vous avez fait.',
  'domain.challenge.proof_default.fitness.video':
    'Enregistrez une courte vidéo de la séance que vous avez terminée.',
  'domain.challenge.proof_default.fitness.text':
    'Écrivez quel exercice vous avez fait et pendant combien de temps.',
  'domain.challenge.proof_default.fitness.none':
    'Marquez l’entraînement comme terminé après l’avoir fini. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.mindfulness.photo':
    'Prenez une photo de l’endroit ou de l’installation utilisés pour votre pratique.',
  'domain.challenge.proof_default.mindfulness.video':
    'Enregistrez une courte réflexion sur la pratique que vous avez terminée.',
  'domain.challenge.proof_default.mindfulness.text':
    'Écrivez quelle pratique vous avez faite et pendant combien de temps.',
  'domain.challenge.proof_default.mindfulness.none':
    'Marquez la pratique comme terminée après l’avoir finie. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.learning.photo':
    'Prenez une photo des notes, du livre ou du travail que vous avez terminés.',
  'domain.challenge.proof_default.learning.video':
    'Enregistrez une courte vidéo où vous expliquez ce que vous avez appris.',
  'domain.challenge.proof_default.learning.text':
    'Écrivez ce que vous avez étudié et une chose que vous avez apprise.',
  'domain.challenge.proof_default.learning.none':
    'Marquez la séance d’étude comme terminée après l’avoir finie. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.productivity.photo':
    'Prenez une photo du travail terminé ou de la liste de tâches accomplies.',
  'domain.challenge.proof_default.productivity.video':
    'Enregistrez une courte vidéo montrant votre travail terminé.',
  'domain.challenge.proof_default.productivity.text':
    'Écrivez quelles tâches vous avez terminées.',
  'domain.challenge.proof_default.productivity.none':
    'Marquez les tâches comme terminées après les avoir finies. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.health.photo':
    'Prenez une photo qui montre le choix sain que vous avez fait.',
  'domain.challenge.proof_default.health.video':
    'Enregistrez une courte vidéo où vous décrivez le choix sain que vous avez fait.',
  'domain.challenge.proof_default.health.text':
    'Écrivez quel choix sain vous avez fait aujourd’hui.',
  'domain.challenge.proof_default.health.none':
    'Marquez le choix sain comme accompli une fois fait. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.creativity.photo':
    'Prenez une photo de ce que vous avez créé ou de votre façon de faire.',
  'domain.challenge.proof_default.creativity.video':
    'Enregistrez une courte vidéo de votre démarche ou de votre travail terminé.',
  'domain.challenge.proof_default.creativity.text':
    'Écrivez ce que vous avez créé et comment vous y avez travaillé.',
  'domain.challenge.proof_default.creativity.none':
    'Marquez le travail créatif comme terminé après l’avoir fini. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.social.photo':
    'Si tout le monde est d’accord, prenez une photo du moment passé ensemble.',
  'domain.challenge.proof_default.social.video':
    'Enregistrez une courte réflexion personnelle sur le moment passé ensemble.',
  'domain.challenge.proof_default.social.text':
    'Écrivez avec qui vous avez passé du temps et ce que vous avez fait ensemble.',
  'domain.challenge.proof_default.social.none':
    'Marquez la promesse sociale comme terminée après l’avoir tenue. Aucun envoi n’est requis.',
  'domain.challenge.proof_default.fallback.photo':
    'Prenez une photo qui montre que la promesse du jour est tenue.',
  'domain.challenge.proof_default.fallback.video':
    'Enregistrez une courte vidéo qui montre que la promesse du jour est tenue.',
  'domain.challenge.proof_default.fallback.text':
    "Écrivez ce que vous avez accompli aujourd'hui.",
  'domain.challenge.proof_default.fallback.none':
    'Marquez la promesse d’aujourd’hui comme terminée après l’avoir tenue. Aucun envoi n’est requis.',
  'domain.auth.user_not_authenticated': 'Utilisateur non authentifié',
  'domain.auth.session_validation_failed':
    'La validation de la session a échoué',
  'domain.auth.no_valid_session': 'Aucune session valide trouvée',
  'domain.auth.user_id_mismatch': 'L’ID utilisateur ne correspond pas',
  'domain.auth.validation_failed':
    'La validation de l’authentification a échoué',
  'domain.auth.authentication_required': 'Authentification requise',
  'domain.monitoring.login_again': 'Veuillez vous reconnecter pour continuer',
  'domain.monitoring.more_momenta':
    'Vous avez besoin de plus de Momenta pour terminer cette action',
  'domain.monitoring.network':
    'Erreur réseau. Vérifiez votre connexion et réessayez',
  'domain.monitoring.duration_range':
    'La durée doit être comprise entre 1 et 365 jours',
  'domain.monitoring.name_range':
    'Le nom doit comporter entre 3 et 50 caractères',
  'domain.monitoring.invalid_values':
    'Une ou plusieurs valeurs ne respectent pas les exigences. Vérifiez vos saisies.',
  'domain.monitoring.group_name_exists':
    'Un groupe porte déjà ce nom. Choisissez-en un autre.',
  'domain.monitoring.invite_code_exists':
    'Ce code d’invitation est déjà utilisé. Réessayez.',
  'domain.monitoring.already_exists':
    'Cette valeur existe déjà. Essayez-en une autre.',
  'domain.monitoring.referenced_item_missing':
    'L’élément concerné n’existe plus. Actualisez et réessayez.',
  'domain.monitoring.required_missing':
    'Des informations obligatoires manquent. Remplissez tous les champs.',
  'domain.monitoring.access_denied': 'Vous n’avez pas accès à cette action.',
  'domain.monitoring.permission_denied':
    'Vous n’êtes pas autorisé à effectuer cette action.',
  'domain.monitoring.rate_limited':
    'Vous allez trop vite. Patientez un instant et réessayez.',
  'domain.monitoring.usage_limit':
    'Vous avez atteint votre limite d’utilisation. Passez à Pro pour plus de promesses et de groupes, et des Momenta chaque mois.',
  'domain.monitoring.generic': 'Un problème est survenu. Réessayez',
  'domain.network.no_connection':
    'Pas de connexion Internet. Vérifiez votre réseau et réessayez.',
  'domain.network.request_timed_out': 'Délai de la requête dépassé. Réessayez.',
  'domain.network.error':
    'Une erreur réseau est survenue. Vérifiez votre connexion.',
  'domain.network.try_later': 'Erreur réseau. Réessayez plus tard.',
  'domain.network.service_unavailable':
    'Le service est temporairement indisponible. Réessayez dans un instant.',
  'domain.network.unknown_error': 'Erreur inconnue',
  'domain.network.generic_error': 'Une erreur est survenue. Réessayez.',
  'domain.oauth.offline':
    'Vous êtes hors ligne. Reconnectez-vous et réessayez.',
  'domain.oauth.google_unavailable':
    'La connexion avec Google n’est pas disponible dans cette version de Menta. Utilisez plutôt l’adresse courriel.',
  'domain.oauth.google_finish':
    'La connexion avec Google n’a pas pu aboutir. Réessayez.',
  'domain.oauth.apple_unavailable':
    'La connexion avec Apple n’est pas disponible sur cet appareil. Utilisez plutôt l’adresse courriel.',
  'domain.oauth.apple_finish':
    'La connexion avec Apple n’a pas pu aboutir. Réessayez.',
  'domain.oauth.google_cancelled': 'Connexion annulée',
  'domain.oauth.apple_cancelled': 'Connexion annulée',
  'domain.oauth.google_failed':
    'Impossible de vous connecter avec Google. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.google_already_open':
    'La connexion avec Google est déjà ouverte.',
  'domain.oauth.google_device_unavailable':
    'La connexion avec Google n’est pas disponible sur cet appareil. Utilisez plutôt l’adresse courriel.',
  'domain.oauth.google_open':
    'La connexion avec Google n’a pas pu s’ouvrir. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.google_not_finished':
    'La connexion avec Google n’a pas abouti. Revenez dans Menta et réessayez.',
  'domain.oauth.google_unsafe':
    'La connexion avec Google n’a pas pu aboutir en toute sécurité. Recommencez depuis Menta.',
  'domain.oauth.google_unauthorised':
    'La connexion avec Google n’a pas été autorisée. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.google_return':
    'La connexion avec Google n’a pas pu aboutir. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.apple_open':
    'La connexion avec Apple n’a pas pu s’ouvrir. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.apple_not_finished':
    'La connexion avec Apple n’a pas abouti. Revenez dans Menta et réessayez.',
  'domain.oauth.apple_unsafe':
    'La connexion avec Apple n’a pas pu aboutir en toute sécurité. Recommencez depuis Menta.',
  'domain.oauth.apple_unauthorised':
    'La connexion avec Apple n’a pas été autorisée. Réessayez ou utilisez l’adresse courriel.',
  'domain.oauth.apple_return':
    'La connexion avec Apple n’a pas pu aboutir. Réessayez ou utilisez l’adresse courriel.',
  'domain.edge.failed':
    'Un problème est survenu avec {functionName}. Réessayez.',
  'domain.edge.maintenance_failed':
    'L’opération de maintenance a échoué. Contactez le support si le problème persiste.',
  'domain.edge.user_failed':
    'Impossible de {displayName}. Vérifiez votre connexion et réessayez.',
  'domain.events.saved_photo_unavailable':
    'La photo enregistrée n’est plus disponible sur cet appareil.',
  'domain.events.saved_photo_changed':
    'La photo enregistrée a changé avant de pouvoir être envoyée.',
  'domain.events.photo_arrival_unknown':
    'Nous ne savons pas si la photo est arrivée. Vérifiez-la avant d’en envoyer une autre.',
  'domain.events.photo_status_updating':
    'La photo a été envoyée, mais son état dans l’événement est encore en cours de mise à jour.',
  'domain.events.date_format':
    'Utilisez AAAA-MM-JJ pour la date et HH:MM au format 24 heures pour l’heure.',
  'domain.events.invalid_date_time':
    'Choisissez une date et une heure locales valides.',
  'domain.events.future_start': 'Choisissez une heure de début dans le futur.',
  'domain.eventStore.publishing_account_changed':
    'Vous avez changé de compte pendant que Menta publiait. Reconnectez-vous au compte d’origine et vérifiez ce même événement.',
  'domain.eventStore.event_other_account':
    'Cet événement appartient à un autre compte connecté. Connectez-vous en tant qu’organisateur avant de publier.',
  'domain.eventStore.photo_other_account':
    'Cette photo d’événement enregistrée appartient à un autre compte connecté.',
  'domain.eventStore.checking_saved_photo':
    'Vous avez changé de compte pendant que Menta vérifiait la photo d’événement enregistrée.',
  'domain.eventStore.prepare_photo_account_changed':
    'Vous avez changé de compte avant que Menta puisse préparer la photo de l’événement.',
  'domain.eventStore.send_photo_account_changed':
    'Vous avez changé de compte avant que Menta puisse envoyer la photo de l’événement.',
  'domain.eventStore.checking_photo_arrival':
    'Vous avez changé de compte pendant que Menta vérifiait si la photo était arrivée.',
  'domain.eventStore.photo_status_updating':
    'Vous avez changé de compte pendant la mise à jour de l’état de la photo de l’événement.',
  'domain.eventStore.event_open_account_changed':
    'Vous avez changé de compte pendant l’ouverture de l’événement. Réessayez.',
  'domain.eventStore.event_load_account_changed':
    'Vous avez changé de compte pendant le chargement de l’événement. Réessayez.',
  'domain.eventStore.details_open_account_changed':
    'Vous avez changé de compte pendant l’ouverture des détails de l’événement. Réessayez.',
  'domain.eventStore.details_load_account_changed':
    'Vous avez changé de compte pendant le chargement des détails de l’événement. Réessayez.',
  'domain.eventStore.album_open_account_changed':
    'Vous avez changé de compte pendant l’ouverture de l’album des participants. Réessayez.',
  'domain.eventStore.sign_in_album':
    "Connectez-vous pour ouvrir l'album des invités.",
  'domain.eventStore.album_load_account_changed':
    'Vous avez changé de compte pendant le chargement de l’album des participants. Réessayez.',
  'domain.eventStore.review_open_account_changed':
    'Vous avez changé de compte pendant l’ouverture de la vérification de l’organisateur. Réessayez.',
  'domain.eventStore.sign_in_review':
    'Insérez-vous pour consulter les photos des participants.',
  'domain.eventStore.review_load_account_changed':
    'Vous avez changé de compte pendant le chargement de la vérification de l’organisateur. Réessayez.',
  'domain.eventStore.recap_open_account_changed':
    'Vous avez changé de compte pendant l’ouverture du récapitulatif de l’événement. Réessayez.',
  'domain.eventStore.sign_in_recap':
    "Insérez-vous pour ouvrir la récapitulation de l'événement.",
  'domain.eventStore.recap_load_account_changed':
    'Vous avez changé de compte pendant le chargement du récapitulatif de l’événement. Réessayez.',
  'domain.eventStore.join_start_account_changed':
    'Vous avez changé de compte avant le début de l’inscription. Réessayez.',
  'domain.eventStore.join_save_account_changed':
    'Vous avez changé de compte pendant que Menta enregistrait votre place. Reconnectez-vous et vérifiez votre présence.',
  'domain.eventStore.leave_start_account_changed':
    'Vous avez changé de compte avant le début de la désinscription. Réessayez.',
  'domain.eventStore.leave_update_account_changed':
    'Vous avez changé de compte pendant que Menta mettait à jour votre place. Reconnectez-vous et vérifiez votre présence.',
  'domain.eventStore.checkin_start_account_changed':
    'Vous avez changé de compte avant le début de l’enregistrement. Réessayez.',
  'domain.eventStore.checkin_finish_account_changed':
    'Vous avez changé de compte pendant la finalisation de l’enregistrement. Reconnectez-vous et vérifiez votre présence.',
  'domain.eventStore.photo_send_start_account_changed':
    'Vous avez changé de compte avant l’envoi de la photo de l’événement. Réessayez.',
  'domain.eventStore.sign_in_send_photo':
    "Connectez-vous avant de poster une photo d'un événement.",
  'domain.eventStore.photo_status_check_account_changed':
    'Vous avez changé de compte pendant la mise à jour de l’état de la photo de l’événement. Reconnectez-vous et vérifiez la photo.',
  'domain.eventStore.saved_photo_continue_account_changed':
    'Vous avez changé de compte avant que la photo enregistrée de l’événement puisse continuer. Réessayez.',
  'domain.eventStore.sign_in_resume_photo':
    "Connectez-vous avant de reprendre une photo d'événement.",
  'domain.eventStore.saved_photo_unavailable':
    "La sauvegarde photo sauvegardée n'est plus disponible sur ce appareil.",
  'domain.eventStore.saved_photo_status_account_changed':
    'Vous avez changé de compte pendant la mise à jour de l’état de la photo enregistrée. Reconnectez-vous et vérifiez la photo.',
  'domain.eventStore.saved_photos_status_account_changed':
    'Vous avez changé de compte pendant la mise à jour de l’état des photos enregistrées.',
  'domain.eventStore.photo_review_start_account_changed':
    'Vous avez changé de compte avant le début de la vérification de la photo. Réessayez.',
  'domain.eventStore.photo_decision_account_changed':
    'Vous avez changé de compte pendant la mise à jour de la décision sur la photo. Vérifiez la photo avant de décider à nouveau.',
  'domain.eventStore.organiser_decision_start_account_changed':
    'Vous avez changé de compte avant le début de la décision de l’organisateur. Réessayez.',
  'domain.eventStore.organiser_decision_account_changed':
    'Vous avez changé de compte pendant la mise à jour de la décision de l’organisateur. Vérifiez la photo avant de décider à nouveau.',
  'domain.eventStore.photo_delete_start_account_changed':
    'Vous avez changé de compte avant le début de la suppression de la photo. Réessayez.',
  'domain.eventStore.photo_delete_finish_account_changed':
    'Vous avez changé de compte pendant la suppression de la photo. Vérifiez si la photo est toujours là.',
  'domain.handoff.invite_saved': 'Invitation enregistrée',
  'domain.handoff.referral_saved': 'Code de parrainage enregistré',
  'domain.handoff.invite_description':
    '{action} et Menta ouvrira votre invitation {inviteType} enregistrée.',
  'domain.handoff.referral_login_description':
    'S’il s’agit d’un nouveau compte, Menta vérifiera le code après la connexion. Toute récompense disponible apparaîtra dans votre compte.',
  'domain.handoff.referral_signup_description':
    'Créez votre compte et Menta vérifiera si le code donne droit à une récompense.',
  'domain.handoff.referral_login_new_description':
    'S’il s’agit d’un nouveau compte, Menta vérifiera le code après la connexion.',
  'domain.handoff.referral_finish_description':
    'Terminez la configuration et Menta vérifiera si le code donne droit à une récompense.',
  'domain.handoff.referral_setup_description':
    'Créez votre compte et Menta vérifiera le code après la configuration.',
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
  'domain.handoff.sign_in': 'Se connecter',
  'domain.coach.default_promise': 'votre promesse',
  'domain.coach.default_due_time': '20:00',
  'domain.coach.proof_due': 'La preuve est attendue.',
  'domain.coach.proof_due_body':
    'Ajoutez la preuve avant {proofDueLabel} pour terminer le suivi du jour.',
  'domain.coach.today_counts': 'Aujourd’hui compte toujours.',
  'domain.coach.hours_left':
    'Il reste {hours} {hourLabel} pour envoyer la preuve d’aujourd’hui.',
  'domain.coach.add_before_day_end':
    'Ajoutez la preuve d’aujourd’hui avant la fin de la journée.',
  'domain.coach.log_proof': 'Ajoutez la preuve d’aujourd’hui.',
  'domain.coach.promises_need_proof':
    '{count} {promiseLabel} ont encore besoin d’une preuve. Commencez par l’une d’elles.',
  'domain.coach.add_to_finish': 'Ajoutez la preuve pour terminer la journée.',
  'domain.coach.still_time': 'Il reste du temps aujourd’hui.',
  'domain.coach.proof_open_until':
    'La preuve d’aujourd’hui reste ouverte jusqu’à {proofDueLabel}.',
  'domain.coach.proof_still_open': 'La preuve du jour est toujours ouverte.',
  'domain.coach.completed_add_proof':
    'Si vous avez tenu votre promesse, ajoutez la preuve avant la fin de la journée.',
  'domain.coach.next_small_step': 'Choisissez la prochaine petite étape.',
  'domain.coach.proof_remains_open':
    'La preuve du jour reste ouverte jusqu’à la fin de la journée.',
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
  'domain.report.draft_saved': 'Brouillon enregistré sur ce téléphone',
  'domain.report.nothing_sent': 'Rien n’a été envoyé au support.',
  'domain.report.sending': 'Envoi du signalement',
  'domain.report.waiting_confirmation':
    'Menta attend que le serveur confirme ce signalement précis.',
  'domain.report.not_sent': 'Signalement non envoyé',
  'domain.report.remains_on_phone':
    'Votre signalement reste sur ce téléphone. Rien n’a été transmis au support.',
  'domain.report.result_unknown': 'Résultat de l’envoi inconnu',
  'domain.report.could_not_confirm':
    'Menta n’a pas pu confirmer la réponse du serveur. Réessayer utilise la même référence de signalement.',
  'domain.report.received': 'Signalement reçu',
  'domain.report.confirmed':
    'Menta a confirmé que le signalement est bien arrivé sur le serveur.',
  'domain.commitment.move_daily': 'Bouger chaque jour',
  'domain.commitment.move_daily_description':
    'Bougez un moment chaque jour. Une marche, une séance, des étirements ou un sport, tout compte.',
  'domain.commitment.move_daily_promise': 'Je vais bouger chaque jour.',
  'domain.commitment.move_daily_verification':
    'Envoyez une photo claire une fois terminé. Montrez la marche, la séance, le parcours, le tapis, la salle ou le résultat.',
  'domain.commitment.move_daily_submission':
    'Dites ce que vous avez fait aujourd’hui et combien de temps vous avez bougé.',
  'domain.commitment.daily_movement_group': 'Groupe Bouger chaque jour',
  'domain.commitment.fitness': 'forme',
  'domain.commitment.focused_study': 'Étude concentrée',
  'domain.commitment.focused_study_description':
    'Terminez chaque jour une séance d’étude concentrée et notez sur quoi vous avez travaillé.',
  'domain.commitment.focused_study_promise':
    'Je vais terminer une séance d’étude concentrée chaque jour.',
  'domain.commitment.focused_study_verification':
    'Notez ce que vous avez étudié, combien de temps vous avez consacré à l’étude et une chose que vous comprenez mieux maintenant.',
  'domain.commitment.focused_study_submission':
    'Indiquez le sujet étudié, votre temps de concentration et une chose que vous comprenez mieux maintenant.',
  'domain.commitment.learning': 'apprentissage',
  'domain.commitment.morning_walk': 'Marche matinale',
  'domain.commitment.morning_walk_description':
    'Faites une courte marche en début de journée.',
  'domain.commitment.morning_walk_promise':
    'Je vais faire une courte marche le matin.',
  'domain.commitment.morning_walk_verification':
    'Envoyez une photo de la marche. Une rue, un chemin, vos chaussures, une montre ou le ciel suffisent.',
  'domain.commitment.morning_walk_submission':
    'Dites où vous avez marché et une chose que vous avez remarquée.',
  'domain.commitment.morning_walk_group': 'Groupe Marche matinale',
  'domain.commitment.sleep_reset': 'Mieux dormir',
  'domain.commitment.sleep_reset_description':
    'Commencez à décompresser avant de vous coucher chaque soir.',
  'domain.commitment.sleep_reset_promise':
    'Je vais commencer à décompresser avant de me coucher.',
  'domain.commitment.sleep_reset_verification':
    'Écrivez ce que vous avez fait pour décompresser et l’heure à laquelle vous avez commencé.',
  'domain.commitment.sleep_reset_submission':
    'Ajoutez l’étape de routine que vous avez faite et ce qui a rendu la soirée plus facile ou plus difficile.',
  'domain.commitment.sleep_reset_group': 'Groupe Mieux dormir',
  'domain.commitment.no_sugar': 'Pause sans sucre',
  'domain.commitment.no_sugar_description':
    'Tenez une règle alimentaire claire pendant sept jours : pas de sucre ajouté.',
  'domain.commitment.no_sugar_hub': 'Sans sucre',
  'domain.commitment.no_sugar_promise':
    'Je vais éviter le sucre ajouté aujourd’hui.',
  'domain.commitment.no_sugar_verification':
    'Écrivez si vous avez respecté la règle et notez les moments où cela a été difficile.',
  'domain.commitment.no_sugar_submission':
    'Ajoutez le moment le plus difficile et ce que vous avez choisi à la place.',
  'domain.commitment.no_sugar_group': 'Groupe Sans sucre',
  'domain.commitment.creative_minutes': 'Minutes créatives',
  'domain.commitment.creative_minutes_description':
    'Passez 20 minutes par jour à créer ou améliorer quelque chose.',
  'domain.commitment.creative_minutes_promise':
    'Je vais passer 20 minutes à créer quelque chose.',
  'domain.commitment.creative_minutes_verification':
    'Envoyez une photo ou une capture d’écran du travail que vous avez réalisé ou modifié aujourd’hui : brouillon, croquis, chronologie ou notes.',
  'domain.commitment.creative_minutes_submission':
    'Dites ce que vous avez créé ou amélioré pendant ces 20 minutes.',
  'domain.commitment.creativity': 'créativité',
  'domain.commitment.health': 'santé',
  'domain.commitment.creative_minutes_group': 'Groupe de minutes créatives',
  'domain.intensity.flexible': 'Flexible',
  'domain.intensity.standard': 'Normal',
  'domain.intensity.fixed': 'Fixe',
  'domain.intensity.shop_note':
    'Une prolongation de 12 heures ou un gel de série s’achète dans la boutique; cela ne se choisit pas ici.',
  'domain.intensity.flexible_note':
    'Plus facile à tenir pendant une semaine chargée.',
  'domain.intensity.standard_note': 'Une promesse quotidienne normale.',
  'domain.intensity.fixed_note': 'La plus exigeante des trois.',
  'domain.notifications.channel_updates': 'Nouveautés de Menta',
  'domain.notifications.channel_reminders':
    'Rappels avant l’échéance de la preuve',
  'domain.notifications.channel_groups':
    'Suivis, demandes de vérification et changements dans les groupes',
  'domain.notifications.channel_progress': 'Séries, badges, étapes et Momenta',
  'domain.notifications.channel_proof':
    'Quand une preuve est en attente, acceptée ou doit être refaite',
  'domain.notifications.new_milestone': 'Nouvelle étape',
  'domain.notifications.group_milestone_named': '{groupName} : {milestone}',
  'domain.notifications.group_milestone_reached': 'Étape de groupe atteinte',
  'domain.notifications.proof_due': 'Preuve attendue',
  'domain.notifications.proof_for':
    'Envoyez la preuve pour « {challengeTitle} ».',
  'domain.notifications.group_milestone': 'Étape de groupe atteinte',
  'domain.notifications.group_activity': 'Nouvelle activité dans le groupe',
  'domain.notifications.group_activity_named':
    '{memberName} a une mise à jour dans {groupName}',
  'domain.notifications.proof_due_for':
    'Preuve attendue pour « {challengeTitle} »',
  'domain.notifications.proof_due_promise':
    'Preuve attendue pour votre promesse',
  'domain.notifications.open_update': 'Ouvrez Menta pour voir la mise à jour.',
  'domain.notifications.updated': 'Mise à jour de Menta',
  'domain.notifications.streak_updated': 'Série mise à jour',
  'domain.notifications.streak_protected': 'Série protégée',
  'domain.notifications.promise_started': 'Promesse commencée',
  'domain.notifications.promise_complete': 'Promesse terminée',
  'domain.notifications.promise_ending': 'Promesse qui se termine bientôt',
  'domain.notifications.promise_ended': 'Promesse terminée',
  'domain.notifications.review_needed': 'Une preuve attend votre vérification',
  'domain.notifications.proof_waiting': 'Preuve en attente de vérification',
  'domain.notifications.proof_approved': 'Preuve approuvée',
  'domain.notifications.proof_retry': 'La preuve doit être refaite',
  'domain.notifications.group_update': 'Mise à jour du groupe',
  'domain.notifications.group_attention': 'Le groupe demande votre attention',
  'domain.notifications.daily_reminder': 'Rappel quotidien',
  'domain.notifications.check_in_reminder': 'Rappel de suivi',
  'domain.notifications.badge_unlocked': 'Badge déverrouillé',
  'domain.notifications.momenta_added': 'Momenta ajoutés',
  'domain.notifications.menta_updated': 'Menta mis à jour',
  'domain.notifications.menta_maintenance': 'Maintenance de Menta',
  'domain.notifications.test': 'Notification de test de Menta',
  'domain.notifications.ending_in': 'Se termine dans {hours} {hourLabel}',
  'domain.notifications.ending_soon': 'Se termine bientôt',
  'domain.notifications.group_submissions': 'Envois du groupe',
  'domain.notifications.members': 'Membres',
  'domain.notifications.review': 'vérification',
  'domain.notifications.reviews': 'vérifications',
} as const satisfies Pick<EnglishCatalogue, FullDomainFeedbackKey>;
