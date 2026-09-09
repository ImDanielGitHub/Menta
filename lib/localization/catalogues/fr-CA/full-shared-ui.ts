import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullSharedUiKey = Extract<keyof EnglishCatalogue, `shared.${string}`>;

export const fullSharedUiFrCA = {
  'shared.navigation.settings': 'Paramètres',
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
    'Invitez QR code. Scan pour ouvrir la lien invité.',
  'shared.accessibility.duplicateInviteQr':
    "Affiche l'Invité QR en plein écran. Invité {code}",
  'shared.action.tryAgain': 'Réessayez',
  'shared.action.reportIssue': 'Signaler un problème',
  'shared.action.backToday': 'Retour à la journée',
  'shared.action.contactSupport': 'Contacter le soutien',
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
  'shared.action.openSettings': 'Ouvrir les paramètres',
  'shared.action.signInNow': 'Se connecter maintenant',
  'shared.action.createAccount': 'Créer un compte',
  'shared.action.retrySubmission': 'Réessayer',
  'shared.action.fixDetails': 'Corriger les détails',
  'shared.action.goToToday': 'Aller à la journée',
  'shared.action.goBack': 'Retourner',
  'shared.error.network.title': 'Menta ne peut pas connecter actuellement.',
  'shared.error.network.message':
    'Votre travail est sécurisé. Réessayez ou souscrire en ligne quand cette flèche permet cela.',
  'shared.error.camera.title': 'La autorisation de la caméra a été interrompue',
  'shared.error.camera.message':
    "Capture de preuve nécessite l'accès à la caméra. Réessayez la caméra, ou ouvrez les paramètres, ou utilisez une autre piste de preuve quand cette route offre une.",
  'shared.error.upload.title': 'Capture de preuve ne a pas pu être envoyée',
  'shared.error.upload.message':
    "Votre capture de preuve est toujours ici. Réessayez l'envoi, sauvegardez-la pour plus tard, ou contactez le soutien si la boucle de révision est bloqué.",
  'shared.error.auth.title': "L'acteur est nécessaire",
  'shared.error.auth.message':
    "Capture de preuve sauvegardée, groupees, révisions et momenta nécessitent un compte Menta. Signalez-vous et revenez à l'action que vous ouvriez.",
  'shared.error.submission.title': 'Capture de preuve ne peut pas être envoyée',
  'shared.error.submission.message':
    "Votre capture de preuve est toujours ici. Réessayez l'envoi, sauvegardez-la pour plus tard, ou contactez le soutien si la boucle de révision est bloqué.",
  'shared.error.validation.title': 'Vérifier les détailss',
  'shared.error.generic.title': 'Ce partie nécessite une nouvel essai',
  'shared.error.generic.message':
    "Menta ne peut pas finir cette action. Votre données d'account sont sécurisées; Réessayez, revenez à la journée, ou contactez le soutien si cela continue.",
  'shared.error.networkHandler.timeout.title': 'Menta prend trop de temps',
  'shared.error.networkHandler.network.title':
    'Menta ne peut pas connecter actuellement.',
  'shared.error.networkHandler.timeout.message':
    "La requête ne s'est pas terminée. Réessayez avant de changer de pages afin que le dernier prouve ou la dernière état de l'account puisse charger.",
  'shared.error.networkHandler.server.title':
    'Menta ne peut pas finir cette requête',
  'shared.error.networkHandler.server.withStatus':
    "Le serveur a retourné {status}. Réessayez d'ici quelques instants; votre place dans Menta est toujours là.",
  'shared.error.networkHandler.server.withoutStatus':
    "Menta a rencontré une problème de serveur. Réessayez d'ici quelques instants; votre place est toujours là.",
  'shared.error.networkHandler.unknown.title':
    'Cette action nécessite une autre nouvel essai',
  'shared.error.networkHandler.unknown.message':
    'Menta a gardé votre place. Réessayez quand vous êtes prêt.',
  'shared.error.networkHandler.networkMessages':
    'Menta ne peut pas connecter actuellement. Votre travail est sécurisé; Réessayez quand vous vous connectez à nouveau.',
  'shared.error.networkHandler.timeoutMessage':
    'Menta prend trop de temps. Réessayez avant de changer de pages.',
  'shared.error.networkHandler.serverMessage':
    'Menta ne peut pas finir cette requête. Votre place est toujours là.',
  'shared.error.networkHandler.notFoundMessage':
    "Cette lien Menta est démodé ou n'est plus disponible.",
  'shared.error.networkHandler.unauthorisedMessage':
    'Signez-vous à nouveau pour tenir compte de votre capture de preuve et de vos actions de groupee liées à votre compte.',
  'shared.error.networkHandler.forbiddenMessage':
    'Cette compte ne peut pas faire cette modification.',
  'shared.error.networkHandler.badRequestMessage':
    'Vérifiez les détailss et réessayez.',
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
    "Un composant a crashé pendant que j'utilisais Menta.",
  'shared.boundary.expectedBehaviour':
    'Le panneau doit continuer à fonctionner ou à récupérer sans perdre de contexte.',
  'shared.boundary.observedBehaviour':
    "Le panneau a montré une erreur d'erreur bord.",
  'shared.boundary.boundaryLevel': 'Niveau de bord: {level}',
  'shared.boundary.message': 'Message: {message}',
  'shared.confirm.unknown.heading':
    "Nous devons vérifier avant de faire quelque chose d'autre.",
  'shared.confirm.unknown.body':
    "La connexion s'est arrêtée avant que Menta ait reçu une réponse fiable. Un autre demande de suppression est bloquée jusqu'à ce que la déclanchement de l'état de l'account soit confirmée.",
  'shared.confirm.unknown.notice':
    "Menta ne reconnaîtra ni ne déclarera de succès ni de défausse jusqu'à ce que le déclanchement de l'état de l'account soit confirmé.",
  'shared.confirm.failed.heading':
    "Aucune modification n'a été effectuée sur cette compte.",
  'shared.confirm.failed.body':
    "La demande de suppression n'a pas été complétée. Votre compte est toujours activé et aucune suppression n'a été confirmée.",
  'shared.confirm.failed.notice':
    "Vous pouvez essayer à nouveau, ou contacter le soutien si cela continue d'arriver.",
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
    "Cette action nécessite plus de Momenta. Ouvrez la scène d'acquisition pour choisir une source d'éarning ou un chemin de recharge.",
  'shared.oauth.continueGoogle': 'Continuer avec Google',
  'shared.oauth.continueApple': 'Continuer avec Apple',
  'shared.oauth.offline':
    "Vous n'êtes pas en ligne. Reconnectez-vous et réessayez.",
  'shared.oauth.providerUnavailable':
    "Sign in with {provider} n'est pas disponible ici. Utilisez l'courriel en lieu et place.",
  'shared.oauth.providerFailed':
    "Impossible de vous connecter avec {provider}. Réessayez ou utilisez l'courriel en lieu et place.",
  'shared.oauth.cancelled.title': 'Connexion annulé',
  'shared.oauth.cancelled.message':
    "Vous êtes toujours déconnecté. Choisissez Apple, Google ou l'courriel pour essayer à nouveau.",
  'shared.oauth.opening': 'Déverrouillez votre {provider} connexion',
  'shared.oauth.pending':
    'Veillez à ce que Menta reste ouvert. Une fois que le connexion est terminé, vous retournez à ce que vous aviez en cours.',
  'shared.update.ready.accessibility': 'Menta mis à jour prête',
  'shared.update.ready.title': 'Menta mis à jour prête',
  'shared.update.ready.description':
    'Redémarrez Menta pour utiliser les mises à jour les plus récentes et améliorations.',
  'shared.update.ready.restart': 'Redémarrez Menta',
  'shared.update.ready.later': 'Plus tard',
  'shared.update.required.title': 'Mettez à jour Menta pour continuer',
  'shared.update.required.description':
    "Ce version maintient l'activité de compte, promesse, preuve et notification.",
  'shared.update.optional.title': 'Menta 1.9.2 est prêt',
  'shared.update.optional.description':
    'Cette mise à jour comprend les dernières améliorations de fiabilité et d’améliorations pour les iPad.',
  'shared.update.onDevice': 'Sur ce appareil',
  'shared.update.minimumVersion': 'Version minimale requise',
  'shared.update.availableVersion': 'Version disponible',
  'shared.update.openStoreHint':
    'Accédez au magasin installé sur votre platforme',
  'shared.update.update': 'Mettez à jour Menta',
  'shared.referral.title': 'Les amènent à scanner pour rejoindre',
  'shared.referral.description':
    'Demandez-leur de scanner ce code. Cela ouvre votre lien de référance.',
  'shared.referral.unavailable':
    'Code QR non disponible. Vous pouvez toujours essayer les options de partage ou de copie ci-dessous.',
  'shared.referral.preparing': 'Préparation de votre code QR…',
  'shared.image.notAvailable': 'Image non disponible',
  'shared.image.alt': 'Image',
  'shared.image.tapToLoad': 'Tapez pour charger',
  'shared.image.loadFailed': 'Charge d’image échouée',
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
  'shared.timeline.aligned': '✓ Alinéés',
  'shared.timeline.misaligned': '⚠ Inalinement',
  'shared.timeline.incomplete': '? Incomplet',
  'shared.share.inviteBadge': 'Menta',
  'shared.share.members': '{count} membres',
  'shared.share.progress': '{completed}/{target}',
  'shared.share.referralProgress': 'Progress referré',
  'shared.share.referralDescription': 'Mémoire progressivée',
  'shared.share.milestoneBadge': 'Étape',
  'shared.share.day': '{day}',
  'shared.share.proofPosted': 'Preuve posted',
  'shared.share.proofMeta': 'Preuve {proof} · {day}',
  'shared.share.proofMetaWithGroup': 'Preuve {proof} · {day} · {group}',
  'shared.share.proofReceipt': 'Mandat de notification téléphonique',
  'shared.share.groupStreak':
    '{members} membres · série de groupe de {days} jours',
  'shared.share.groupLabel': 'Cette page n’est pas disponible',
  'shared.notFound.title': 'Cette page n’est pas disponible',
  'shared.notFound.description':
    'Le lien est peut-être obsolète ou n’existe plus. Rien n’a changé dans votre compte.',
  'shared.systemSettings.title': 'Paramètres du téléphone',
  'shared.systemSettings.description':
    'Modifiez les autorisations de notifications, de caméra, de photos ou de mesure publicitaire dans les paramètres de votre téléphone. Menta ne peut pas les modifier ni les confirmer depuis cet écran.',
  'shared.systemSettings.open': 'Ouvrir les paramètres du téléphone',
  'shared.systemSettings.back': 'Retour au soutien',
  'shared.systemSettings.return.title': 'Revenez quand vous avez terminé',
  'shared.systemSettings.return.description':
    'L’ouverture des paramètres du téléphone ne confirme pas qu’une autorisation a changé.',
  'shared.systemSettings.failed.title':
    'Les paramètres du téléphone n’ont pas pu s’ouvrir',
  'shared.systemSettings.failed.description':
    'Rien n’a changé dans Menta. Ouvrez manuellement les paramètres de votre téléphone, puis revenez dans l’application.',
  'shared.adTracking.title': 'Mesure publicitaire',
  'shared.adTracking.optional':
    'Menta peut informer Meta lorsqu’une personne qui a vu une publicité s’inscrit plus tard, crée un groupe, crée une promesse ou invite un ami. Votre téléphone vous demandera ensuite votre autorisation. Vous pouvez refuser et continuer à utiliser Menta.',
  'shared.adTracking.education.title': 'La mesure publicitaire est activée',
  'shared.adTracking.education.body':
    'Menta peut mesurer si les publicités de Meta ont aidé une personne à s’inscrire, à créer un groupe, à créer une promesse ou à inviter un ami. Vous pourrez modifier ce choix plus tard dans les paramètres de votre téléphone.',
  'shared.adTracking.continueHint':
    'Ouvre la demande d’autorisation de suivi de votre téléphone',
  'shared.adTracking.continue': 'Continuer vers la demande du téléphone',
  'shared.adTracking.notNow': 'Pas maintenant',
  'shared.adTracking.granted.title': 'La mesure publicitaire est désactivée',
  'shared.adTracking.granted.body':
    'Menta continue de fonctionner. Si vous changez d’avis, ouvrez les paramètres de votre téléphone et autorisez le suivi pour Menta.',
  'shared.adTracking.denied.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.denied.body':
    'Menta continue de fonctionner. Vous pourrez réessayer plus tard dans les paramètres.',
  'shared.adTracking.unavailable.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.unavailable.body':
    'Menta continue de fonctionner. Vous pourrez réessayer plus tard dans les paramètres.',
  'shared.adTracking.promptFailed.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.promptFailed.description':
    'Vous pouvez continuer sans mesure publicitaire et réessayer plus tard dans les paramètres.',
  'shared.redirect.invite.titleMissing': 'Referral link needs a code',
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
    "Votre ami doit vous envoyer un lien de référé pour qu'il puisse accéder à Menta sans un code Menta",
  'shared.redirect.invite.continueWithout':
    'Cet achat ne nécessite pas de code Menta',
  'shared.redirect.invite.accountReady':
    'Votre compte Menta est déjà configuré',
  'shared.redirect.invite.accountDescription':
    'Les liens de référé fonctionnent pendant que vous créez votre compte Menta. Vous pouvez continuer avec votre compte actuel.',
  'shared.redirect.invite.continue': 'Continuez à Menta',
  'shared.redirect.invite.saved': 'Le code Menta a été ajouté',
  'shared.redirect.invite.oneMoment': "L'une des étapes suivantes suivent",
  'shared.redirect.invite.savedDescription':
    'Le code Menta a été ajouté et sera visible pendant que vous vous connectez à Menta ou vous enregistrez votre compte',
  'shared.redirect.invite.checking': 'Menta est vérifiant votre code de référé',
  'shared.redirect.join.challengeTitle': 'Le code Menta a été ajouté',
  'shared.redirect.join.challengeSubtitle':
    "La vérification du lien d'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.challengeNoticeTitle': 'Le code de référé a été ajouté',
  'shared.redirect.join.challengeNoticeDescription':
    'La prochaine étape montre le coût de rejoindre Menta avant toute modification',
  'shared.redirect.join.groupTitle': "L'invitation à une groupee est ouverte",
  'shared.redirect.join.groupSubtitle':
    "La vérification de l'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.groupNoticeTitle': "L'invitation trouvé",
  'shared.redirect.join.groupNoticeDescription':
    "Vous pouvez voir la groupee avant de décider de l'adhésion.",
  'shared.redirect.join.missingTitle':
    "L'invitation doit contenir un code de groupee ou de promesse",
  'shared.redirect.join.missingSubtitle':
    "Ce lien d'invitation ne contient pas de code de groupee ou de promesse",
  'shared.redirect.join.missingNoticeTitle': 'Le code de référé est manquant',
  'shared.redirect.join.missingNoticeDescription':
    "Demandez à votre ami d'envoyer un nouveau lien d'invitation ou saisissez le code de groupee manuellement",
  'shared.redirect.join.openingTitle': 'Votre invitation est ouverte',
  'shared.redirect.join.openingSubtitle':
    "La vérification de l'invitation est en cours et votre statut de connexion est vérifié.",
  'shared.redirect.join.oneMoment': "L'une des étapes suivantes suivent",
  'shared.redirect.join.checking': 'Menta est vérifiant votre code de référé',
  'shared.redirect.join.codeLabel': 'Le code de référé',
  'shared.redirect.join.enterCode': 'Veuillez saisir le code de groupee',
  'shared.redirect.join.continueWithout': 'Continuer sans invitation',
  'shared.rootError.title': 'Une erreur est survenue dans Menta',
  'shared.rootError.description':
    'Essayer à nouveau. Si le problème persiste, ouvrez un formulaire de soutien avec le code suivant.',
  'shared.rootError.supportReference': 'Code de soutien',
  'shared.rootError.generatingReference': "Génération d'un code technique",
  'shared.rootError.reportIncluded':
    "Le formulaire contient ce code de soutien. Consultez-le avant de l'envoyer.",
  'shared.rootError.noStateChangedDescription':
    "Essayer à nouveau ne marque pas d'étape incomplète en rapport avec la preuve ou la commande.",
  'shared.rootError.noStateChanged': 'Aucune changement',
  'shared.rootError.reportFormOpened': 'Forme de rapport ouverte',
  'shared.rootError.linkOutOfDate': "Cette lien n'a pas été mis à jour",
  'shared.rootError.linkDidNotChange':
    "Cette lien n'a pas produit d'action. Revenez au soutien et ouvrez une époque de l'objet actuellement",
  'shared.rootError.linkedItemMoved':
    'La liens groupee, promesse, article de magasin ou invitation peuvent avoir déplacé ou changer',
  'shared.rootError.returnSupport': 'Retournez au soutien',
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
  'shared.web.waiting': 'Votre invitation ou draft est toujours en attente.',
  'shared.web.continue': 'Continuer sur iPhone',
  'shared.web.openOriginal':
    "Ouvrez l'origine lien à nouveau sur votre iPhone.",
  'shared.camera.proofLink': 'Liens de preuve',
  'shared.camera.openingProofCapture': 'Ouvrez la capture de preuve',
  'shared.camera.needsContext': 'Désolé, il faut un contexte',
  'shared.camera.openingProofCaptureTitle': 'Ouvrez la capture de preuve.',
  'shared.camera.incompleteLinkTitle': 'Liens de preuve incomplets.',
  'shared.camera.handoffDescription':
    'Nous avons déplacé cette vieille lien de camera vers le lien de preuve actuel avec le groupee, le type de preuve et le source intacte.',
  'shared.camera.incompleteLinkDescription':
    "Cette vieille lien de camera est manquant du groupee ou du type de preuve. Redirigez-vous vers Aujourd'hui et ouvrez la preuve actuelle en tenant compte du groupee ou du type de preuve.",
  'shared.camera.handoffCardTitle': 'Ouvrez la capture de preuve',
  'shared.camera.recoveryPath': 'Chemin de récupération',
  'shared.camera.noUpload': 'Aucune mise en cache',
  'shared.camera.preparingViewfinder': 'Préparation de la vue détecteur',
  'shared.camera.noProofAttached': 'Aucune preuve attachée',
  'shared.camera.nextScreenStates':
    'Caméra, bibliothèque et texte enregistrés sont enregistrés sur la prochaine page.',
  'shared.camera.noSubmissionFromRoute':
    'Aucune mise en cache soumise de cette route de compatibilité.',
  'shared.camera.permissionFallback':
    'Autorisation et mise en cache qui restent dans `/verification`.',
  'shared.camera.notSavedUntilAccepted':
    "La preuve n'est pas enregistrée que tant qu'elle est acceptée ou en attente.",
  'shared.camera.backToToday': "Retournez à Aujourd'hui",
  'shared.camera.openCapture': 'Ouvrez la capture de preuve',
  'shared.camera.goBack': 'Retournez',
  'shared.camera.photoProof': 'Preuve de photo',
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
  'shared.camera.allowMicrophoneAccess': "Permettez l'accès à la caméra",
  'shared.camera.allowCameraAndMicrophoneAccess':
    "Permettez l'accès à la caméra et à la micro-ondes accès",
  'shared.camera.allowCameraAccess': "Permettez l'accès à la caméra",
  'shared.camera.enablePermissionsInSettings':
    'Activez {permissions} dans les paramètres, ou choisissez plutôt une preuve dans votre bibliothèque.',
  'shared.camera.permissionBody':
    'L’accès {permissions} permet à Menta de capturer une preuve {proofType} pour cette promesse. Vous pouvez aussi choisir une preuve {proofType} enregistrée dans votre bibliothèque.',
  'shared.camera.openingSettings': 'Ouvrir les paramètres',
  'shared.camera.requestingAccess': "Demandez l'accès",
  'shared.camera.allowPermissions': 'Autoriser {permissions}',
  'shared.camera.cameraAccessOff': 'Accès à la caméra désactivé',
  'shared.camera.cameraAccessOffDescription':
    "Ouvrez les paramètres pour activer l'accès à la caméra, ou choisissez une preuve depuis votre bibliothèque à la place.",
  'shared.camera.microphoneAccessOff': 'Accès à la caméra désactivé',
  'shared.camera.microphoneAccessOffDescription':
    "Permettez l'accès à la micro-ondes pour une preuve vidéo, ou envoyez une preuve en photographie en lieu et place.",
  'shared.camera.permissionCheckFailed':
    'Évaluation de la autorisation a échoué',
  'shared.camera.permissionCheckFailedDescription':
    "Menta ne pouvait pas ouvrir la fenêtre d'accès. Vérifiez les paramètres ou choisissez une preuve depuis votre bibliothèque.",
  'shared.camera.chooseFromLibrary':
    'Choisissez une preuve depuis votre bibliothèque',
  'shared.camera.cancelProof': 'Annulez la preuve',
  'shared.camera.cameraNeedsReset':
    "Le matériel de caméra a besoin d'être réinitialisé",
  'shared.camera.retryProofCamera': 'Recommencez la preuve de caméra',
  'shared.camera.leaveCapture': 'Laisser le capturer',
  'shared.camera.capturePaused': 'Le capturer de preuves est arrêté',
  'shared.camera.capturePausedDescription':
    "Passez Menta à l'avant-plan pour reprendre la caméra.",
  'shared.camera.wakingCamera': 'Allumez la caméra de preuves…',
  'shared.camera.switchCamera': 'Changez la caméra',
  'shared.camera.switchCameraHint':
    'Changez entre les caméras avant et arrière.',
  'shared.camera.stopRecordingVideo': 'Arrêtez le capteur de preuves vidéo',
  'shared.camera.startRecordingVideo': 'Commencez à capter preuves vidéo',
  'shared.camera.capturePhoto':
    'Faites un cliché qui montre votre action terminée',
  'shared.camera.recordVideoHint':
    'Faites un court film qui montre votre action terminée.',
  'shared.camera.capturePhotoHint':
    'Faites un cliché qui montre votre action terminée',
  'shared.camera.cancelCapture': 'Annulez la caméra de preuves',
  'shared.camera.cancelCaptureHint':
    'Fermez la caméra de preuves sans envoyer preuves.',
  'shared.camera.ready': 'Prêt',
  'shared.camera.missing': 'Manquante',
  'shared.camera.scannerClose': "Fermez l'appel scanneur",
  'shared.camera.scannerChecking': 'Veillez que le caméra accès soit off',
  'shared.camera.checkingTakesMoment': 'Cette est souvent une seconde',
  'shared.camera.scannerPreparing':
    "Menta est en train de préparer l'appel scanneur",
  'shared.camera.scannerCloseShort': "Fermez l'appel scanneur",
  'shared.camera.scannerAccessOff': 'Le caméra accès est fermé',
  'shared.camera.scannerBlockedDescription':
    'Le caméra accès est fermé pour Menta. Activer le caméra accès dans les paramètres pour lire le code QR et ouvrir la bonne groupee ou promesse, ou fermez ce scanneur et entrez le code manuellement.',
  'shared.camera.scannerPermissionDescription':
    "Permettez que l'appel scanneur puisse ouvrir le code QR et ouvrir la bonne groupee ou promesse.",
  'shared.camera.scanInvite': 'Appel scanneur à lire une invite',
  'shared.camera.scannerOpenSettings': "Accès à l'endroit",
  'shared.camera.scannerAllowCamera': 'Permettez la caméra',
  'shared.camera.scannerReset': "L'appel scanneur doit être réinitialisé",
  'shared.camera.scannerRetry': "Réessayez l'appel scanneur",
  'shared.camera.qrFrame': 'Cadre de l’appel du scanneur',
  'shared.camera.alignQr': 'Alignez le code QR au sein de la caméra',
  'shared.camera.wakingScanner': "Allumez l'appel scanneur…",
  'shared.camera.preparingScanner': "Préparez l'appel scanneur…",
  'shared.camera.scannerPaused':
    "L'appel scanneur est arrêté. Rappelez-vous de revenir à cette écran pour continuer.",
  'shared.camera.settingsDidNotOpen':
    "Les paramètres n'ont pas ouvert. Ouvrez les paramètres à la main et permettez la caméra accès pour Menta.",
  'shared.camera.permissionDidNotOpen':
    "La autorisation des caméras n'a pas ouvert. Vous pouvez retry, ou entrez le code d'appel manuellement.",
  'shared.camera.scannerTimeout':
    "L'appel scanneur ne se réveille pas rapidement. Réessayez ici d'abord.",
  'shared.camera.scannerMountFailed':
    "L'appel scanneur ne se réveille pas correctement. Réessayez ici d'abord.",
  'shared.camera.scannerInitialisationFailed':
    "Nous ne pouvons pas préparer l'appel scanneur.",
  'shared.camera.reopenSavedProofFailed':
    'Menta ne pouvait pas ouvrir le stockage de preuves enregistré sur ce téléphone.',
  'shared.camera.proofCameraTimeout':
    'La caméra de preuves est en train de se réveiller trop longtemps. Réessayez ici ou choisissez le preuve à partir de votre bibliothèque.',
  'shared.camera.signInBeforeSending':
    'Veuillez vous connecter à nouveau avant de verser une preuve.',
  'shared.camera.proofCouldNotOpen': 'Cette preuve ne pouvait pas être ouverte',
  'shared.camera.proofPrepareFailed':
    'Menta ne pouvait pas préparer cette preuve. Choisissez une autre prise et réessayez.',
  'shared.camera.videoFinishFailed':
    'Menta ne pouvait pas terminer ce vidéo. Essaie un autre morceau plus court.',
  'shared.camera.videoFileMissing': 'Menta ne reçoit pas de fichier vidéo.',
  'shared.camera.videoSaveFailed':
    'Menta ne peut pas sauvegarder ce morceau vidéo. Essaie un autre morceau plus court.',
  'shared.camera.photoFileMissing': 'Menta ne reçoit pas un fichier image.',
  'shared.camera.photoCaptureFailed':
    'Menta ne peut pas capturer ce fichier image. Essaie de nouveau quand le caméra sera prête.',
  'shared.camera.proofUploadFailed':
    "La preuve n'a pas été envoyée. Votre capture sauvegardée reste sur ce téléphone.",
  'shared.camera.proofCameraMountFailed':
    "Le caméscope de la preuve n'a pas ouvert correctement. Réessayez ici ou choisissez une preuve de votre bibliothèque.",
  'shared.camera.openSettings': 'Ouvrez les Paramètres',
  'shared.legal.terms': "Veuillez lire les conditions d'utilisation.",
  'shared.legal.termsDescription': 'Veuillez lire les présentes conditions.',
  'shared.legal.communityStandards': "Communauté d'enseignement et d'éducation",
  'shared.legal.communityStandardsDescription':
    'Politique des groupees, des promesses et des preuves.',
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
