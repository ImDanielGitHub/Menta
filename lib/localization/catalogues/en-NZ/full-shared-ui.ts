/**
 * English copy owned by shared shells and reusable UI primitives.
 *
 * Callers still own labels passed into these primitives. This catalogue only
 * contains copy that a shared component creates itself.
 */
export const fullSharedUiEnNZ = {
  'shared.navigation.settings': 'Settings',
  'shared.redirect.invite.navTitle': 'Invite',
  'shared.redirect.join.navTitle': 'Join',
  'shared.accessibility.primaryNavigation': 'Primary navigation',
  'shared.accessibility.tabSelected': '{label} is selected.',
  'shared.accessibility.tabOpens': 'Opens {label}.',
  'shared.accessibility.choiceSummary': '{title}. {description}',
  'shared.accessibility.itemSummary': '{meta}. {title}. {subtitle}. {value}',
  'shared.accessibility.toastAnnouncement': '{title}. {message}',
  'shared.accessibility.toastRepeated': 'This message appeared {count} times',
  'shared.accessibility.dismissNotification': 'Dismiss notification',
  'shared.accessibility.dismiss': 'Dismiss',
  'shared.accessibility.dismissSheet': 'Dismiss sheet',
  'shared.accessibility.scrollMore': '{hint}. Swipe up to continue reading.',
  'shared.accessibility.scrollHint': 'Scroll for more',
  'shared.accessibility.loading': 'Loading content',
  'shared.accessibility.mentaLoading': 'Menta is loading',
  'shared.accessibility.loadingRetry': 'Loading content. Tap to retry.',
  'shared.accessibility.loadingText': 'Loading text',
  'shared.accessibility.loadingImage': 'Loading image',
  'shared.accessibility.doneEditing': 'Done editing',
  'shared.accessibility.hidePassword': 'Hide password',
  'shared.accessibility.showPassword': 'Show password',
  'shared.accessibility.networkRetry': 'Retry connection',
  'shared.accessibility.updateRequired': 'Menta update required',
  'shared.accessibility.updateAvailable': 'Menta update available',
  'shared.accessibility.referralQr':
    'Referral invite QR code. Scan to open the invite link.',
  'shared.accessibility.duplicateInviteQr':
    'Show invite QR full screen. Invite {code}',

  'shared.action.tryAgain': 'Try again',
  'shared.action.reportIssue': 'Report issue',
  'shared.action.backToday': 'Back to Today',
  'shared.action.contactSupport': 'Contact support',
  'shared.action.getHelp': 'Get help',
  'shared.action.close': 'Close',
  'shared.action.cancel': 'Cancel',
  'shared.action.confirm': 'Confirm',
  'shared.action.done': 'Done',
  'shared.action.next': 'Next',
  'shared.action.working': 'Working...',
  'shared.action.checkAgain': 'Check again',
  'shared.action.keepCurrentScreen': 'Keep current screen',
  'shared.action.retryConnection': 'Retry connection',
  'shared.action.workOffline': 'Work offline',
  'shared.action.retryUpload': 'Retry upload',
  'shared.action.saveProofForLater': 'Save proof for later',
  'shared.action.saveForLater': 'Save for later',
  'shared.action.tryCameraAgain': 'Try camera again',
  'shared.action.openSettings': 'Open Settings',
  'shared.action.signInNow': 'Sign in now',
  'shared.action.createAccount': 'Create account',
  'shared.action.retrySubmission': 'Retry submission',
  'shared.action.fixDetails': 'Fix details',
  'shared.action.goToToday': 'Go to Today',
  'shared.action.goBack': 'Go back',

  'shared.error.network.title': "Menta can't connect right now.",
  'shared.error.network.message':
    'Your work is safe. Retry, or work offline when this flow allows it.',
  'shared.error.camera.title': 'Camera permission paused',
  'shared.error.camera.message':
    'Proof capture needs camera access. Try the camera again, open settings, or use another proof path when this route offers one.',
  'shared.error.upload.title': 'Proof did not upload',
  'shared.error.upload.message':
    'Your proof is still attached. Retry the upload, or save it for later when this flow supports offline recovery.',
  'shared.error.auth.title': 'Account required',
  'shared.error.auth.message':
    'Saved proof, groups, reviews, and Momenta need a Menta account. Sign in and return to the action you were opening.',
  'shared.error.submission.title': 'Proof could not submit',
  'shared.error.submission.message':
    'Your proof is still here. Retry submission, save it for later, or contact support if the review loop is blocked.',
  'shared.error.validation.title': 'Check the details',
  'shared.error.generic.title': 'This part needs a retry',
  'shared.error.generic.message':
    'Menta could not finish that action. Your account data is safe; retry, return to Today, or contact support if it keeps happening.',
  'shared.error.networkHandler.timeout.title': 'Menta is taking too long',
  'shared.error.networkHandler.network.title': "Menta can't connect right now.",
  'shared.error.networkHandler.timeout.message':
    'The request did not finish. Retry before changing screens so the latest proof or account state can load.',
  'shared.error.networkHandler.server.title':
    'Menta could not finish that request',
  'shared.error.networkHandler.server.withStatus':
    'The server returned {status}. Retry in a moment; your place in Menta is still here.',
  'shared.error.networkHandler.server.withoutStatus':
    'Menta hit a server problem. Retry in a moment; your place is still here.',
  'shared.error.networkHandler.unknown.title': 'This action needs another try',
  'shared.error.networkHandler.unknown.message':
    'Menta kept your place. Retry when you are ready.',
  'shared.error.networkHandler.networkMessages':
    "Menta can't connect right now. Your work is safe; retry when you are back online.",
  'shared.error.networkHandler.timeoutMessage':
    'Menta is taking too long. Retry before changing screens.',
  'shared.error.networkHandler.serverMessage':
    'Menta could not finish that request. Your place is still here.',
  'shared.error.networkHandler.notFoundMessage':
    'That Menta link is stale or no longer available.',
  'shared.error.networkHandler.unauthorisedMessage':
    'Sign in again to keep your proof and group actions tied to your account.',
  'shared.error.networkHandler.forbiddenMessage':
    'This account cannot make that change.',
  'shared.error.networkHandler.badRequestMessage':
    'Check the details and try again.',
  'shared.error.networkHandler.unknownMessage':
    'Menta kept your place. Retry when you are ready.',
  'shared.error.debug': 'Debug: {message}',

  'shared.boundary.critical.title': 'Menta stopped unexpectedly.',
  'shared.boundary.critical.message':
    'Your account and saved work are still here. Try again. If it happens again, send a report.',
  'shared.boundary.screen.title': 'This screen stopped loading.',
  'shared.boundary.screen.message': 'Try the screen again, or return to Today.',
  'shared.boundary.component.title': 'This section could not load.',
  'shared.boundary.component.message':
    'Try again. If it keeps happening, send a report with the technical details attached.',
  'shared.boundary.errorDetail': 'Error detail',
  'shared.boundary.errorId': 'Error ID: {id}',
  'shared.boundary.crashDescription':
    'A component crashed while I was using Menta.',
  'shared.boundary.expectedBehaviour':
    'The screen should keep working or recover without losing context.',
  'shared.boundary.observedBehaviour':
    'The app showed a component error boundary.',
  'shared.boundary.boundaryLevel': 'Boundary level: {level}',
  'shared.boundary.message': 'Message: {message}',

  'shared.confirm.unknown.heading':
    'We need to check before doing anything else.',
  'shared.confirm.unknown.body':
    'The connection ended before Menta received a trustworthy result. Another delete request is blocked until the account state is checked.',
  'shared.confirm.unknown.notice':
    'Menta will not claim success or failure until the account state is confirmed.',
  'shared.confirm.failed.heading': 'Nothing changed on this account.',
  'shared.confirm.failed.body':
    'The delete request did not complete. Your account is still signed in and no removal was confirmed.',
  'shared.confirm.failed.notice':
    'You can try again, or contact support if this keeps happening.',
  'shared.confirm.typeToConfirm': 'Type "{name}" to confirm.',
  'shared.confirm.typeToConfirmAccessibility': 'Type {name} to confirm',
  'shared.confirm.deleting': 'Deleting...',
  'shared.confirm.tapAgain': 'Tap again',
  'shared.confirm.tapAgainWithCost': 'Tap again {cost}',
  'shared.confirm.action': '{title}',
  'shared.confirm.actionWithCost': '{title} {cost}',
  'shared.confirm.balance': 'Balance: {balance} {currency}',
  'shared.confirm.notEnough.title': 'Not enough Momenta',
  'shared.confirm.notEnough.message':
    'This action needs more Momenta. Open the owning screen to choose an earning or top-up path.',

  'shared.oauth.continueGoogle': 'Continue with Google',
  'shared.oauth.continueApple': 'Continue with Apple',
  'shared.oauth.offline': "You're offline. Reconnect and try again.",
  'shared.oauth.providerUnavailable':
    "Sign in with {provider} isn't available here. Use email instead.",
  'shared.oauth.providerFailed':
    "Couldn't sign in with {provider}. Try again or use email instead.",
  'shared.oauth.cancelled.title': 'Sign-in cancelled',
  'shared.oauth.cancelled.message':
    "You're still signed out. Choose Apple, Google, or email to try again.",
  'shared.oauth.opening': 'Opening {provider} sign-in',
  'shared.oauth.pending':
    "Keep Menta open. When sign-in finishes, you'll return to what you were doing.",

  'shared.update.ready.accessibility': 'Menta update ready',
  'shared.update.ready.title': 'Menta update ready',
  'shared.update.ready.description':
    'Restart Menta to use the latest fixes and improvements.',
  'shared.update.ready.restart': 'Restart Menta',
  'shared.update.ready.later': 'Later',
  'shared.update.required.title': 'Update Menta to continue',
  'shared.update.required.description':
    'This version keeps account, promise, proof and notification behaviour in sync.',
  'shared.update.optional.title': 'Menta 1.9.2 is ready',
  'shared.update.optional.description':
    'This update includes the latest reliability and iPad improvements.',
  'shared.update.onDevice': 'On this device',
  'shared.update.minimumVersion': 'Minimum version',
  'shared.update.availableVersion': 'Available version',
  'shared.update.openStoreHint':
    'Opens the store page for the installed platform',
  'shared.update.update': 'Update Menta',

  'shared.referral.title': 'Let them scan to join',
  'shared.referral.description':
    'Ask them to scan this code. It opens your referral link.',
  'shared.referral.unavailable':
    'QR code unavailable. You can still try the share or copy options below.',
  'shared.referral.preparing': 'Preparing your QR code…',

  'shared.image.notAvailable': 'Image not available',
  'shared.image.alt': 'Image',
  'shared.image.tapToLoad': 'Tap to load',
  'shared.image.loadFailed': 'Image load failed',
  'shared.boosts.title': 'Boosts',
  'shared.boosts.empty': 'No boosts available yet',
  'shared.streak.day': 'Day streak',
  'shared.streak.accessibility': '{streak} day streak',
  'shared.streak.compact': '{streak}d',
  'shared.timer.done': 'Done for today',
  'shared.timer.unavailable': '—',
  'shared.timer.hoursLeft': '{hours}h {minutes}m left',
  'shared.timer.minutesLeft': '{minutes}m left',
  'shared.timeline.day': 'Day {day} of {total}',
  'shared.timeline.context': '{challenge} in {group}',
  'shared.timeline.week': 'Week {current}/{total}',
  'shared.timeline.complete': '{percent}% Complete',
  'shared.timeline.remaining': '{days} days remaining',
  'shared.timeline.aligned': '✓ Aligned',
  'shared.timeline.misaligned': '⚠ Misaligned',
  'shared.timeline.incomplete': '? Incomplete',
  'shared.share.inviteBadge': 'Menta',
  'shared.share.members': '{count} members',
  'shared.share.progress': '{completed}/{target}',
  'shared.share.referralProgress': 'Referral progress',
  'shared.share.referralDescription':
    'Shared progress is easier to trust when proof is visible.',
  'shared.share.milestoneBadge': 'Milestone',
  'shared.share.day': 'Day {day}',
  'shared.share.proofPosted': 'Proof posted',
  'shared.share.proofMeta': '{proof} proof · {day}',
  'shared.share.proofMetaWithGroup': '{proof} proof · {day} · {group}',
  'shared.share.proofReceipt': 'Proof receipt',
  'shared.share.groupStreak': '{members} members · {days} day group streak',
  'shared.share.groupLabel': 'Menta group',

  'shared.notFound.title': 'This page isn’t available',
  'shared.notFound.description':
    'The link may be out of date or no longer exist. Nothing in your account changed.',
  'shared.systemSettings.title': 'Phone settings',
  'shared.systemSettings.description':
    'Change notification, camera, photo, or ad measurement permissions in your phone settings. Menta cannot change or confirm them from this screen.',
  'shared.systemSettings.open': 'Open phone settings',
  'shared.systemSettings.back': 'Back to support',
  'shared.systemSettings.return.title': 'Return when you’re done',
  'shared.systemSettings.return.description':
    'Opening phone settings does not confirm that a permission changed.',
  'shared.systemSettings.failed.title': 'Phone settings could not open',
  'shared.systemSettings.failed.description':
    'Nothing changed in Menta. Open your phone settings manually, then return to the app.',

  'shared.adTracking.title': 'Ad measurement',
  'shared.adTracking.optional': 'Optional',
  'shared.adTracking.education.title': 'Measure whether Meta ads helped?',
  'shared.adTracking.education.body':
    'Menta can tell Meta when someone who saw an ad later signs up, creates a group, creates a promise, or invites a friend. Your phone will ask for permission next. You can decline and still use Menta.',
  'shared.adTracking.continueHint':
    "Opens your phone's tracking permission prompt",
  'shared.adTracking.continue': 'Continue to the phone prompt',
  'shared.adTracking.notNow': 'Not now',
  'shared.adTracking.granted.title': 'Ad measurement is on',
  'shared.adTracking.granted.body':
    'Menta can measure whether Meta ads helped someone sign up, create a group, create a promise, or invite a friend. Change this later in your phone settings.',
  'shared.adTracking.denied.title': 'Ad measurement is off',
  'shared.adTracking.denied.body':
    'Menta still works. If you change your mind, open your phone settings and allow tracking for Menta.',
  'shared.adTracking.unavailable.title': 'Ad measurement is not available',
  'shared.adTracking.unavailable.body':
    'Menta still works. You can try this again later from Settings.',
  'shared.adTracking.promptFailed.title': 'The phone prompt could not open',
  'shared.adTracking.promptFailed.description':
    'You can continue without ad measurement and try again later from Settings.',

  'shared.redirect.invite.titleMissing': 'Referral link needs a code',
  'shared.redirect.invite.titleExisting': 'Referral is for new accounts',
  'shared.redirect.invite.titleOpening': 'Opening referral',
  'shared.redirect.invite.subtitleMissing':
    'This referral link did not include the code Menta needs.',
  'shared.redirect.invite.subtitleExisting':
    'This account is already set up, so Menta will not change its referral.',
  'shared.redirect.invite.subtitleOpening':
    'We are saving the referral and taking you back to Menta.',
  'shared.redirect.invite.missingTitle': 'Missing referral code',
  'shared.redirect.invite.missingDescription':
    'Ask your friend to resend the invite link, or continue into Menta without a referral.',
  'shared.redirect.invite.continueWithout': 'Continue without referral',
  'shared.redirect.invite.accountReady': 'Account already set up',
  'shared.redirect.invite.accountDescription':
    'Referral links apply while creating a new Menta account. Your current account stays unchanged.',
  'shared.redirect.invite.continue': 'Continue to Menta',
  'shared.redirect.invite.saved': 'Referral saved',
  'shared.redirect.invite.oneMoment': 'One moment',
  'shared.redirect.invite.savedDescription':
    'The referral is saved and will stay visible while you sign in or create your account.',
  'shared.redirect.invite.checking':
    'Menta is checking the referral before opening the app.',

  'shared.redirect.join.challengeTitle': 'Promise invite saved',
  'shared.redirect.join.challengeSubtitle':
    'Checking the promise link and your sign-in state.',
  'shared.redirect.join.challengeNoticeTitle': 'Invite saved',
  'shared.redirect.join.challengeNoticeDescription':
    'The next screen will show the current join cost before anything changes.',
  'shared.redirect.join.groupTitle': 'Opening group invite',
  'shared.redirect.join.groupSubtitle':
    'Checking the group invite and your sign-in.',
  'shared.redirect.join.groupNoticeTitle': 'Group invite found',
  'shared.redirect.join.groupNoticeDescription':
    'You can see the group before you decide whether to join.',
  'shared.redirect.join.missingTitle': 'Invite link needs a code',
  'shared.redirect.join.missingSubtitle':
    'This invite link did not include a group or promise code.',
  'shared.redirect.join.missingNoticeTitle': 'Missing invite code',
  'shared.redirect.join.missingNoticeDescription':
    'Ask for a new invite link, or enter a group code manually.',
  'shared.redirect.join.openingTitle': 'Opening invite',
  'shared.redirect.join.openingSubtitle':
    'Checking the invite link and your sign-in state.',
  'shared.redirect.join.oneMoment': 'One moment',
  'shared.redirect.join.checking': 'Menta is checking the invite code.',
  'shared.redirect.join.codeLabel': 'Invite code',
  'shared.redirect.join.enterCode': 'Enter group code',
  'shared.redirect.join.continueWithout': 'Continue without invite',

  'shared.rootError.title': 'Something went wrong in Menta.',
  'shared.rootError.description':
    'Try again. If it happens again, open the report form with the support reference below.',
  'shared.rootError.supportReference': 'Support reference',
  'shared.rootError.generatingReference': 'Generating a technical reference.',
  'shared.rootError.reportIncluded':
    'The report form includes this reference. Review the report before sending it.',
  'shared.rootError.noStateChangedDescription':
    'Trying again does not mark any pending proof or purchase as complete.',
  'shared.rootError.noStateChanged': 'No state changed',
  'shared.rootError.reportFormOpened': 'Report form opened',
  'shared.rootError.linkOutOfDate': 'This link is out of date.',
  'shared.rootError.linkDidNotChange':
    'This link did not change anything. Return to support and reopen the item from a current screen.',
  'shared.rootError.linkedItemMoved':
    'The linked group, promise, shop item, or invite may have moved or changed.',
  'shared.rootError.returnSupport': 'Return to support',
  'shared.rootLayout.referralExisting.title': 'Referral is for new accounts',
  'shared.rootLayout.referralExisting.message':
    'Your current account stays unchanged.',
  'shared.rootLayout.noProofDue.title': 'No proof due right now',
  'shared.rootLayout.noProofDue.message':
    'Today will show the next promise when proof is needed.',
  'shared.rootLayout.initialising': 'Initializing Menta...',
  'shared.web.eyebrow': 'iPhone app required',
  'shared.web.title': 'Open this link in Menta on iPhone',
  'shared.web.explanation':
    'Menta cannot complete this action in a web browser. Open the original link on an iPhone with Menta installed.',
  'shared.web.nothingChanged': 'Nothing changed',
  'shared.web.waiting': 'Your invite or draft is still waiting.',
  'shared.web.continue': 'Continue on iPhone',
  'shared.web.openOriginal': 'Open the original link again on your iPhone.',

  'shared.camera.proofLink': 'Proof link',
  'shared.camera.openingProofCapture': 'Opening proof capture',
  'shared.camera.needsContext': 'Needs context',
  'shared.camera.openingProofCaptureTitle': 'Opening proof capture.',
  'shared.camera.incompleteLinkTitle': 'Proof link is incomplete.',
  'shared.camera.handoffDescription':
    'We are moving this old camera link into the current proof flow with the promise, proof type, and source intact.',
  'shared.camera.incompleteLinkDescription':
    'This old camera link is missing the promise or proof type. Head back to Today and open the proof from the current promise.',
  'shared.camera.handoffCardTitle': 'Proof capture handoff',
  'shared.camera.recoveryPath': 'Recovery path',
  'shared.camera.noUpload': 'No upload',
  'shared.camera.preparingViewfinder': 'Preparing viewfinder',
  'shared.camera.noProofAttached': 'No proof attached',
  'shared.camera.nextScreenStates':
    'Camera, library, and text states live on the next screen.',
  'shared.camera.noSubmissionFromRoute':
    'Nothing is submitted from this compatibility route.',
  'shared.camera.permissionFallback':
    'Permission and library fallback stay in `/verification`.',
  'shared.camera.notSavedUntilAccepted':
    'Proof is not saved until accepted or queued.',
  'shared.camera.backToToday': 'Back to Today',
  'shared.camera.openCapture': 'Open proof capture',
  'shared.camera.goBack': 'Go back',
  'shared.camera.photoProof': 'Photo proof',
  'shared.camera.textProof': 'Text proof',
  'shared.camera.photoNoun': 'photo',
  'shared.camera.videoNoun': 'video',
  'shared.camera.videoProof': 'Video proof',
  'shared.camera.capturedPhotoProof': 'Captured photo proof',
  'shared.camera.checkProof': 'Check your proof',
  'shared.camera.savedOnIPad': 'SAVED ON THIS IPAD',
  'shared.camera.savedOnPhone': 'SAVED ON THIS PHONE',
  'shared.camera.notSentYetIPad':
    'Nothing has been sent yet. Your proof stays on this iPad until you choose to send it.',
  'shared.camera.notSentYetPhone':
    'Nothing has been sent yet. Your proof stays on your phone until you choose to send it.',
  'shared.camera.retakeHintIPad':
    'Retake it if the completed action is unclear. This copy stays on your device until you send it.',
  'shared.camera.retakeHintPhone':
    'Retake it if the completed action is unclear. This copy stays on your phone until you send it.',
  'shared.camera.retakeProof': 'Retake proof',
  'shared.camera.holdToSend': 'Hold to send proof',
  'shared.camera.keepHolding': 'Keep holding to send…',
  'shared.camera.releaseToCancel': 'Release or slide away to cancel',
  'shared.camera.sendOneTap': 'Send proof with one tap',
  'shared.camera.useCameraForProof': 'Use the camera for proof',
  'shared.camera.cameraPrimerDescription':
    'Menta opens the camera only after you allow access. You can choose a saved {proofType} instead.',
  'shared.camera.reviewCameraAccess': 'Review camera access',
  'shared.camera.useTextProofInstead': 'Use text proof instead',
  'shared.camera.cameraAccess': 'Camera',
  'shared.camera.microphoneAccess': 'Microphone',
  'shared.camera.cameraAndMicrophoneAccess': 'Camera and Microphone',
  'shared.camera.allowMicrophoneAccess': 'Allow microphone access',
  'shared.camera.allowCameraAndMicrophoneAccess':
    'Allow camera and microphone access',
  'shared.camera.allowCameraAccess': 'Allow camera access',
  'shared.camera.enablePermissionsInSettings':
    'Enable {permissions} in Settings, or choose proof from your library instead.',
  'shared.camera.permissionBody':
    '{permissions} access lets Menta capture {proofType} proof for this promise. You can also choose a saved {proofType} from your library.',
  'shared.camera.openingSettings': 'Opening Settings...',
  'shared.camera.requestingAccess': 'Requesting access...',
  'shared.camera.allowPermissions': 'Allow {permissions}',
  'shared.camera.cameraAccessOff': 'Camera access is off',
  'shared.camera.cameraAccessOffDescription':
    'Use Settings to allow camera access, or choose proof from your library instead.',
  'shared.camera.microphoneAccessOff': 'Microphone access is off',
  'shared.camera.microphoneAccessOffDescription':
    'Allow microphone access for video proof, or submit photo proof instead.',
  'shared.camera.permissionCheckFailed': 'Permission check failed',
  'shared.camera.permissionCheckFailedDescription':
    'Menta could not open the permission prompt. Try Settings or choose from your library.',
  'shared.camera.chooseFromLibrary': 'Choose from library',
  'shared.camera.cancelProof': 'Cancel proof',
  'shared.camera.cameraNeedsReset': 'Camera needs a reset',
  'shared.camera.retryProofCamera': 'Retry proof camera',
  'shared.camera.leaveCapture': 'Leave capture',
  'shared.camera.capturePaused': 'Proof capture is paused',
  'shared.camera.capturePausedDescription':
    'Bring Menta back to the foreground to resume the camera.',
  'shared.camera.wakingCamera': 'Waking the proof camera…',
  'shared.camera.switchCamera': 'Switch camera',
  'shared.camera.switchCameraHint':
    'Switches between the front and back cameras.',
  'shared.camera.stopRecordingVideo': 'Stop recording proof video',
  'shared.camera.startRecordingVideo': 'Start recording proof video',
  'shared.camera.capturePhoto': 'Capture proof photo',
  'shared.camera.recordVideoHint':
    'Records a short video that shows your completed action.',
  'shared.camera.capturePhotoHint':
    'Takes a photo that shows your completed action.',
  'shared.camera.cancelCapture': 'Cancel proof capture',
  'shared.camera.cancelCaptureHint':
    'Closes the proof camera without sending proof.',
  'shared.camera.ready': 'ready',
  'shared.camera.missing': 'missing',
  'shared.camera.scannerClose': 'Close invite scanner',
  'shared.camera.scannerChecking': 'Checking camera access',
  'shared.camera.checkingTakesMoment': 'This usually takes only a moment.',
  'shared.camera.scannerPreparing':
    'Menta is getting the invite scanner ready.',
  'shared.camera.scannerCloseShort': 'Close scanner',
  'shared.camera.scannerAccessOff': 'Camera access is off',
  'shared.camera.scannerBlockedDescription':
    'Camera access is off for Menta. Enable it in Settings to scan invite QR codes, or close this scanner and enter the code manually.',
  'shared.camera.scannerPermissionDescription':
    'Allow camera access so Menta can read the QR code and open the right group or promise.',
  'shared.camera.scanInvite': 'Scan an invite',
  'shared.camera.scannerOpenSettings': 'Open Settings',
  'shared.camera.scannerAllowCamera': 'Allow camera',
  'shared.camera.scannerReset': 'Scanner needs a reset',
  'shared.camera.scannerRetry': 'Retry scanner',
  'shared.camera.qrFrame': 'QR scan frame',
  'shared.camera.alignQr': 'Align QR code within the frame',
  'shared.camera.wakingScanner': 'Waking the invite scanner...',
  'shared.camera.preparingScanner': 'Preparing invite scanner...',
  'shared.camera.scannerPaused':
    'Scanner is paused. Return to this screen to resume.',
  'shared.camera.settingsDidNotOpen':
    'Settings did not open. Open device settings manually and allow camera access for Menta.',
  'shared.camera.permissionDidNotOpen':
    'Camera permission did not open. You can retry, or enter the invite code manually.',
  'shared.camera.scannerTimeout':
    'The invite scanner is taking too long to wake up. Retry here first.',
  'shared.camera.scannerMountFailed':
    'The invite scanner did not open cleanly. Retry here first.',
  'shared.camera.scannerInitialisationFailed':
    'We could not prepare the invite scanner.',
  'shared.camera.reopenSavedProofFailed':
    'Menta could not reopen the saved proof on this phone.',
  'shared.camera.proofCameraTimeout':
    'The proof camera is taking too long to wake up. Retry here or choose proof from your library.',
  'shared.camera.signInBeforeSending': 'Sign in again before sending proof.',
  'shared.camera.proofCouldNotOpen': 'That proof could not be opened',
  'shared.camera.proofPrepareFailed':
    'Menta could not prepare that proof. Choose another capture and try again.',
  'shared.camera.videoFinishFailed':
    'Menta could not finish that video. Try one more short clip.',
  'shared.camera.videoFileMissing': 'Menta did not receive a video file.',
  'shared.camera.videoSaveFailed':
    'Menta could not save that video. Try one more short clip.',
  'shared.camera.photoFileMissing': 'Menta did not receive a photo file.',
  'shared.camera.photoCaptureFailed':
    'Menta could not capture that photo. Try again when the camera is ready.',
  'shared.camera.proofUploadFailed':
    'Proof was not uploaded. Your saved capture is still on this phone.',
  'shared.camera.proofCameraMountFailed':
    'The proof camera did not open cleanly. Retry here or choose proof from your library.',
  'shared.camera.openSettings': 'Open Settings',
  'shared.legal.terms': 'Terms of Use',
  'shared.legal.termsDescription': 'Read the current terms.',
  'shared.legal.communityStandards': 'Community Standards',
  'shared.legal.communityStandardsDescription':
    'Rules for promises, proof and groups.',
  'shared.legal.privacy': 'Privacy Policy',
  'shared.legal.privacyDescription': 'How Menta handles your information.',
  'shared.legal.opensInBrowser': 'Opens in your browser',
  'shared.legal.readDocument': 'Read document',
  'shared.legal.version': 'Version {version}',
  'shared.wizard.stepOf': 'Step {current} of {total}',
  'shared.fields.timePickerUnavailable':
    'Time picker unavailable on this platform.',
  'shared.accessibility.toastCount': '{count}x',
  'shared.update.authorityUnknown': 'authority_unknown',
} as const;

export type FullSharedUiKey = keyof typeof fullSharedUiEnNZ;
