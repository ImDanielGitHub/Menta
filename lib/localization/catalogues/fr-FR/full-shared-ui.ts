import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullSharedUiKey = Extract<keyof EnglishCatalogue, `shared.${string}`>;

export const fullSharedUiFrFR = {
  'shared.navigation.settings': 'Réglages',
  'shared.redirect.invite.navTitle': 'Invitez',
  'shared.redirect.join.navTitle': 'Rejoindre',
  'shared.accessibility.primaryNavigation': 'Navigation principale',
  'shared.accessibility.tabSelected': '{label} est sélectionné.',
  'shared.accessibility.tabOpens': '{label} ouvre.',
  'shared.accessibility.choiceSummary': '{title}. {description}',
  'shared.accessibility.itemSummary': '{meta}. {title}. {subtitle}. {value}',
  'shared.accessibility.toastAnnouncement': '{title}. {message}',
  'shared.accessibility.toastRepeated': '{count} message affiché',
  'shared.accessibility.dismissNotification': 'Fermer la notification',
  'shared.accessibility.dismiss': 'Fermer',
  'shared.accessibility.dismissSheet': 'Fermer la feuille',
  'shared.accessibility.scrollMore':
    '{hint}. Faites glisser vers le haut pour continuer à lire.',
  'shared.accessibility.scrollHint': 'Faire défiler pour voir la suite',
  'shared.accessibility.loading': 'Chargement des contenus',
  'shared.accessibility.mentaLoading': 'Menta est en cours de chargement',
  'shared.accessibility.loadingRetry':
    'Chargement contenus. Appuyez pour réessayer.',
  'shared.accessibility.loadingText': 'Chargement du texte',
  'shared.accessibility.loadingImage': "Chargement de l'image",
  'shared.accessibility.doneEditing': "Terminé d'écrire",
  'shared.accessibility.hidePassword': 'Cache le mot de passe',
  'shared.accessibility.showPassword': 'Affiche le mot de passe',
  'shared.accessibility.networkRetry': 'Recommencez à la connexion',
  'shared.accessibility.updateRequired': 'Menta mis à jour nécessaire',
  'shared.accessibility.updateAvailable': 'Menta mis à jour disponible',
  'shared.accessibility.referralQr':
    'Code QR d’invitation. Scannez-le pour ouvrir le lien d’invitation.',
  'shared.accessibility.duplicateInviteQr':
    'Affiche le code QR d’invitation en plein écran. Invitation {code}',
  'shared.action.tryAgain': 'Réessayez',
  'shared.action.reportIssue': 'Signaler un problème',
  'shared.action.backToday': 'Retour à la journée',
  'shared.action.contactSupport': 'Contacter le support',
  'shared.action.getHelp': "Obtenir de l'aide",
  'shared.action.close': 'Fermer',
  'shared.action.cancel': 'Annuler',
  'shared.action.confirm': 'Confirmer',
  'shared.action.done': 'Terminé',
  'shared.action.next': 'Suivant',
  'shared.action.working': 'En cours...',
  'shared.action.checkAgain': 'Recommencez',
  'shared.action.keepCurrentScreen': 'Restez sur la page actuelle',
  'shared.action.retryConnection': 'Reconnectez-vous',
  'shared.action.workOffline': 'Travailler hors ligne',
  'shared.action.retryUpload': "Réessayez d'envoyer",
  'shared.action.saveProofForLater': 'Vérifier',
  'shared.action.saveForLater': 'Sauvegarder pour plus tard',
  'shared.action.tryCameraAgain': 'Réessayez la caméra',
  'shared.action.openSettings': 'Ouvrir les réglages',
  'shared.action.signInNow': 'Se connecter maintenant',
  'shared.action.createAccount': 'Créer un compte',
  'shared.action.retrySubmission': 'Réessayer',
  'shared.action.fixDetails': 'Corriger les détails',
  'shared.action.goToToday': 'Aller à la journée',
  'shared.action.goBack': 'Retourner',
  'shared.error.network.title':
    'Menta ne peut pas se connecter pour le moment.',
  'shared.error.network.message':
    'Votre travail est en sécurité. Réessayez ou reconnectez-vous lorsque la connexion sera disponible.',
  'shared.error.camera.title': 'L’autorisation de la caméra a été interrompue',
  'shared.error.camera.message':
    'La capture d’une preuve nécessite l’accès à la caméra. Réessayez, ouvrez les réglages ou choisissez un autre type de preuve lorsque cette option est proposée.',
  'shared.error.upload.title': 'La capture de preuve n’a pas pu être envoyée',
  'shared.error.upload.message':
    'Votre capture de preuve est toujours ici. Réessayez l’envoi, enregistrez-la pour plus tard ou contactez le support si la vérification reste bloquée.',
  'shared.error.auth.title': 'Connexion requise',
  'shared.error.auth.message':
    'Les captures de preuve enregistrées, les groupes, les vérifications et Momenta nécessitent un compte Menta. Connectez-vous, puis revenez à l’action que vous étiez en train d’ouvrir.',
  'shared.error.submission.title':
    'La capture de preuve ne peut pas être envoyée',
  'shared.error.submission.message':
    'Votre capture de preuve est toujours ici. Réessayez l’envoi, enregistrez-la pour plus tard ou contactez le support si la vérification reste bloquée.',
  'shared.error.validation.title': 'Vérifiez les détails',
  'shared.error.generic.title': 'Cette action doit être réessayée',
  'shared.error.generic.message':
    'Menta ne peut pas terminer cette action. Les données de votre compte sont en sécurité. Réessayez, revenez à Aujourd’hui ou contactez le support si le problème persiste.',
  'shared.error.networkHandler.timeout.title': 'Menta prend trop de temps',
  'shared.error.networkHandler.network.title':
    'Menta ne peut pas se connecter pour le moment.',
  'shared.error.networkHandler.timeout.message':
    'La requête n’est pas terminée. Réessayez avant de changer de page afin que le dernier état confirmé de votre preuve ou de votre compte puisse être chargé.',
  'shared.error.networkHandler.server.title':
    'Menta ne peut pas finir cette requête',
  'shared.error.networkHandler.server.withStatus':
    'Le serveur a renvoyé {status}. Réessayez dans quelques instants. Votre progression dans Menta est toujours là.',
  'shared.error.networkHandler.server.withoutStatus':
    'Menta a rencontré un problème de serveur. Réessayez dans quelques instants. Votre progression est toujours là.',
  'shared.error.networkHandler.unknown.title':
    'Cette action doit être réessayée',
  'shared.error.networkHandler.unknown.message':
    'Menta a gardé votre place. Réessayez quand vous êtes prêt.',
  'shared.error.networkHandler.networkMessages':
    'Menta ne peut pas se connecter pour le moment. Votre travail est en sécurité. Réessayez lorsque la connexion sera disponible.',
  'shared.error.networkHandler.timeoutMessage':
    'Menta prend trop de temps. Réessayez avant de changer de pages.',
  'shared.error.networkHandler.serverMessage':
    'Menta ne peut pas finir cette requête. Votre place est toujours là.',
  'shared.error.networkHandler.notFoundMessage':
    'Ce lien Menta est obsolète ou n’est plus disponible.',
  'shared.error.networkHandler.unauthorisedMessage':
    'Reconnectez-vous pour récupérer votre capture de preuve et les actions de groupe liées à votre compte.',
  'shared.error.networkHandler.forbiddenMessage':
    'Ce compte ne peut pas effectuer cette modification.',
  'shared.error.networkHandler.badRequestMessage':
    'Vérifiez les détails et réessayez.',
  'shared.error.networkHandler.unknownMessage':
    'Menta a conservé votre place. Essayez quand vous êtes prêt.',
  'shared.error.debug': 'Debug: {message}',
  'shared.boundary.critical.title': "Menta s'arrêta soudainement.",
  'shared.boundary.critical.message':
    'Vos comptes et vos travaux sauvegardés sont toujours ici. Réessayez. Si cela recommence, envoyez un rapport.',
  'shared.boundary.screen.title': 'Ce panneau ne chargait pas.',
  'shared.boundary.screen.message':
    'Essayez le panneau de nouveau, ou revenez à Aujourd’hui.',
  'shared.boundary.component.title': 'Ce secteur ne charge pas.',
  'shared.boundary.component.message':
    'Réessayez. Si cela continue, envoyez un rapport avec les détailss techniques.',
  'shared.boundary.errorDetail': "Détails d'erreur",
  'shared.boundary.errorId': "ID de l'erreur: {id}",
  'shared.boundary.crashDescription':
    'Un composant a rencontré une erreur pendant l’utilisation de Menta.',
  'shared.boundary.expectedBehaviour':
    'Le panneau doit continuer à fonctionner ou à récupérer sans perdre de contexte.',
  'shared.boundary.observedBehaviour':
    "Le panneau a montré une erreur d'erreur bord.",
  'shared.boundary.boundaryLevel': 'Niveau de bord: {level}',
  'shared.boundary.message': 'Message: {message}',
  'shared.confirm.unknown.heading':
    "Nous devons vérifier avant de faire quelque chose d'autre.",
  'shared.confirm.unknown.body':
    'La connexion s’est arrêtée avant que Menta reçoive une réponse fiable. Une nouvelle demande de suppression est bloquée jusqu’à la confirmation de l’état du compte.',
  'shared.confirm.unknown.notice':
    'Menta ne déclarera ni réussite ni échec tant que l’état du compte ne sera pas confirmé.',
  'shared.confirm.failed.heading':
    'Aucune modification n’a été effectuée sur ce compte.',
  'shared.confirm.failed.body':
    'La demande de suppression n’est pas terminée. Votre compte est toujours actif et aucune suppression n’a été confirmée.',
  'shared.confirm.failed.notice':
    "Vous pouvez essayer à nouveau, ou contacter le support si cela continue d'arriver.",
  'shared.confirm.typeToConfirm': 'Entrez "{name}" pour confirmer.',
  'shared.confirm.typeToConfirmAccessibility': 'Entrez {name} pour confirmer',
  'shared.confirm.deleting': 'Effacer...',
  'shared.confirm.tapAgain': 'Tapez à nouveau',
  'shared.confirm.tapAgainWithCost': 'Tapez à nouveau {cost}',
  'shared.confirm.action': '{title}',
  'shared.confirm.actionWithCost': '{title} {cost}',
  'shared.confirm.balance': 'Montant: {balance} {currency}',
  'shared.confirm.notEnough.title': 'Pas assez de Momenta',
  'shared.confirm.notEnough.message':
    'Cette action nécessite davantage de Momenta. Ouvrez la page pour en gagner afin de choisir une option.',
  'shared.oauth.continueGoogle': 'Continuer avec Google',
  'shared.oauth.continueApple': 'Continuer avec Apple',
  'shared.oauth.offline':
    "Vous n'êtes pas en ligne. Reconnectez-vous et réessayez.",
  'shared.oauth.providerUnavailable':
    'La connexion avec {provider} n’est pas disponible ici. Utilisez l’adresse e-mail à la place.',
  'shared.oauth.providerFailed':
    "Impossible de vous connecter avec {provider}. Réessayez ou utilisez l'e-mail en lieu et place.",
  'shared.oauth.cancelled.title': 'Connexion annulée',
  'shared.oauth.cancelled.message':
    "Vous êtes toujours déconnecté. Choisissez Apple, Google ou l'e-mail pour essayer à nouveau.",
  'shared.oauth.opening': 'Ouverture de la connexion avec {provider}',
  'shared.oauth.pending':
    'Laissez Menta ouvert. Vous reviendrez ici une fois la connexion terminée.',
  'shared.update.ready.accessibility': 'Mise à jour de Menta prête',
  'shared.update.ready.title': 'Mise à jour de Menta prête',
  'shared.update.ready.description':
    'Redémarrez Menta pour utiliser les mises à jour les plus récentes et améliorations.',
  'shared.update.ready.restart': 'Redémarrez Menta',
  'shared.update.ready.later': 'Plus tard',
  'shared.update.required.title': 'Mettez à jour Menta pour continuer',
  'shared.update.required.description':
    'Cette version maintient l’activité du compte, des promesses, des preuves et des notifications.',
  'shared.update.optional.title': 'Menta 1.9.2 est prêt',
  'shared.update.optional.description':
    'Cette mise à jour comprend les dernières améliorations de fiabilité et de compatibilité avec l’iPad.',
  'shared.update.onDevice': 'Sur cet appareil',
  'shared.update.minimumVersion': 'Version minimale requise',
  'shared.update.availableVersion': 'Version disponible',
  'shared.update.openStoreHint':
    'Ouvrez la boutique d’applications de votre appareil',
  'shared.update.update': 'Mettez à jour Menta',
  'shared.referral.title': 'Faites scanner le code pour rejoindre',
  'shared.referral.description':
    'Demandez-lui de scanner ce code. Il ouvrira votre lien de parrainage.',
  'shared.referral.unavailable':
    'Code QR non disponible. Vous pouvez toujours essayer les options de partage ou de copie ci-dessous.',
  'shared.referral.preparing': 'Préparation de votre code QR…',
  'shared.image.notAvailable': 'Image non disponible',
  'shared.image.alt': 'Image',
  'shared.image.tapToLoad': 'Tapez pour charger',
  'shared.image.loadFailed': 'Échec du chargement de l’image',
  'shared.boosts.title': 'Bonus',
  'shared.boosts.empty': 'Aucun boost disponible à ce moment-là',
  'shared.streak.day': 'Record du jour',
  'shared.streak.accessibility': 'Série de {streak} jours',
  'shared.streak.compact': '{streak} j',
  'shared.timer.done': "Tâche terminée pour aujourd'hui",
  'shared.timer.unavailable': '—',
  'shared.timer.hoursLeft': '{hours}h {minutes}m restants',
  'shared.timer.minutesLeft': '{minutes} minutes restantes',
  'shared.timeline.day': 'Dernier jour du {day}/{total} jours',
  'shared.timeline.context': '{challenge} dans {group}',
  'shared.timeline.week': 'Semaine {current}/{total}',
  'shared.timeline.complete': '{percent}% complet',
  'shared.timeline.remaining': '{days} jours restants',
  'shared.timeline.aligned': '✓ Aligné',
  'shared.timeline.misaligned': '⚠ Désaligné',
  'shared.timeline.incomplete': '? Incomplet',
  'shared.share.inviteBadge': 'Menta',
  'shared.share.members': '{count} membres',
  'shared.share.progress': '{completed}/{target}',
  'shared.share.referralProgress': 'Progression du parrainage',
  'shared.share.referralDescription': 'Progression de votre parrainage',
  'shared.share.milestoneBadge': 'Étape',
  'shared.share.day': '{day}',
  'shared.share.proofPosted': 'Preuve publiée',
  'shared.share.proofMeta': 'Preuve {proof} · {day}',
  'shared.share.proofMetaWithGroup': 'Preuve {proof} · {day} · {group}',
  'shared.share.proofReceipt': 'Reçu de preuve',
  'shared.share.groupStreak':
    '{members} membres · série de groupe de {days} jours',
  'shared.share.groupLabel': 'Cette page n’est pas disponible',
  'shared.notFound.title': 'Cette page n’est pas disponible',
  'shared.notFound.description':
    'Le lien est peut-être obsolète ou n’existe plus. Rien n’a changé dans votre compte.',
  'shared.systemSettings.title': 'Réglages du téléphone',
  'shared.systemSettings.description':
    'Modifiez les autorisations de notifications, de caméra, de photos ou de mesure publicitaire dans les réglages de votre téléphone. Menta ne peut pas les modifier ni les confirmer depuis cet écran.',
  'shared.systemSettings.open': 'Ouvrir les réglages du téléphone',
  'shared.systemSettings.back': 'Retour au support',
  'shared.systemSettings.return.title': 'Revenez quand vous avez terminé',
  'shared.systemSettings.return.description':
    'L’ouverture des réglages du téléphone ne confirme pas qu’une autorisation a changé.',
  'shared.systemSettings.failed.title':
    'Les réglages du téléphone n’ont pas pu s’ouvrir',
  'shared.systemSettings.failed.description':
    'Rien n’a changé dans Menta. Ouvrez manuellement les réglages de votre téléphone, puis revenez dans l’application.',
  'shared.adTracking.title': 'Mesure publicitaire',
  'shared.adTracking.optional':
    'Menta peut informer Meta lorsqu’une personne qui a vu une publicité s’inscrit plus tard, crée un groupe, crée une promesse ou invite un ami. Votre téléphone vous demandera ensuite votre autorisation. Vous pouvez refuser et continuer à utiliser Menta.',
  'shared.adTracking.education.title': 'La mesure publicitaire est activée',
  'shared.adTracking.education.body':
    'Menta peut mesurer si les publicités de Meta ont aidé une personne à s’inscrire, à créer un groupe, à créer une promesse ou à inviter un ami. Vous pourrez modifier ce choix plus tard dans les réglages de votre téléphone.',
  'shared.adTracking.continueHint':
    'Ouvre la demande d’autorisation de suivi de votre téléphone',
  'shared.adTracking.continue': 'Continuer vers la demande du téléphone',
  'shared.adTracking.notNow': 'Pas maintenant',
  'shared.adTracking.granted.title': 'La mesure publicitaire est désactivée',
  'shared.adTracking.granted.body':
    'Menta continue de fonctionner. Si vous changez d’avis, ouvrez les réglages de votre téléphone et autorisez le suivi pour Menta.',
  'shared.adTracking.denied.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.denied.body':
    'Menta continue de fonctionner. Vous pourrez réessayer plus tard dans les réglages.',
  'shared.adTracking.unavailable.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.unavailable.body':
    'Menta continue de fonctionner. Vous pourrez réessayer plus tard dans les réglages.',
  'shared.adTracking.promptFailed.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.promptFailed.description':
    'Vous pouvez continuer sans mesure publicitaire et réessayer plus tard dans les réglages.',
  'shared.redirect.invite.titleMissing':
    'Le lien de parrainage nécessite un code',
  'shared.redirect.invite.titleExisting':
    'Votre achat de Menta ne nécessite pas de code Menta',
  'shared.redirect.invite.titleOpening':
    'Vous avez déjà ajouté un code Menta à votre compte.',
  'shared.redirect.invite.subtitleMissing':
    'Votre code Menta ne correspond pas à celui qui vous a été envoyé',
  'shared.redirect.invite.subtitleExisting':
    "Cet achat n'a pas d'intermédiaire à travers lequel je puisse ajouter un code Menta",
  'shared.redirect.invite.subtitleOpening':
    'Un code Menta a été ajouté à votre compte et nous vous invitons à continuer.',
  'shared.redirect.invite.missingTitle': "Vous avez besoin d'un code Menta",
  'shared.redirect.invite.missingDescription':
    "Votre ami doit vous envoyer un lien de parrainage pour qu'il puisse accéder à Menta sans un code Menta",
  'shared.redirect.invite.continueWithout':
    'Cet achat ne nécessite pas de code Menta',
  'shared.redirect.invite.accountReady':
    'Votre compte Menta est déjà configuré',
  'shared.redirect.invite.accountDescription':
    'Les liens de parrainage fonctionnent pendant que vous créez votre compte Menta. Vous pouvez continuer avec votre compte actuel.',
  'shared.redirect.invite.continue': 'Continuez à Menta',
  'shared.redirect.invite.saved': 'Le code Menta a été ajouté',
  'shared.redirect.invite.oneMoment': "L'une des étapes suivantes suivent",
  'shared.redirect.invite.savedDescription':
    'Le code Menta a été ajouté et sera visible pendant que vous vous connectez à Menta ou vous enregistrez votre compte',
  'shared.redirect.invite.checking': 'Menta vérifie votre code de parrainage',
  'shared.redirect.join.challengeTitle': 'Le code Menta a été ajouté',
  'shared.redirect.join.challengeSubtitle':
    "La vérification du lien d'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.challengeNoticeTitle':
    'Le code de parrainage a été ajouté',
  'shared.redirect.join.challengeNoticeDescription':
    'La prochaine étape montre le coût de rejoindre Menta avant toute modification',
  'shared.redirect.join.groupTitle': 'L’invitation à un groupe est ouverte',
  'shared.redirect.join.groupSubtitle':
    "La vérification de l'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.groupNoticeTitle': "L'invitation trouvé",
  'shared.redirect.join.groupNoticeDescription':
    'Vous pouvez voir le groupe avant de décider de le rejoindre.',
  'shared.redirect.join.missingTitle':
    "L'invitation doit contenir un code de groupe ou de promesse",
  'shared.redirect.join.missingSubtitle':
    "Ce lien d'invitation ne contient pas de code de groupe ou de promesse",
  'shared.redirect.join.missingNoticeTitle':
    'Le code de parrainage est manquant',
  'shared.redirect.join.missingNoticeDescription':
    "Demandez à votre ami d'envoyer un nouveau lien d'invitation ou saisissez le code de groupe manuellement",
  'shared.redirect.join.openingTitle': 'Votre invitation est ouverte',
  'shared.redirect.join.openingSubtitle':
    "La vérification de l'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.oneMoment': "L'une des étapes suivantes suivent",
  'shared.redirect.join.checking': 'Menta vérifie votre code d’invitation',
  'shared.redirect.join.codeLabel': 'Le code de parrainage',
  'shared.redirect.join.enterCode': 'Veuillez saisir le code de groupe',
  'shared.redirect.join.continueWithout': 'Continuer sans invitation',
  'shared.rootError.title': 'Une erreur est survenue dans Menta',
  'shared.rootError.description':
    'Essayer à nouveau. Si le problème persiste, ouvrez un formulaire de support avec le code suivant.',
  'shared.rootError.supportReference': 'Code de support',
  'shared.rootError.generatingReference': "Génération d'un code technique",
  'shared.rootError.reportIncluded':
    "Le formulaire contient ce code de support. Consultez-le avant de l'envoyer.",
  'shared.rootError.noStateChangedDescription':
    "Essayer à nouveau ne marque pas d'étape incomplète en rapport avec la preuve ou la commande.",
  'shared.rootError.noStateChanged': 'Aucun changement',
  'shared.rootError.reportFormOpened': 'Forme de rapport ouverte',
  'shared.rootError.linkOutOfDate': "Cette lien n'a pas été mis à jour",
  'shared.rootError.linkDidNotChange':
    "Cette lien n'a pas produit d'action. Revenez au support et ouvrez une époque de l'objet actuellement",
  'shared.rootError.linkedItemMoved':
    'La liens groupe, promesse, article de magasin ou invitation peuvent avoir déplacé ou changer',
  'shared.rootError.returnSupport': 'Retournez au support',
  'shared.rootLayout.referralExisting.title':
    "Recherche d'abonnement est pour les comptes neufs",
  'shared.rootLayout.referralExisting.message':
    "Votre compte actuel n'a pas changé.",
  'shared.rootLayout.noProofDue.title': 'Aucune preuve à ce jour',
  'shared.rootLayout.noProofDue.message':
    "Aujourd'hui affichera la prochaine promessee une fois qu'il y aura besoin de preuve.",
  'shared.rootLayout.initialising': 'Initialisation Menta...',
  'shared.web.eyebrow': 'Application iPhone requise',
  'shared.web.title': 'Ouvrez ce lien dans Menta sur iPhone',
  'shared.web.explanation':
    "Menta ne peut pas terminer cette action en mode web. Ouvrez l'origine lien sur un iPhone avec Menta installé.",
  'shared.web.nothingChanged': 'Aucune modification',
  'shared.web.waiting':
    'Votre invitation ou votre brouillon est toujours en attente.',
  'shared.web.continue': 'Continuer sur iPhone',
  'shared.web.openOriginal':
    "Ouvrez l'origine lien à nouveau sur votre iPhone.",
  'shared.camera.proofLink': 'Liens de preuve',
  'shared.camera.openingProofCapture': 'Ouvrez la capture de preuve',
  'shared.camera.needsContext': 'Désolé, il faut un contexte',
  'shared.camera.openingProofCaptureTitle': 'Ouvrez la capture de preuve.',
  'shared.camera.incompleteLinkTitle': 'Liens de preuve incomplets.',
  'shared.camera.handoffDescription':
    'Nous avons redirigé cet ancien lien de caméra vers le lien de preuve actuel, en conservant le groupe et le type de preuve.',
  'shared.camera.incompleteLinkDescription':
    'Cet ancien lien de caméra ne contient pas le groupe ou le type de preuve. Revenez à Aujourd’hui et ouvrez la preuve actuelle depuis le groupe ou le type de preuve concerné.',
  'shared.camera.handoffCardTitle': 'Ouvrez la capture de preuve',
  'shared.camera.recoveryPath': 'Chemin de récupération',
  'shared.camera.noUpload': 'Aucun envoi',
  'shared.camera.preparingViewfinder': 'Préparation de la vue détecteur',
  'shared.camera.noProofAttached': 'Aucune preuve jointe',
  'shared.camera.nextScreenStates':
    'La caméra, la bibliothèque et la preuve écrite sont disponibles sur l’écran suivant.',
  'shared.camera.noSubmissionFromRoute':
    'Aucune preuve envoyée depuis cet ancien lien de compatibilité.',
  'shared.camera.permissionFallback':
    'Autorisation et mise en cache qui restent dans `/verification`.',
  'shared.camera.notSavedUntilAccepted':
    "La preuve n'est pas enregistrée que tant qu'elle est acceptée ou en attente.",
  'shared.camera.backToToday': "Retournez à Aujourd'hui",
  'shared.camera.openCapture': 'Ouvrez la capture de preuve',
  'shared.camera.goBack': 'Retournez',
  'shared.camera.photoProof': 'Preuve photo',
  'shared.camera.textProof': 'Preuve de texte',
  'shared.camera.photoNoun': 'photo',
  'shared.camera.videoNoun': 'vidéo',
  'shared.camera.videoProof': 'Vidéo de preuve',
  'shared.camera.capturedPhotoProof': 'Photographie',
  'shared.camera.checkProof': 'Vérifier vos preuves',
  'shared.camera.savedOnIPad': 'SAUVÉ SUR CET IPAD',
  'shared.camera.savedOnPhone': 'SAUVÉ SUR CE TELEPHONE',
  'shared.camera.notSentYetIPad':
    "Aucune preuve n'a été envoyée. Votre preuve se trouve sur cet iPad jusqu'à ce que vous choisissez d'envoyer.",
  'shared.camera.notSentYetPhone':
    "Aucune preuve n'a été envoyée. Votre preuve se trouve sur votre téléphone jusqu'à ce que vous choisissez d'envoyer.",
  'shared.camera.retakeHintIPad':
    "Retirez une nouvelle preuve si l'action terminée est claire. Cette copie se trouve sur votre appareil jusqu'à ce que vous envoyez.",
  'shared.camera.retakeHintPhone':
    "Retirez une nouvelle preuve si l'action terminée est claire. Cette copie se trouve sur votre téléphone jusqu'à ce que vous envoyez.",
  'shared.camera.retakeProof': 'Retirez une nouvelle preuve',
  'shared.camera.holdToSend': 'Appuyez pour envoyer la preuve',
  'shared.camera.keepHolding': 'Appuyez plus longtemps pour envoyer…',
  'shared.camera.releaseToCancel': 'Désappuyez ou décalez-vous pour annuler',
  'shared.camera.sendOneTap': 'Envoyez la preuve avec un appui',
  'shared.camera.useCameraForProof': 'Utilisez la caméra pour la preuve',
  'shared.camera.cameraPrimerDescription':
    'Menta ouvre la caméra seulement après que vous avez autorisé l’accès. Vous pouvez plutôt choisir une preuve {proofType} enregistrée.',
  'shared.camera.reviewCameraAccess':
    "Évaluer le consentement pour l'accès à la caméra",
  'shared.camera.useTextProofInstead': 'Utilisez une preuve en texte en place',
  'shared.camera.cameraAccess': 'Caméra',
  'shared.camera.microphoneAccess': 'Micro',
  'shared.camera.cameraAndMicrophoneAccess': 'Caméra et micro',
  'shared.camera.allowMicrophoneAccess': 'Autoriser l’accès au microphone',
  'shared.camera.allowCameraAndMicrophoneAccess':
    'Autoriser l’accès à la caméra et au microphone',
  'shared.camera.allowCameraAccess': "Permettez l'accès à la caméra",
  'shared.camera.enablePermissionsInSettings':
    'Activez {permissions} dans les réglages, ou choisissez plutôt une preuve dans votre bibliothèque.',
  'shared.camera.permissionBody':
    'L’accès {permissions} permet à Menta de capturer une preuve {proofType} pour cette promesse. Vous pouvez aussi choisir une preuve {proofType} enregistrée dans votre bibliothèque.',
  'shared.camera.openingSettings': 'Ouvrir les réglages',
  'shared.camera.requestingAccess': "Demandez l'accès",
  'shared.camera.allowPermissions': 'Autoriser {permissions}',
  'shared.camera.cameraAccessOff': 'Accès à la caméra désactivé',
  'shared.camera.cameraAccessOffDescription':
    "Ouvrez les réglages pour activer l'accès à la caméra, ou choisissez une preuve depuis votre bibliothèque à la place.",
  'shared.camera.microphoneAccessOff': 'Accès au microphone désactivé',
  'shared.camera.microphoneAccessOffDescription':
    'Autorisez le microphone pour une preuve vidéo, ou envoyez une preuve photo à la place.',
  'shared.camera.permissionCheckFailed':
    'La vérification de l’autorisation a échoué',
  'shared.camera.permissionCheckFailedDescription':
    "Menta ne pouvait pas ouvrir la fenêtre d'accès. Vérifiez les réglages ou choisissez une preuve depuis votre bibliothèque.",
  'shared.camera.chooseFromLibrary':
    'Choisissez une preuve depuis votre bibliothèque',
  'shared.camera.cancelProof': 'Annulez la preuve',
  'shared.camera.cameraNeedsReset':
    "Le matériel de caméra a besoin d'être réinitialisé",
  'shared.camera.retryProofCamera': 'Recommencez la preuve de caméra',
  'shared.camera.leaveCapture': 'Quitter la capture',
  'shared.camera.capturePaused': 'La capture de preuve est en pause',
  'shared.camera.capturePausedDescription':
    "Passez Menta à l'avant-plan pour reprendre la caméra.",
  'shared.camera.wakingCamera': 'Réactivation de la caméra…',
  'shared.camera.switchCamera': 'Changer de caméra',
  'shared.camera.switchCameraHint':
    'Changez entre les caméras avant et arrière.',
  'shared.camera.stopRecordingVideo': 'Arrêter l’enregistrement vidéo',
  'shared.camera.startRecordingVideo': 'Commencer l’enregistrement vidéo',
  'shared.camera.capturePhoto':
    'Faites un cliché qui montre votre action terminée',
  'shared.camera.recordVideoHint':
    'Faites un court film qui montre votre action terminée.',
  'shared.camera.capturePhotoHint':
    'Faites un cliché qui montre votre action terminée',
  'shared.camera.cancelCapture': 'Annuler la capture de preuve',
  'shared.camera.cancelCaptureHint':
    'Fermez la caméra de preuves sans envoyer preuves.',
  'shared.camera.ready': 'Prêt',
  'shared.camera.missing': 'Manquante',
  'shared.camera.scannerClose': "Fermez l'appel scanneur",
  'shared.camera.scannerChecking': 'Vérification de l’accès à la caméra',
  'shared.camera.checkingTakesMoment':
    'Cela ne prend généralement qu’un instant',
  'shared.camera.scannerPreparing': 'Menta prépare le scanner',
  'shared.camera.scannerCloseShort': "Fermez l'appel scanneur",
  'shared.camera.scannerAccessOff': 'Accès à la caméra désactivé',
  'shared.camera.scannerBlockedDescription':
    'L’accès à la caméra est désactivé pour Menta. Activez-le dans les réglages pour lire le code QR et ouvrir le bon groupe ou la bonne promesse, ou fermez le scanner et saisissez le code manuellement.',
  'shared.camera.scannerPermissionDescription':
    'Autorisez le scanner à lire le code QR et à ouvrir le bon groupe ou la bonne promesse.',
  'shared.camera.scanInvite': 'Scanner une invitation',
  'shared.camera.scannerOpenSettings': 'Ouvrir les réglages',
  'shared.camera.scannerAllowCamera': 'Autoriser la caméra',
  'shared.camera.scannerReset': 'Le scanner doit être réinitialisé',
  'shared.camera.scannerRetry': 'Réessayer le scanner',
  'shared.camera.qrFrame': 'Cadre du scanner',
  'shared.camera.alignQr': 'Alignez le code QR au sein de la caméra',
  'shared.camera.wakingScanner': 'Réactivation du scanner…',
  'shared.camera.preparingScanner': 'Préparation du scanner…',
  'shared.camera.scannerPaused':
    'Le scanner est en pause. Revenez à cet écran pour continuer.',
  'shared.camera.settingsDidNotOpen':
    'Les réglages ne se sont pas ouverts. Ouvrez-les manuellement et autorisez l’accès à la caméra pour Menta.',
  'shared.camera.permissionDidNotOpen':
    'La demande d’autorisation de la caméra ne s’est pas ouverte. Réessayez ou saisissez le code manuellement.',
  'shared.camera.scannerTimeout':
    'Le scanner met trop de temps à démarrer. Réessayez ici.',
  'shared.camera.scannerMountFailed':
    'Le scanner n’a pas démarré correctement. Réessayez ici.',
  'shared.camera.scannerInitialisationFailed':
    'Nous ne pouvons pas préparer le scanner.',
  'shared.camera.reopenSavedProofFailed':
    'Menta ne pouvait pas ouvrir le stockage de preuves enregistré sur ce téléphone.',
  'shared.camera.proofCameraTimeout':
    'La caméra met trop de temps à démarrer. Réessayez ici ou choisissez une preuve dans votre bibliothèque.',
  'shared.camera.signInBeforeSending':
    'Reconnectez-vous avant d’envoyer une preuve.',
  'shared.camera.proofCouldNotOpen': 'Cette preuve ne pouvait pas être ouverte',
  'shared.camera.proofPrepareFailed':
    'Menta n’a pas pu préparer cette preuve. Choisissez une autre capture et réessayez.',
  'shared.camera.videoFinishFailed':
    'Menta n’a pas pu terminer cette vidéo. Essayez un clip plus court.',
  'shared.camera.videoFileMissing': 'Menta ne reçoit pas de fichier vidéo.',
  'shared.camera.videoSaveFailed':
    'Menta n’a pas pu enregistrer cette vidéo. Essayez un clip plus court.',
  'shared.camera.photoFileMissing': 'Menta ne reçoit pas un fichier image.',
  'shared.camera.photoCaptureFailed':
    'Menta n’a pas pu capturer cette image. Réessayez lorsque la caméra sera prête.',
  'shared.camera.proofUploadFailed':
    "La preuve n'a pas été envoyée. Votre capture sauvegardée reste sur ce téléphone.",
  'shared.camera.proofCameraMountFailed':
    "Le caméscope de la preuve n'a pas ouvert correctement. Réessayez ici ou choisissez une preuve de votre bibliothèque.",
  'shared.camera.openSettings': 'Ouvrez les Réglages',
  'shared.legal.terms': "Veuillez lire les conditions d'utilisation.",
  'shared.legal.termsDescription': 'Veuillez lire les présentes conditions.',
  'shared.legal.communityStandards': "Communauté d'enseignement et d'éducation",
  'shared.legal.communityStandardsDescription':
    'Politique des groupes, des promesses et des preuves.',
  'shared.legal.privacy': 'Politique de confidentialité',
  'shared.legal.privacyDescription': 'Comment Menta traite vos informations.',
  'shared.legal.opensInBrowser': 'Ouvrez dans votre navigateur',
  'shared.legal.readDocument': 'Lisez le document',
  'shared.legal.version': 'Version {version}',
  'shared.wizard.stepOf': 'Étape {current} sur {total}',
  'shared.fields.timePickerUnavailable':
    "Le menu de date et d'heure n'est pas disponible sur cette plateforme.",
  'shared.accessibility.toastCount': '{count}x',
  'shared.update.authorityUnknown': 'Autorité inconnue',
} as const satisfies Pick<EnglishCatalogue, FullSharedUiKey>;
