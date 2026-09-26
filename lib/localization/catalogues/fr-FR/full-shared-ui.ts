import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullSharedUiKey = Extract<keyof EnglishCatalogue, `shared.${string}`>;

export const fullSharedUiFrFR = {
  'shared.navigation.settings': 'Réglages',
  'shared.redirect.invite.navTitle': 'Inviter',
  'shared.redirect.join.navTitle': 'Rejoindre',
  'shared.accessibility.primaryNavigation': 'Navigation principale',
  'shared.accessibility.tabSelected': '{label} est sélectionné.',
  'shared.accessibility.tabOpens': 'Ouvre {label}.',
  'shared.accessibility.choiceSummary': '{title}. {description}',
  'shared.accessibility.itemSummary': '{meta}. {title}. {subtitle}. {value}',
  'shared.accessibility.toastAnnouncement': '{title}. {message}',
  'shared.accessibility.toastRepeated': 'Ce message s’est affiché {count} fois',
  'shared.accessibility.dismissNotification': 'Fermer la notification',
  'shared.accessibility.dismiss': 'Fermer',
  'shared.accessibility.dismissSheet': 'Fermer la fenêtre',
  'shared.accessibility.scrollMore':
    '{hint}. Faites glisser vers le haut pour continuer à lire.',
  'shared.accessibility.scrollHint': 'Faire défiler pour voir la suite',
  'shared.accessibility.loading': 'Chargement du contenu',
  'shared.accessibility.mentaLoading': 'Menta se charge',
  'shared.accessibility.loadingRetry':
    'Chargement du contenu. Touchez pour réessayer.',
  'shared.accessibility.loadingText': 'Chargement du texte',
  'shared.accessibility.loadingImage': "Chargement de l'image",
  'shared.accessibility.doneEditing': 'Terminer la saisie',
  'shared.accessibility.hidePassword': 'Masquer le mot de passe',
  'shared.accessibility.showPassword': 'Afficher le mot de passe',
  'shared.accessibility.networkRetry': 'Réessayer la connexion',
  'shared.accessibility.updateRequired': 'Mise à jour de Menta requise',
  'shared.accessibility.updateAvailable': 'Mise à jour de Menta disponible',
  'shared.accessibility.referralQr':
    'Code QR d’invitation. Scannez-le pour ouvrir le lien d’invitation.',
  'shared.accessibility.duplicateInviteQr':
    'Affiche le code QR d’invitation en plein écran. Invitation {code}',
  'shared.action.tryAgain': 'Réessayer',
  'shared.action.reportIssue': 'Signaler un problème',
  'shared.action.backToday': 'Retour à Aujourd’hui',
  'shared.action.contactSupport': 'Contacter le support',
  'shared.action.getHelp': "Obtenir de l'aide",
  'shared.action.close': 'Fermer',
  'shared.action.cancel': 'Annuler',
  'shared.action.confirm': 'Confirmer',
  'shared.action.done': 'Terminé',
  'shared.action.next': 'Suivant',
  'shared.action.working': 'En cours...',
  'shared.action.checkAgain': 'Vérifier à nouveau',
  'shared.action.keepCurrentScreen': 'Rester sur cet écran',
  'shared.action.retryConnection': 'Réessayer la connexion',
  'shared.action.workOffline': 'Travailler hors ligne',
  'shared.action.retryUpload': 'Réessayer l’envoi',
  'shared.action.saveProofForLater': 'Enregistrer la preuve pour plus tard',
  'shared.action.saveForLater': 'Enregistrer pour plus tard',
  'shared.action.tryCameraAgain': 'Réessayer la caméra',
  'shared.action.openSettings': 'Ouvrir les réglages',
  'shared.action.signInNow': 'Se connecter maintenant',
  'shared.action.createAccount': 'Créer un compte',
  'shared.action.retrySubmission': 'Réessayer l’envoi',
  'shared.action.fixDetails': 'Corriger les informations',
  'shared.action.goToToday': 'Aller à Aujourd’hui',
  'shared.action.goBack': 'Retour',
  'shared.error.network.title':
    'Menta ne peut pas se connecter pour le moment.',
  'shared.error.network.message':
    'Votre travail est en sécurité. Réessayez, ou continuez hors ligne si cet écran le permet.',
  'shared.error.camera.title': 'Autorisation de la caméra en pause',
  'shared.error.camera.message':
    'La capture d’une preuve nécessite l’accès à la caméra. Réessayez, ouvrez les réglages ou choisissez un autre type de preuve lorsque cette option est proposée.',
  'shared.error.upload.title': 'La preuve n’a pas été envoyée',
  'shared.error.upload.message':
    'Votre preuve est toujours jointe. Réessayez l’envoi, ou enregistrez-la pour plus tard si cet écran permet la reprise hors ligne.',
  'shared.error.auth.title': 'Compte requis',
  'shared.error.auth.message':
    'Les preuves enregistrées, les groupes, les vérifications et Momenta nécessitent un compte Menta. Connectez-vous, puis revenez à l’action que vous ouvriez.',
  'shared.error.submission.title': 'La preuve n’a pas pu être envoyée',
  'shared.error.submission.message':
    'Votre preuve est toujours là. Réessayez l’envoi, enregistrez-la pour plus tard ou contactez le support si la vérification est bloquée.',
  'shared.error.validation.title': 'Vérifiez les détails',
  'shared.error.generic.title': 'Cette partie doit être relancée',
  'shared.error.generic.message':
    'Menta n’a pas pu terminer cette action. Les données de votre compte sont en sécurité. Réessayez, revenez à Aujourd’hui ou contactez le support si le problème persiste.',
  'shared.error.networkHandler.timeout.title': 'Menta prend trop de temps',
  'shared.error.networkHandler.network.title':
    'Menta ne peut pas se connecter pour le moment.',
  'shared.error.networkHandler.timeout.message':
    'La requête n’a pas abouti. Réessayez avant de changer d’écran pour que le dernier état de votre preuve ou de votre compte puisse se charger.',
  'shared.error.networkHandler.server.title':
    'Menta n’a pas pu terminer cette requête',
  'shared.error.networkHandler.server.withStatus':
    'Le serveur a renvoyé {status}. Réessayez dans un instant. Vous êtes toujours au même endroit dans Menta.',
  'shared.error.networkHandler.server.withoutStatus':
    'Menta a rencontré un problème de serveur. Réessayez dans un instant. Vous êtes toujours au même endroit.',
  'shared.error.networkHandler.unknown.title':
    'Cette action doit être réessayée',
  'shared.error.networkHandler.unknown.message':
    'Menta a gardé votre place. Réessayez quand vous êtes prêt.',
  'shared.error.networkHandler.networkMessages':
    'Menta ne peut pas se connecter pour le moment. Votre travail est en sécurité. Réessayez lorsque la connexion sera disponible.',
  'shared.error.networkHandler.timeoutMessage':
    'Menta prend trop de temps. Réessayez avant de changer d’écran.',
  'shared.error.networkHandler.serverMessage':
    'Menta n’a pas pu terminer cette requête. Vous êtes toujours au même endroit.',
  'shared.error.networkHandler.notFoundMessage':
    'Ce lien Menta est obsolète ou n’est plus disponible.',
  'shared.error.networkHandler.unauthorisedMessage':
    'Reconnectez-vous pour que vos preuves et vos actions de groupe restent liées à votre compte.',
  'shared.error.networkHandler.forbiddenMessage':
    'Ce compte ne peut pas effectuer cette modification.',
  'shared.error.networkHandler.badRequestMessage':
    'Vérifiez les détails et réessayez.',
  'shared.error.networkHandler.unknownMessage':
    'Menta a gardé votre place. Réessayez quand vous êtes prêt.',
  'shared.error.debug': 'Débogage : {message}',
  'shared.boundary.critical.title': 'Menta s’est arrêté de manière inattendue.',
  'shared.boundary.critical.message':
    'Votre compte et votre travail enregistré sont toujours là. Réessayez. Si le problème se reproduit, envoyez un signalement.',
  'shared.boundary.screen.title': 'Cet écran ne s’est pas chargé.',
  'shared.boundary.screen.message':
    'Rechargez l’écran ou revenez à Aujourd’hui.',
  'shared.boundary.component.title': 'Cette section n’a pas pu se charger.',
  'shared.boundary.component.message':
    'Réessayez. Si le problème persiste, envoyez un signalement avec les détails techniques joints.',
  'shared.boundary.errorDetail': 'Détail de l’erreur',
  'shared.boundary.errorId': "ID de l'erreur: {id}",
  'shared.boundary.crashDescription':
    'Un composant a planté pendant que j’utilisais Menta.',
  'shared.boundary.expectedBehaviour':
    'L’écran devrait continuer à fonctionner ou se rétablir sans perdre le contexte.',
  'shared.boundary.observedBehaviour':
    'L’application a affiché une limite d’erreur de composant.',
  'shared.boundary.boundaryLevel': 'Niveau de la limite : {level}',
  'shared.boundary.message': 'Message: {message}',
  'shared.confirm.unknown.heading':
    'Nous devons vérifier avant de faire quoi que ce soit d’autre.',
  'shared.confirm.unknown.body':
    'La connexion s’est arrêtée avant que Menta reçoive une réponse fiable. Une nouvelle demande de suppression est bloquée jusqu’à la confirmation de l’état du compte.',
  'shared.confirm.unknown.notice':
    'Menta ne déclarera ni réussite ni échec tant que l’état du compte ne sera pas confirmé.',
  'shared.confirm.failed.heading':
    'Aucune modification n’a été effectuée sur ce compte.',
  'shared.confirm.failed.body':
    'La demande de suppression n’est pas terminée. Votre compte est toujours actif et aucune suppression n’a été confirmée.',
  'shared.confirm.failed.notice':
    'Vous pouvez réessayer, ou contacter le support si le problème persiste.',
  'shared.confirm.typeToConfirm': 'Saisissez « {name} » pour confirmer.',
  'shared.confirm.typeToConfirmAccessibility':
    'Saisissez {name} pour confirmer',
  'shared.confirm.deleting': 'Suppression…',
  'shared.confirm.tapAgain': 'Touchez à nouveau',
  'shared.confirm.tapAgainWithCost': 'Touchez à nouveau {cost}',
  'shared.confirm.action': '{title}',
  'shared.confirm.actionWithCost': '{title} {cost}',
  'shared.confirm.balance': 'Solde : {balance} {currency}',
  'shared.confirm.notEnough.title': 'Pas assez de Momenta',
  'shared.confirm.notEnough.message':
    'Cette action nécessite plus de Momenta. Ouvrez l’écran concerné pour choisir comment en gagner ou recharger.',
  'shared.oauth.continueGoogle': 'Continuer avec Google',
  'shared.oauth.continueApple': 'Continuer avec Apple',
  'shared.oauth.offline':
    'Vous êtes hors ligne. Reconnectez-vous et réessayez.',
  'shared.oauth.providerUnavailable':
    'La connexion avec {provider} n’est pas disponible ici. Utilisez l’adresse e-mail à la place.',
  'shared.oauth.providerFailed':
    'Impossible de vous connecter avec {provider}. Réessayez ou utilisez plutôt l’adresse e-mail.',
  'shared.oauth.cancelled.title': 'Connexion annulée',
  'shared.oauth.cancelled.message':
    'Vous êtes toujours déconnecté. Choisissez Apple, Google ou l’adresse e-mail pour réessayer.',
  'shared.oauth.opening': 'Ouverture de la connexion avec {provider}',
  'shared.oauth.pending':
    'Laissez Menta ouvert. Vous reviendrez ici une fois la connexion terminée.',
  'shared.update.ready.accessibility': 'Mise à jour de Menta prête',
  'shared.update.ready.title': 'Mise à jour de Menta prête',
  'shared.update.ready.description':
    'Redémarrez Menta pour profiter des dernières corrections et améliorations.',
  'shared.update.ready.restart': 'Redémarrer Menta',
  'shared.update.ready.later': 'Plus tard',
  'shared.update.required.title': 'Mettez à jour Menta pour continuer',
  'shared.update.required.description':
    'Cette version garde le fonctionnement du compte, des promesses, des preuves et des notifications synchronisé.',
  'shared.update.optional.title': 'Menta 1.9.2 est prêt',
  'shared.update.optional.description':
    'Cette mise à jour comprend les dernières améliorations de fiabilité et de compatibilité avec l’iPad.',
  'shared.update.onDevice': 'Sur cet appareil',
  'shared.update.minimumVersion': 'Version minimale requise',
  'shared.update.availableVersion': 'Version disponible',
  'shared.update.openStoreHint':
    'Ouvre la page de la boutique de votre appareil',
  'shared.update.update': 'Mettre à jour Menta',
  'shared.referral.title': 'Faites scanner pour rejoindre',
  'shared.referral.description':
    'Demandez-leur de scanner ce code. Il ouvre votre lien de parrainage.',
  'shared.referral.unavailable':
    'Code QR non disponible. Vous pouvez toujours essayer les options de partage ou de copie ci-dessous.',
  'shared.referral.preparing': 'Préparation de votre code QR…',
  'shared.image.notAvailable': 'Image non disponible',
  'shared.image.alt': 'Image',
  'shared.image.tapToLoad': 'Touchez pour charger',
  'shared.image.loadFailed': 'Échec du chargement de l’image',
  'shared.boosts.title': 'Bonus',
  'shared.boosts.empty': 'Aucun bonus disponible pour le moment',
  'shared.streak.day': 'Jours de série',
  'shared.streak.accessibility': 'Série de {streak} jours',
  'shared.streak.compact': '{streak} j',
  'shared.timer.done': 'Terminé pour aujourd’hui',
  'shared.timer.unavailable': '—',
  'shared.timer.hoursLeft': '{hours} h {minutes} min restantes',
  'shared.timer.minutesLeft': '{minutes} min restantes',
  'shared.timeline.day': 'Jour {day} sur {total}',
  'shared.timeline.context': '{challenge} dans {group}',
  'shared.timeline.week': 'Semaine {current}/{total}',
  'shared.timeline.complete': '{percent} % terminé',
  'shared.timeline.remaining': '{days} jours restants',
  'shared.timeline.aligned': '✓ Aligné',
  'shared.timeline.misaligned': '⚠ Désaligné',
  'shared.timeline.incomplete': '? Incomplet',
  'shared.share.inviteBadge': 'Menta',
  'shared.share.members': '{count} membres',
  'shared.share.progress': '{completed}/{target}',
  'shared.share.referralProgress': 'Progression du parrainage',
  'shared.share.referralDescription':
    'Une progression partagée inspire plus confiance quand la preuve est visible.',
  'shared.share.milestoneBadge': 'Étape',
  'shared.share.day': 'Jour {day}',
  'shared.share.proofPosted': 'Preuve publiée',
  'shared.share.proofMeta': 'Preuve {proof} · {day}',
  'shared.share.proofMetaWithGroup': 'Preuve {proof} · {day} · {group}',
  'shared.share.proofReceipt': 'Reçu de preuve',
  'shared.share.groupStreak':
    '{members} membres · série de groupe de {days} jours',
  'shared.share.groupLabel': 'Groupe Menta',
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
  'shared.adTracking.optional': 'Facultatif',
  'shared.adTracking.education.title':
    'Mesurer l’efficacité des publicités Meta ?',
  'shared.adTracking.education.body':
    'Menta peut informer Meta lorsqu’une personne qui a vu une publicité s’inscrit, crée un groupe, crée une promesse ou invite un ami. Votre téléphone vous demandera ensuite votre autorisation. Vous pouvez refuser et continuer à utiliser Menta.',
  'shared.adTracking.continueHint':
    'Ouvre la demande d’autorisation de suivi de votre téléphone',
  'shared.adTracking.continue': 'Continuer vers la demande du téléphone',
  'shared.adTracking.notNow': 'Pas maintenant',
  'shared.adTracking.granted.title': 'La mesure publicitaire est activée',
  'shared.adTracking.granted.body':
    'Menta peut mesurer si les publicités Meta ont aidé une personne à s’inscrire, à créer un groupe, à créer une promesse ou à inviter un ami. Vous pourrez modifier ce choix plus tard dans les réglages de votre téléphone.',
  'shared.adTracking.denied.title': 'La mesure publicitaire est désactivée',
  'shared.adTracking.denied.body':
    'Menta continue de fonctionner. Si vous changez d’avis, ouvrez les réglages de votre téléphone et autorisez le suivi pour Menta.',
  'shared.adTracking.unavailable.title':
    'La mesure publicitaire n’est pas disponible',
  'shared.adTracking.unavailable.body':
    'Menta continue de fonctionner. Vous pourrez réessayer plus tard dans les réglages.',
  'shared.adTracking.promptFailed.title':
    'La demande du téléphone n’a pas pu s’ouvrir',
  'shared.adTracking.promptFailed.description':
    'Vous pouvez continuer sans mesure publicitaire et réessayer plus tard dans les réglages.',
  'shared.redirect.invite.titleMissing':
    'Le lien de parrainage nécessite un code',
  'shared.redirect.invite.titleExisting':
    'Le parrainage est réservé aux nouveaux comptes',
  'shared.redirect.invite.titleOpening': 'Ouverture du parrainage',
  'shared.redirect.invite.subtitleMissing':
    'Ce lien de parrainage ne contient pas le code dont Menta a besoin.',
  'shared.redirect.invite.subtitleExisting':
    'Ce compte est déjà configuré, donc Menta ne modifiera pas son parrainage.',
  'shared.redirect.invite.subtitleOpening':
    'Nous enregistrons le parrainage et vous ramenons dans Menta.',
  'shared.redirect.invite.missingTitle': 'Code de parrainage manquant',
  'shared.redirect.invite.missingDescription':
    'Demandez à votre ami de renvoyer le lien d’invitation, ou continuez dans Menta sans parrainage.',
  'shared.redirect.invite.continueWithout': 'Continuer sans parrainage',
  'shared.redirect.invite.accountReady': 'Compte déjà configuré',
  'shared.redirect.invite.accountDescription':
    'Les liens de parrainage s’appliquent lors de la création d’un nouveau compte Menta. Votre compte actuel reste inchangé.',
  'shared.redirect.invite.continue': 'Continuer vers Menta',
  'shared.redirect.invite.saved': 'Parrainage enregistré',
  'shared.redirect.invite.oneMoment': 'Un instant',
  'shared.redirect.invite.savedDescription':
    'Le parrainage est enregistré et restera visible pendant que vous vous connectez ou créez votre compte.',
  'shared.redirect.invite.checking':
    'Menta vérifie le parrainage avant d’ouvrir l’application.',
  'shared.redirect.join.challengeTitle': 'Invitation à la promesse enregistrée',
  'shared.redirect.join.challengeSubtitle':
    'Vérification du lien de la promesse et de votre connexion.',
  'shared.redirect.join.challengeNoticeTitle': 'Invitation enregistrée',
  'shared.redirect.join.challengeNoticeDescription':
    'L’écran suivant affichera le coût actuel pour rejoindre avant toute modification.',
  'shared.redirect.join.groupTitle': 'Ouverture de l’invitation au groupe',
  'shared.redirect.join.groupSubtitle':
    'Vérification de l’invitation au groupe et de votre connexion.',
  'shared.redirect.join.groupNoticeTitle': 'Invitation au groupe trouvée',
  'shared.redirect.join.groupNoticeDescription':
    'Vous pouvez voir le groupe avant de décider de le rejoindre.',
  'shared.redirect.join.missingTitle': 'Le lien d’invitation nécessite un code',
  'shared.redirect.join.missingSubtitle':
    "Ce lien d'invitation ne contient pas de code de groupe ou de promesse",
  'shared.redirect.join.missingNoticeTitle': 'Code d’invitation manquant',
  'shared.redirect.join.missingNoticeDescription':
    'Demandez un nouveau lien d’invitation ou saisissez un code de groupe manuellement.',
  'shared.redirect.join.openingTitle': 'Ouverture de l’invitation',
  'shared.redirect.join.openingSubtitle':
    'Vérification du lien d’invitation et de votre connexion.',
  'shared.redirect.join.oneMoment': 'Un instant',
  'shared.redirect.join.checking': 'Menta vérifie le code d’invitation.',
  'shared.redirect.join.codeLabel': 'Code d’invitation',
  'shared.redirect.join.enterCode': 'Saisir le code du groupe',
  'shared.redirect.join.continueWithout': 'Continuer sans invitation',
  'shared.rootError.title': 'Une erreur est survenue dans Menta',
  'shared.rootError.description':
    'Réessayez. Si le problème se reproduit, ouvrez le formulaire de signalement avec la référence de support ci-dessous.',
  'shared.rootError.supportReference': 'Référence de support',
  'shared.rootError.generatingReference':
    'Génération d’une référence technique.',
  'shared.rootError.reportIncluded':
    'Le formulaire de signalement contient cette référence. Relisez le signalement avant de l’envoyer.',
  'shared.rootError.noStateChangedDescription':
    'Réessayer ne marque aucune preuve ni aucun achat en attente comme terminé.',
  'shared.rootError.noStateChanged': 'Aucun changement',
  'shared.rootError.reportFormOpened': 'Formulaire de signalement ouvert',
  'shared.rootError.linkOutOfDate': 'Ce lien n’est plus à jour.',
  'shared.rootError.linkDidNotChange':
    'Ce lien n’a rien modifié. Revenez au support et rouvrez l’élément depuis un écran actuel.',
  'shared.rootError.linkedItemMoved':
    'Le groupe, la promesse, l’article de la boutique ou l’invitation liés ont peut-être été déplacés ou modifiés.',
  'shared.rootError.returnSupport': 'Retour au support',
  'shared.rootLayout.referralExisting.title':
    'Le parrainage est réservé aux nouveaux comptes',
  'shared.rootLayout.referralExisting.message':
    'Votre compte actuel reste inchangé.',
  'shared.rootLayout.noProofDue.title': 'Aucune preuve attendue pour le moment',
  'shared.rootLayout.noProofDue.message':
    'Aujourd’hui affichera la prochaine promesse quand une preuve sera nécessaire.',
  'shared.web.eyebrow': 'Application iPhone requise',
  'shared.web.title': 'Ouvrez ce lien dans Menta sur iPhone',
  'shared.web.explanation':
    'Menta ne peut pas terminer cette action dans un navigateur web. Ouvrez le lien d’origine sur un iPhone où Menta est installé.',
  'shared.web.nothingChanged': 'Aucune modification',
  'shared.web.waiting':
    'Votre invitation ou votre brouillon est toujours en attente.',
  'shared.web.continue': 'Continuer sur iPhone',
  'shared.web.openOriginal':
    'Ouvrez de nouveau le lien d’origine sur votre iPhone.',
  'shared.camera.proofLink': 'Lien de preuve',
  'shared.camera.openingProofCapture': 'Ouverture de la capture de preuve',
  'shared.camera.needsContext': 'Contexte manquant',
  'shared.camera.openingProofCaptureTitle':
    'Ouverture de la capture de preuve.',
  'shared.camera.incompleteLinkTitle': 'Le lien de preuve est incomplet.',
  'shared.camera.handoffDescription':
    'Nous transférons cet ancien lien de caméra vers le parcours de preuve actuel, en conservant la promesse, le type de preuve et la source.',
  'shared.camera.incompleteLinkDescription':
    'Cet ancien lien de caméra ne contient pas la promesse ou le type de preuve. Revenez à Aujourd’hui et ouvrez la preuve depuis la promesse en cours.',
  'shared.camera.handoffCardTitle': 'Transfert vers la capture de preuve',
  'shared.camera.recoveryPath': 'Solution de reprise',
  'shared.camera.noUpload': 'Aucun envoi',
  'shared.camera.preparingViewfinder': 'Préparation du viseur',
  'shared.camera.noProofAttached': 'Aucune preuve jointe',
  'shared.camera.nextScreenStates':
    'Les états caméra, bibliothèque et texte se trouvent sur l’écran suivant.',
  'shared.camera.noSubmissionFromRoute':
    'Rien n’est envoyé depuis ce lien de compatibilité.',
  'shared.camera.permissionFallback':
    'L’autorisation et le recours à la bibliothèque restent dans `/verification`.',
  'shared.camera.notSavedUntilAccepted':
    'La preuve n’est enregistrée qu’une fois acceptée ou mise en file d’attente.',
  'shared.camera.backToToday': 'Retour à Aujourd’hui',
  'shared.camera.openCapture': 'Ouvrir la capture de preuve',
  'shared.camera.goBack': 'Retour',
  'shared.camera.photoProof': 'Preuve photo',
  'shared.camera.textProof': 'Preuve écrite',
  'shared.camera.photoNoun': 'photo',
  'shared.camera.videoNoun': 'vidéo',
  'shared.camera.videoProof': 'Preuve vidéo',
  'shared.camera.capturedPhotoProof': 'Photo de preuve prise',
  'shared.camera.checkProof': 'Vérifiez votre preuve',
  'shared.camera.savedOnIPad': 'ENREGISTRÉE SUR CET IPAD',
  'shared.camera.savedOnPhone': 'ENREGISTRÉE SUR CE TÉLÉPHONE',
  'shared.camera.notSentYetIPad':
    'Rien n’a encore été envoyé. Votre preuve reste sur cet iPad jusqu’à ce que vous choisissiez de l’envoyer.',
  'shared.camera.notSentYetPhone':
    'Rien n’a encore été envoyé. Votre preuve reste sur votre téléphone jusqu’à ce que vous choisissiez de l’envoyer.',
  'shared.camera.retakeHintIPad':
    'Reprenez-la si l’action terminée n’est pas claire. Cette copie reste sur votre appareil jusqu’à ce que vous l’envoyiez.',
  'shared.camera.retakeHintPhone':
    'Reprenez-la si l’action terminée n’est pas claire. Cette copie reste sur votre téléphone jusqu’à ce que vous l’envoyiez.',
  'shared.camera.retakeProof': 'Reprendre la preuve',
  'shared.camera.holdToSend': 'Maintenez pour envoyer la preuve',
  'shared.camera.keepHolding': 'Continuez à maintenir pour envoyer…',
  'shared.camera.releaseToCancel': 'Relâchez ou glissez ailleurs pour annuler',
  'shared.camera.sendOneTap': 'Envoyer la preuve d’un seul toucher',
  'shared.camera.useCameraForProof': 'Utiliser la caméra pour la preuve',
  'shared.camera.cameraPrimerDescription':
    'Menta n’ouvre la caméra qu’après votre autorisation. Vous pouvez aussi choisir un(e) {proofType} enregistré(e).',
  'shared.camera.reviewCameraAccess': 'Vérifier l’accès à la caméra',
  'shared.camera.useTextProofInstead': 'Utiliser plutôt une preuve écrite',
  'shared.camera.cameraAccess': 'Caméra',
  'shared.camera.microphoneAccess': 'Micro',
  'shared.camera.cameraAndMicrophoneAccess': 'Caméra et micro',
  'shared.camera.allowMicrophoneAccess': 'Autoriser l’accès au microphone',
  'shared.camera.allowCameraAndMicrophoneAccess':
    'Autoriser l’accès à la caméra et au microphone',
  'shared.camera.allowCameraAccess': 'Autoriser l’accès à la caméra',
  'shared.camera.enablePermissionsInSettings':
    'Activez {permissions} dans les réglages, ou choisissez plutôt une preuve dans votre bibliothèque.',
  'shared.camera.permissionBody':
    'L’accès {permissions} permet à Menta de capturer une preuve {proofType} pour cette promesse. Vous pouvez aussi choisir une preuve {proofType} enregistrée dans votre bibliothèque.',
  'shared.camera.openingSettings': 'Ouverture des réglages…',
  'shared.camera.requestingAccess': 'Demande d’accès…',
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
    'Menta n’a pas pu ouvrir la demande d’autorisation. Passez par les réglages ou choisissez dans votre bibliothèque.',
  'shared.camera.chooseFromLibrary': 'Choisir dans la bibliothèque',
  'shared.camera.cancelProof': 'Annuler la preuve',
  'shared.camera.cameraNeedsReset': 'La caméra doit être réinitialisée',
  'shared.camera.retryProofCamera': 'Relancer la caméra de preuve',
  'shared.camera.leaveCapture': 'Quitter la capture',
  'shared.camera.capturePaused': 'La capture de preuve est en pause',
  'shared.camera.capturePausedDescription':
    'Ramenez Menta au premier plan pour reprendre la caméra.',
  'shared.camera.wakingCamera': 'Réveil de la caméra de preuve…',
  'shared.camera.switchCamera': 'Changer de caméra',
  'shared.camera.switchCameraHint':
    'Passe de la caméra avant à la caméra arrière.',
  'shared.camera.stopRecordingVideo': 'Arrêter l’enregistrement vidéo',
  'shared.camera.startRecordingVideo': 'Commencer l’enregistrement vidéo',
  'shared.camera.capturePhoto': 'Prendre la photo de preuve',
  'shared.camera.recordVideoHint':
    'Enregistre une courte vidéo qui montre votre action terminée.',
  'shared.camera.capturePhotoHint':
    'Prend une photo qui montre votre action terminée.',
  'shared.camera.cancelCapture': 'Annuler la capture de preuve',
  'shared.camera.cancelCaptureHint':
    'Ferme la caméra de preuve sans envoyer de preuve.',
  'shared.camera.ready': 'prête',
  'shared.camera.missing': 'manquante',
  'shared.camera.scannerClose': 'Fermer le scanner d’invitation',
  'shared.camera.scannerChecking': 'Vérification de l’accès à la caméra',
  'shared.camera.checkingTakesMoment':
    'Cela ne prend généralement qu’un instant',
  'shared.camera.scannerPreparing': 'Menta prépare le scanner d’invitation.',
  'shared.camera.scannerCloseShort': 'Fermer le scanner',
  'shared.camera.scannerAccessOff': 'Accès à la caméra désactivé',
  'shared.camera.scannerBlockedDescription':
    'L’accès à la caméra est désactivé pour Menta. Activez-le dans les réglages pour scanner les codes QR d’invitation, ou fermez ce scanner et saisissez le code manuellement.',
  'shared.camera.scannerPermissionDescription':
    'Autorisez l’accès à la caméra pour que Menta puisse lire le code QR et ouvrir le bon groupe ou la bonne promesse.',
  'shared.camera.scanInvite': 'Scanner une invitation',
  'shared.camera.scannerOpenSettings': 'Ouvrir les réglages',
  'shared.camera.scannerAllowCamera': 'Autoriser la caméra',
  'shared.camera.scannerReset': 'Le scanner doit être réinitialisé',
  'shared.camera.scannerRetry': 'Réessayer le scanner',
  'shared.camera.qrFrame': 'Cadre du scanner',
  'shared.camera.alignQr': 'Placez le code QR dans le cadre',
  'shared.camera.wakingScanner': 'Réveil du scanner d’invitation…',
  'shared.camera.preparingScanner': 'Préparation du scanner d’invitation…',
  'shared.camera.scannerPaused':
    'Le scanner est en pause. Revenez à cet écran pour continuer.',
  'shared.camera.settingsDidNotOpen':
    'Les réglages ne se sont pas ouverts. Ouvrez-les manuellement et autorisez l’accès à la caméra pour Menta.',
  'shared.camera.permissionDidNotOpen':
    'La demande d’autorisation de la caméra ne s’est pas ouverte. Réessayez ou saisissez le code manuellement.',
  'shared.camera.scannerTimeout':
    'Le scanner d’invitation met trop de temps à démarrer. Réessayez d’abord ici.',
  'shared.camera.scannerMountFailed':
    'Le scanner d’invitation ne s’est pas ouvert correctement. Réessayez d’abord ici.',
  'shared.camera.scannerInitialisationFailed':
    'Nous n’avons pas pu préparer le scanner d’invitation.',
  'shared.camera.reopenSavedProofFailed':
    'Menta n’a pas pu rouvrir la preuve enregistrée sur ce téléphone.',
  'shared.camera.proofCameraTimeout':
    'La caméra de preuve met trop de temps à démarrer. Réessayez ici ou choisissez une preuve dans votre bibliothèque.',
  'shared.camera.signInBeforeSending':
    'Reconnectez-vous avant d’envoyer une preuve.',
  'shared.camera.proofCouldNotOpen': 'Cette preuve n’a pas pu être ouverte',
  'shared.camera.proofPrepareFailed':
    'Menta n’a pas pu préparer cette preuve. Choisissez une autre capture et réessayez.',
  'shared.camera.videoFinishFailed':
    'Menta n’a pas pu terminer cette vidéo. Essayez avec un autre clip court.',
  'shared.camera.videoFileMissing': 'Menta n’a reçu aucun fichier vidéo.',
  'shared.camera.videoSaveFailed':
    'Menta n’a pas pu enregistrer cette vidéo. Essayez avec un autre clip court.',
  'shared.camera.photoFileMissing': 'Menta n’a reçu aucun fichier photo.',
  'shared.camera.photoCaptureFailed':
    'Menta n’a pas pu prendre cette photo. Réessayez quand la caméra sera prête.',
  'shared.camera.proofUploadFailed':
    'La preuve n’a pas été envoyée. Votre capture enregistrée est toujours sur ce téléphone.',
  'shared.camera.proofCameraMountFailed':
    'La caméra de preuve ne s’est pas ouverte correctement. Réessayez ici ou choisissez une preuve dans votre bibliothèque.',
  'shared.camera.openSettings': 'Ouvrir les réglages',
  'shared.legal.terms': 'Conditions d’utilisation',
  'shared.legal.termsDescription': 'Lisez les conditions actuelles.',
  'shared.legal.communityStandards': 'Règles de la communauté',
  'shared.legal.communityStandardsDescription':
    'Règles pour les promesses, les preuves et les groupes.',
  'shared.legal.privacy': 'Politique de confidentialité',
  'shared.legal.privacyDescription': 'Comment Menta traite vos informations.',
  'shared.legal.opensInBrowser': 'S’ouvre dans votre navigateur',
  'shared.legal.readDocument': 'Lire le document',
  'shared.legal.version': 'Version {version}',
  'shared.wizard.stepOf': 'Étape {current} sur {total}',
  'shared.fields.timePickerUnavailable':
    'Le sélecteur d’heure n’est pas disponible sur cette plateforme.',
  'shared.accessibility.toastCount': '{count}x',
  'shared.update.authorityUnknown': 'authority_unknown',
  'shared.rootLayout.initialising': 'Préparation de votre journée…',
  'shared.launch.tip.small':
    'Les petites promesses sont les plus faciles à tenir.',
  'shared.launch.tip.friend':
    'Partager un objectif avec un proche aide à l’atteindre.',
  'shared.launch.tip.miss': 'Un jour manqué ? Le suivant compte quand même.',
} as const satisfies Pick<EnglishCatalogue, FullSharedUiKey>;
