/** Shared customer-facing UI copy for Spain Spanish. */
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullSharedUiKey = Extract<keyof EnglishCatalogue, `shared.${string}`>;

export const fullSharedUiEsES = {
  'shared.navigation.settings': 'Ajustes',
  'shared.redirect.invite.navTitle': 'Invitar',
  'shared.redirect.join.navTitle': 'Unirse',
  'shared.accessibility.primaryNavigation': 'Navegación primaria',
  'shared.accessibility.tabSelected': '{label} está seleccionado.',
  'shared.accessibility.tabOpens': 'Abre {label}.',
  'shared.accessibility.choiceSummary': '{title}. {description}',
  'shared.accessibility.itemSummary': '{meta}. {title}. {subtitle}. {value}',
  'shared.accessibility.toastAnnouncement': '{title}. {message}',
  'shared.accessibility.toastRepeated': 'Este mensaje apareció {count} veces',
  'shared.accessibility.dismissNotification': 'Descartar notificación',
  'shared.accessibility.dismiss': 'Despedir',
  'shared.accessibility.dismissSheet': 'Descartar hoja',
  'shared.accessibility.scrollMore':
    '{hint}. Desliza hacia arriba para continuar leyendo.',
  'shared.accessibility.scrollHint': 'Desplázate para más',
  'shared.accessibility.loading': 'Cargando contenido',
  'shared.accessibility.mentaLoading': 'Menta se está cargando',
  'shared.accessibility.loadingRetry':
    'Cargando contenido. Toca para volver a intentarlo.',
  'shared.accessibility.loadingText': 'Cargando texto',
  'shared.accessibility.loadingImage': 'Cargando imagen',
  'shared.accessibility.doneEditing': 'Edición terminada',
  'shared.accessibility.hidePassword': 'Ocultar contraseña',
  'shared.accessibility.showPassword': 'Mostrar contraseña',
  'shared.accessibility.networkRetry': 'Reintentar conexión',
  'shared.accessibility.updateRequired': 'Se requiere actualización de Menta',
  'shared.accessibility.updateAvailable': 'Actualización de Menta disponible',
  'shared.accessibility.referralQr':
    'Código QR de invitación de referencia. Escanee para abrir el enlace de invitación.',
  'shared.accessibility.duplicateInviteQr':
    'Mostrar invitación QR en pantalla completa. Invitar a {code}',
  'shared.action.tryAgain': 'Intentar otra vez',
  'shared.action.reportIssue': 'Informar problema',
  'shared.action.backToday': 'Volver a hoy',
  'shared.action.contactSupport': 'Contactar con soporte',
  'shared.action.getHelp': 'obtener ayuda',
  'shared.action.close': 'Cerrar',
  'shared.action.cancel': 'Cancelar',
  'shared.action.confirm': 'Confirmar',
  'shared.action.done': 'Hecho',
  'shared.action.next': 'Próximo',
  'shared.action.working': 'Laboral...',
  'shared.action.checkAgain': 'comprobar de nuevo',
  'shared.action.keepCurrentScreen': 'Mantener pantalla actual',
  'shared.action.retryConnection': 'Reintentar conexión',
  'shared.action.workOffline': 'Trabajar sin conexión',
  'shared.action.retryUpload': 'Reintentar subir',
  'shared.action.saveProofForLater': 'Guardar prueba para más tarde',
  'shared.action.saveForLater': 'Guardar para más tarde',
  'shared.action.tryCameraAgain': 'Prueba la cámara nuevamente',
  'shared.action.openSettings': 'Abrir ajustes',
  'shared.action.signInNow': 'Iniciar sesión ahora',
  'shared.action.createAccount': 'Crear una cuenta',
  'shared.action.retrySubmission': 'Reintentar envío',
  'shared.action.fixDetails': 'Arreglar detalles',
  'shared.action.goToToday': 'Ir a hoy',
  'shared.action.goBack': 'Volver',
  'shared.error.network.title': 'Menta no puede conectarse en este momento.',
  'shared.error.network.message':
    'Tu trabajo está seguro. Vuelve a intentarlo o trabaje sin conexión cuando este flujo lo permita.',
  'shared.error.camera.title': 'Permiso de cámara en pausa',
  'shared.error.camera.message':
    'La captura de prueba necesita acceso a la cámara. Pruebe la cámara nuevamente, abra la ajustes o use otra ruta de prueba cuando esta ruta la ofrezca.',
  'shared.error.upload.title': 'La prueba no se subió',
  'shared.error.upload.message':
    'Tu prueba todavía está adjunta. Vuelve a intentar la carga o guárdela para más adelante cuando este flujo admita la recuperación sin conexión.',
  'shared.error.auth.title': 'Cuenta requerida',
  'shared.error.auth.message':
    'Las pruebas guardadas, los grupos, las reseñas y Momenta necesitan una cuenta Menta. Inicia sesión y regresa a la acción que estabas abriendo.',
  'shared.error.submission.title': 'No se pudo enviar la prueba',
  'shared.error.submission.message':
    'Tu prueba todavía está aquí. Vuelve a intentar el envío, guárdelo para más tarde o contacta con el soporte técnico si el ciclo de revisión está bloqueado.',
  'shared.error.validation.title': 'Comprueba los detalles',
  'shared.error.generic.title': 'Esta parte necesita un reintento.',
  'shared.error.generic.message':
    'Menta no pudo terminar esa acción. Los datos de tu cuenta están seguros; Vuelve a intentarlo, vuelve a Hoy o contacta con el soporte técnico si continúa sucediendo.',
  'shared.error.networkHandler.timeout.title': 'Menta está tardando demasiado',
  'shared.error.networkHandler.network.title':
    'Menta no puede conectarse en este momento.',
  'shared.error.networkHandler.timeout.message':
    'La solicitud no terminó. Vuelve a intentarlo antes de cambiar de pantalla para que se pueda cargar el último comprobante o el estado de la cuenta.',
  'shared.error.networkHandler.server.title':
    'Menta no pudo terminar esa petición.',
  'shared.error.networkHandler.server.withStatus':
    'El servidor devolvió {status}. Vuelve a intentarlo en un momento; Tu lugar en Menta sigue aquí.',
  'shared.error.networkHandler.server.withoutStatus':
    'Menta tuvo un problema con el servidor. Vuelve a intentarlo en un momento; tu lugar sigue aquí.',
  'shared.error.networkHandler.unknown.title':
    'Esta acción necesita otro intento.',
  'shared.error.networkHandler.unknown.message':
    'Menta mantuvo tu lugar. Vuelve a intentarlo cuando esté listo.',
  'shared.error.networkHandler.networkMessages':
    'Menta no puede conectarse en este momento. Tu trabajo está seguro; Vuelve a intentarlo cuando vuelve a estar en línea.',
  'shared.error.networkHandler.timeoutMessage':
    'Menta está tardando demasiado. Vuelve a intentarlo antes de cambiar de pantalla.',
  'shared.error.networkHandler.serverMessage':
    'Menta no pudo terminar esa petición. Tu lugar sigue aquí.',
  'shared.error.networkHandler.notFoundMessage':
    'Ese enlace Menta está obsoleto o ya no está disponible.',
  'shared.error.networkHandler.unauthorisedMessage':
    'Inicia sesión nuevamente para mantener tus pruebas y acciones grupales vinculadas a tu cuenta.',
  'shared.error.networkHandler.forbiddenMessage':
    'Esta cuenta no puede realizar ese cambio.',
  'shared.error.networkHandler.badRequestMessage':
    'Comprueba los detalles y vuelve a intentarlo.',
  'shared.error.networkHandler.unknownMessage':
    'Menta mantuvo tu lugar. Vuelve a intentarlo cuando esté listo.',
  'shared.error.debug': 'Depuración: {message}',
  'shared.boundary.critical.title': 'Menta se detuvo inesperadamente.',
  'shared.boundary.critical.message':
    'Tu cuenta y tu trabajo guardado todavía están aquí. Intentar otra vez. Si vuelve a suceder, envíe un informe.',
  'shared.boundary.screen.title': 'Esta pantalla dejó de cargarse.',
  'shared.boundary.screen.message':
    'Pruebe la pantalla nuevamente o vuelve a Hoy.',
  'shared.boundary.component.title': 'Esta sección no se pudo cargar.',
  'shared.boundary.component.message':
    'Intentar otra vez. Si continúa sucediendo enviar un informe con los detalles técnicos adjuntos.',
  'shared.boundary.errorDetail': 'Detalle del error',
  'shared.boundary.errorId': 'ID de error: {id}',
  'shared.boundary.crashDescription':
    'Un componente falló mientras usaba Menta.',
  'shared.boundary.expectedBehaviour':
    'La pantalla debería seguir funcionando o recuperarse sin perder contexto.',
  'shared.boundary.observedBehaviour':
    'La aplicación mostró un límite de error de componente.',
  'shared.boundary.boundaryLevel': 'Nivel de límite: {level}',
  'shared.boundary.message': 'Mensaje: {message}',
  'shared.confirm.unknown.heading':
    'Necesitamos comprobarlo antes de hacer cualquier otra cosa.',
  'shared.confirm.unknown.body':
    'La conexión terminó antes de que Menta recibiera un resultado confiable. Se bloquea otra solicitud de eliminación hasta que se comprueba el estado de la cuenta.',
  'shared.confirm.unknown.notice':
    'Menta no afirmará éxito o fracaso hasta que se confirme el estado de la cuenta.',
  'shared.confirm.failed.heading': 'Nada cambió en esta cuenta.',
  'shared.confirm.failed.body':
    'La solicitud de eliminación no se completó. Tu cuenta todavía está iniciada y no se confirmó ninguna eliminación.',
  'shared.confirm.failed.notice':
    'Puedes volver a intentarlo o ponerte en contacto con el servicio de asistencia técnica si esto continúa sucediendo.',
  'shared.confirm.typeToConfirm': 'Escriba "{name}" para confirmar.',
  'shared.confirm.typeToConfirmAccessibility': 'Escribe {name} para confirmar',
  'shared.confirm.deleting': 'Eliminando...',
  'shared.confirm.tapAgain': 'Toca de nuevo',
  'shared.confirm.tapAgainWithCost': 'Toca de nuevo {cost}',
  'shared.confirm.action': '{title}',
  'shared.confirm.actionWithCost': '{title} {cost}',
  'shared.confirm.balance': 'Saldo: {balance} {currency}',
  'shared.confirm.notEnough.title': 'No hay suficiente momento',
  'shared.confirm.notEnough.message':
    'Esta acción necesita más Momento. Abra la pantalla de propiedad para elegir una ruta de obtención o recarga.',
  'shared.oauth.continueGoogle': 'Continuar con Google',
  'shared.oauth.continueApple': 'Continuar con Apple',
  'shared.oauth.offline':
    'Estás desconectado. Vuelve a conectarte y vuelve a intentarlo.',
  'shared.oauth.providerUnavailable':
    'Iniciar sesión con {provider} no está disponible aquí. Usa el correo electrónico en tu lugar.',
  'shared.oauth.providerFailed':
    'No se pudo iniciar sesión con {provider}. Inténtalo de nuevo o utiliza el correo electrónico en tu lugar.',
  'shared.oauth.cancelled.title': 'Inicio de sesión cancelado',
  'shared.oauth.cancelled.message':
    'Aún no has iniciado sesión. Elige Apple, Google o correo electrónico para volver a intentarlo.',
  'shared.oauth.opening': 'Abriendo el inicio de sesión {provider}',
  'shared.oauth.pending':
    'Mantén Menta abierto. Cuando finalice el inicio de sesión, volverá a lo que estaba haciendo.',
  'shared.update.ready.accessibility': 'Actualización de Menta lista',
  'shared.update.ready.title': 'Actualización de Menta lista',
  'shared.update.ready.description':
    'Reinicie Menta para utilizar las últimas correcciones y mejoras.',
  'shared.update.ready.restart': 'Reiniciar Menta',
  'shared.update.ready.later': 'Más tarde',
  'shared.update.required.title': 'Actualiza Menta para continuar',
  'shared.update.required.description':
    'Esta versión mantiene sincronizado el comportamiento de cuenta, promesa, prueba y notificación.',
  'shared.update.optional.title': 'Menta 1.9.2 está listo',
  'shared.update.optional.description':
    'Esta actualización incluye las últimas mejoras en confiabilidad y iPad.',
  'shared.update.onDevice': 'En este dispositivo',
  'shared.update.minimumVersion': 'Versión mínima',
  'shared.update.availableVersion': 'Versión disponible',
  'shared.update.openStoreHint':
    'Abre la página de la tienda para la plataforma instalada.',
  'shared.update.update': 'Actualizar Menta',
  'shared.referral.title': 'Déjalos escanear para unirse',
  'shared.referral.description':
    'Pídeles que escaneen este código. Abre tu enlace de referencia.',
  'shared.referral.unavailable':
    'Código QR no disponible. Aún puedes probar las opciones para compartir o copiar a continuación.',
  'shared.referral.preparing': 'Preparando tu código QR…',
  'shared.image.notAvailable': 'Imagen no disponible',
  'shared.image.alt': 'Imagen',
  'shared.image.tapToLoad': 'Toca para cargar',
  'shared.image.loadFailed': 'Error al cargar la imagen',
  'shared.boosts.title': 'Impulsa',
  'shared.boosts.empty': 'Aún no hay refuerzos disponibles',
  'shared.streak.day': 'racha de dias',
  'shared.streak.accessibility': '{streak} racha de días',
  'shared.streak.compact': '{streak}d',
  'shared.timer.done': 'hecho por hoy',
  'shared.timer.unavailable': '—',
  'shared.timer.hoursLeft': '{hours}h {minutes}m faltan',
  'shared.timer.minutesLeft': 'Quedan {minutes}m',
  'shared.timeline.day': 'Día {day} de {total}',
  'shared.timeline.context': '{challenge} en {group}',
  'shared.timeline.week': 'Semana {current}/{total}',
  'shared.timeline.complete': '{percent}% Completo',
  'shared.timeline.remaining': '{days} días restantes',
  'shared.timeline.aligned': '✓ Alineado',
  'shared.timeline.misaligned': '⚠ Desalineado',
  'shared.timeline.incomplete': '? Incompleto',
  'shared.share.inviteBadge': 'menta',
  'shared.share.members': '{count} miembros',
  'shared.share.progress': '{completed}/{target}',
  'shared.share.referralProgress': 'Progreso de referencia',
  'shared.share.referralDescription':
    'Es más fácil confiar en el progreso compartido cuando las pruebas son visibles.',
  'shared.share.milestoneBadge': 'Hito',
  'shared.share.day': 'Día {day}',
  'shared.share.proofPosted': 'Prueba publicada',
  'shared.share.proofMeta': '{proof} prueba · {day}',
  'shared.share.proofMetaWithGroup': '{proof} prueba · {day} · {group}',
  'shared.share.proofReceipt': 'Recibo de prueba',
  'shared.share.groupStreak':
    '{members} miembros · {days} racha de grupos de días',
  'shared.share.groupLabel': 'grupo menta',
  'shared.notFound.title': 'Esta página no está disponible',
  'shared.notFound.description':
    'El enlace puede estar desactualizado o ya no existir. Nada en tu cuenta cambió.',
  'shared.systemSettings.title': 'Ajustes del teléfono',
  'shared.systemSettings.description':
    'Cambie los permisos de notificación, cámara, fotografía o medición de anuncios en la ajustes de tu teléfono. Menta no puede cambiarlos ni confirmarlos desde esta pantalla.',
  'shared.systemSettings.open': 'Abrir ajustes del teléfono',
  'shared.systemSettings.back': 'Volver al soporte',
  'shared.systemSettings.return.title': 'Regresa cuando hayas terminado',
  'shared.systemSettings.return.description':
    'Abrir la ajustes del teléfono no confirma que haya cambiado un permiso.',
  'shared.systemSettings.failed.title':
    'No se pudo abrir la ajustes del teléfono',
  'shared.systemSettings.failed.description':
    'Nada cambió en Menta. Abra la ajustes de tu teléfono manualmente y luego vuelve a la aplicación.',
  'shared.adTracking.title': 'Medición de anuncios',
  'shared.adTracking.optional': 'Opcional',
  'shared.adTracking.education.title': '¿Medir si los metaanuncios ayudaron?',
  'shared.adTracking.education.body':
    'Menta puede decirle a Meta cuando alguien que vio un anuncio luego se registra, crea un grupo, crea una promesa o invita a un amigo. Tu teléfono le pedirá permiso a continuación. Puedes rechazarlo y seguir usando Menta.',
  'shared.adTracking.continueHint':
    'Abre el mensaje de permiso de seguimiento de tu teléfono',
  'shared.adTracking.continue': 'Continuar hasta el mensaje del teléfono',
  'shared.adTracking.notNow': 'Ahora no',
  'shared.adTracking.granted.title': 'La medición de anuncios está activada',
  'shared.adTracking.granted.body':
    'Menta puede medir si los metaanuncios ayudaron a alguien a registrarse, crear un grupo, crear una promesa o invitar a un amigo. Cambie esto más tarde en la ajustes de tu teléfono.',
  'shared.adTracking.denied.title': 'La medición de anuncios está desactivada',
  'shared.adTracking.denied.body':
    'Menta todavía funciona. Si cambia de opinión, abra la ajustes de tu teléfono y permita el seguimiento de Menta.',
  'shared.adTracking.unavailable.title':
    'La medición de anuncios no está disponible',
  'shared.adTracking.unavailable.body':
    'Menta todavía funciona. Puedes intentar esto nuevamente más tarde desde Ajustes.',
  'shared.adTracking.promptFailed.title':
    'El mensaje del teléfono no se pudo abrir.',
  'shared.adTracking.promptFailed.description':
    'Puedes continuar sin medir anuncios y volver a intentarlo más tarde desde Ajustes.',
  'shared.redirect.invite.titleMissing':
    'El enlace de referencia necesita un código',
  'shared.redirect.invite.titleExisting':
    'La invitación es para cuentas nuevas.',
  'shared.redirect.invite.titleOpening': 'Referencia de apertura',
  'shared.redirect.invite.subtitleMissing':
    'Este enlace de referencia no incluía el código que Menta necesita.',
  'shared.redirect.invite.subtitleExisting':
    'Esta cuenta ya está configurada, por lo que Menta no cambiará tu referencia.',
  'shared.redirect.invite.subtitleOpening':
    'Guardaremos la referencia y lo llevaremos de regreso a Menta.',
  'shared.redirect.invite.missingTitle': 'Falta el código de referencia',
  'shared.redirect.invite.missingDescription':
    'Pídele a tu amigo que reenvíe el enlace de invitación o continúa en Menta sin una referencia.',
  'shared.redirect.invite.continueWithout': 'Continuar sin referencia',
  'shared.redirect.invite.accountReady': 'Cuenta ya configurada',
  'shared.redirect.invite.accountDescription':
    'Los enlaces de referencia se aplican al crear una nueva cuenta Menta. Tu cuenta actual permanece sin cambios.',
  'shared.redirect.invite.continue': 'Continuar a Menta',
  'shared.redirect.invite.saved': 'Referencia guardada',
  'shared.redirect.invite.oneMoment': 'Un momento',
  'shared.redirect.invite.savedDescription':
    'La referencia se guarda y permanecerá visible mientras inicia sesión o crea tu cuenta.',
  'shared.redirect.invite.checking':
    'Menta está comprobando la referencia antes de abrir la aplicación.',
  'shared.redirect.join.challengeTitle': 'Invitación de promesa guardada',
  'shared.redirect.join.challengeSubtitle':
    'Comprobando el enlace de promesa y tu estado de inicio de sesión.',
  'shared.redirect.join.challengeNoticeTitle': 'Invitación guardada',
  'shared.redirect.join.challengeNoticeDescription':
    'La siguiente pantalla mostrará el costo de inscripción actual antes de que algo cambie.',
  'shared.redirect.join.groupTitle': 'Invitación al grupo de apertura',
  'shared.redirect.join.groupSubtitle':
    'Verificar la invitación al grupo y tu inicio de sesión.',
  'shared.redirect.join.groupNoticeTitle': 'Invitación de grupo encontrada',
  'shared.redirect.join.groupNoticeDescription':
    'Puedes ver el grupo antes de decidir si te unes.',
  'shared.redirect.join.missingTitle':
    'El enlace de invitación necesita un código.',
  'shared.redirect.join.missingSubtitle':
    'Este enlace de invitación no incluía un código de grupo o de promesa.',
  'shared.redirect.join.missingNoticeTitle': 'Falta el código de invitación',
  'shared.redirect.join.missingNoticeDescription':
    'Solicite un nuevo enlace de invitación o introduce un código de grupo manualmente.',
  'shared.redirect.join.openingTitle': 'Invitación de apertura',
  'shared.redirect.join.openingSubtitle':
    'Comprobando el enlace de invitación y tu estado de inicio de sesión.',
  'shared.redirect.join.oneMoment': 'Un momento',
  'shared.redirect.join.checking':
    'Menta está comprobando el código de invitación.',
  'shared.redirect.join.codeLabel': 'código de invitación',
  'shared.redirect.join.enterCode': 'Introduce el código del grupo',
  'shared.redirect.join.continueWithout': 'Continuar sin invitación',
  'shared.rootError.title': 'Algo salió mal en Menta.',
  'shared.rootError.description':
    'Intentar otra vez. Si vuelve a suceder, abra el formulario de informe con la referencia de soporte a continuación.',
  'shared.rootError.supportReference': 'Referencia de soporte',
  'shared.rootError.generatingReference': 'Generando una referencia técnica.',
  'shared.rootError.reportIncluded':
    'El formulario de informe incluye esta referencia. Revise el informe antes de enviarlo.',
  'shared.rootError.noStateChangedDescription':
    'Al volver a intentarlo, no se marca ninguna prueba o compra pendiente como completa.',
  'shared.rootError.noStateChanged': 'Ningún estado cambió',
  'shared.rootError.reportFormOpened': 'Formulario de informe abierto',
  'shared.rootError.linkOutOfDate': 'Este enlace está desactualizado.',
  'shared.rootError.linkDidNotChange':
    'Este enlace no cambió nada. Vuelve al soporte y vuelve a abrir el elemento desde una pantalla actual.',
  'shared.rootError.linkedItemMoved':
    'Es posible que el grupo, la promesa, el artículo de la tienda o la invitación vinculados se hayan movido o cambiado.',
  'shared.rootError.returnSupport': 'Volver al soporte',
  'shared.rootLayout.referralExisting.title':
    'La invitación es para cuentas nuevas.',
  'shared.rootLayout.referralExisting.message':
    'Tu cuenta actual permanece sin cambios.',
  'shared.rootLayout.noProofDue.title':
    'No hay pruebas pendientes en este momento',
  'shared.rootLayout.noProofDue.message':
    'Hoy se mostrará la próxima promesa cuando se necesiten pruebas.',
  'shared.rootLayout.initialising': 'Inicializando Menta...',
  'shared.web.eyebrow': 'Se requiere aplicación para iPhone',
  'shared.web.title': 'Abra este enlace en Menta en iPhone',
  'shared.web.explanation':
    'Menta no puede completar esta acción en un navegador web. Abra el enlace original en un iPhone con Menta instalado.',
  'shared.web.nothingChanged': 'Nada cambió',
  'shared.web.waiting': 'Tu invitación o borrador aún está esperando.',
  'shared.web.continue': 'Continuar en iPhone',
  'shared.web.openOriginal': 'Abre el enlace original nuevamente en tu iPhone.',
  'shared.camera.proofLink': 'Enlace de prueba',
  'shared.camera.openingProofCapture': 'Captura de prueba de apertura',
  'shared.camera.needsContext': 'Necesita contexto',
  'shared.camera.openingProofCaptureTitle': 'Captura de prueba de apertura.',
  'shared.camera.incompleteLinkTitle': 'El enlace de prueba está incompleto.',
  'shared.camera.handoffDescription':
    'Estamos trasladando este antiguo enlace de cámara al flujo de prueba actual con la promesa, el tipo de prueba y la fuente intactos.',
  'shared.camera.incompleteLinkDescription':
    'A este antiguo enlace de cámara le falta el tipo de promesa o prueba. Vuelve a Hoy y abra la prueba de la promesa actual.',
  'shared.camera.handoffCardTitle': 'Transferencia de captura de prueba',
  'shared.camera.recoveryPath': 'Camino de recuperación',
  'shared.camera.noUpload': 'Sin carga',
  'shared.camera.preparingViewfinder': 'Preparando el visor',
  'shared.camera.noProofAttached': 'No se adjunta ninguna prueba',
  'shared.camera.nextScreenStates':
    'Los estados de la cámara, la biblioteca y el texto se muestran en la siguiente pantalla.',
  'shared.camera.noSubmissionFromRoute':
    'No se envía nada desde esta ruta de compatibilidad.',
  'shared.camera.permissionFallback':
    'El permiso y la reserva de la biblioteca permanecen en `/verification`.',
  'shared.camera.notSavedUntilAccepted':
    'La prueba no se guarda hasta que se acepta o se pone en cola.',
  'shared.camera.backToToday': 'Volver a hoy',
  'shared.camera.openCapture': 'Captura de prueba abierta',
  'shared.camera.goBack': 'Volver',
  'shared.camera.photoProof': 'Prueba fotográfica',
  'shared.camera.textProof': 'prueba de texto',
  'shared.camera.photoNoun': 'foto',
  'shared.camera.videoNoun': 'vídeo',
  'shared.camera.videoProof': 'Prueba de vídeo',
  'shared.camera.capturedPhotoProof': 'Prueba fotográfica capturada',
  'shared.camera.checkProof': 'Comprueba tu prueba',
  'shared.camera.savedOnIPad': 'GUARDADO EN ESTE IPAD',
  'shared.camera.savedOnPhone': 'GUARDADO EN ESTE TELÉFONO',
  'shared.camera.notSentYetIPad':
    'Aún no se ha enviado nada. Tu prueba permanece en este iPad hasta que decida enviarla.',
  'shared.camera.notSentYetPhone':
    'Aún no se ha enviado nada. Tu prueba permanece en tu teléfono hasta que decida enviarla.',
  'shared.camera.retakeHintIPad':
    'Vuelve a realizarlo si la acción completada no está clara. Esta copia permanece en tu dispositivo hasta que la envíe.',
  'shared.camera.retakeHintPhone':
    'Vuelve a realizarlo si la acción completada no está clara. Esta copia permanece en tu teléfono hasta que la envíe.',
  'shared.camera.retakeProof': 'Retomar prueba',
  'shared.camera.holdToSend': 'Espera para enviar prueba',
  'shared.camera.keepHolding': 'Sigue presionando para enviar...',
  'shared.camera.releaseToCancel': 'Suelte o deslícese para cancelar',
  'shared.camera.sendOneTap': 'Enviar prueba con un toque',
  'shared.camera.useCameraForProof': 'Usa la cámara como prueba',
  'shared.camera.cameraPrimerDescription':
    'Menta abre la cámara solo después de que usted permite el acceso. Puedes elegir un {proofType} guardado en tu lugar.',
  'shared.camera.reviewCameraAccess': 'Revisar el acceso a la cámara',
  'shared.camera.useTextProofInstead': 'Usa prueba de texto en tu lugar',
  'shared.camera.cameraAccess': 'Cámara',
  'shared.camera.microphoneAccess': 'Micrófono',
  'shared.camera.cameraAndMicrophoneAccess': 'Cámara y micrófono',
  'shared.camera.allowMicrophoneAccess': 'Permitir acceso al micrófono',
  'shared.camera.allowCameraAndMicrophoneAccess':
    'Permitir el acceso a la cámara y al micrófono',
  'shared.camera.allowCameraAccess': 'Permitir acceso a la cámara',
  'shared.camera.enablePermissionsInSettings':
    'Habilite {permissions} en Ajustes o elige pruebas de tu biblioteca.',
  'shared.camera.permissionBody':
    'El acceso {permissions} le permite a Menta capturar {proofType} pruebas de esta promesa. También puedes elegir un {proofType} guardado de tu biblioteca.',
  'shared.camera.openingSettings': 'Abriendo ajustes...',
  'shared.camera.requestingAccess': 'Solicitando acceso...',
  'shared.camera.allowPermissions': 'Permitir {permissions}',
  'shared.camera.cameraAccessOff': 'El acceso a la cámara está desactivado',
  'shared.camera.cameraAccessOffDescription':
    'Usa Ajustes para permitir el acceso a la cámara o, en tu lugar, elige pruebas de tu biblioteca.',
  'shared.camera.microphoneAccessOff':
    'El acceso al micrófono está desactivado',
  'shared.camera.microphoneAccessOffDescription':
    'Permita el acceso al micrófono para pruebas en vídeo o envíe pruebas con fotografías.',
  'shared.camera.permissionCheckFailed': 'Error en la verificación de permisos',
  'shared.camera.permissionCheckFailedDescription':
    'Menta no pudo abrir la solicitud de permiso. Pruebe Ajustes o elige de tu biblioteca.',
  'shared.camera.chooseFromLibrary': 'Elige de la biblioteca',
  'shared.camera.cancelProof': 'Cancelar prueba',
  'shared.camera.cameraNeedsReset': 'La cámara necesita un reinicio',
  'shared.camera.retryProofCamera': 'Reintentar cámara de prueba',
  'shared.camera.leaveCapture': 'dejar captura',
  'shared.camera.capturePaused': 'La captura de prueba está en pausa',
  'shared.camera.capturePausedDescription':
    'Vuelve a traer a Menta al primer plano para reanudar la cámara.',
  'shared.camera.wakingCamera': 'Activando la cámara de prueba...',
  'shared.camera.switchCamera': 'Cambiar cámara',
  'shared.camera.switchCameraHint':
    'Cambia entre las cámaras frontal y trasera.',
  'shared.camera.stopRecordingVideo': 'Dejar de grabar vídeo de prueba',
  'shared.camera.startRecordingVideo': 'Comience a grabar un vídeo de prueba',
  'shared.camera.capturePhoto': 'Foto a prueba de captura',
  'shared.camera.recordVideoHint':
    'Graba un vídeo corto que muestra la acción completada.',
  'shared.camera.capturePhotoHint':
    'Toma una foto que muestra la acción completada.',
  'shared.camera.cancelCapture': 'Cancelar captura de prueba',
  'shared.camera.cancelCaptureHint':
    'Cierra la cámara de pruebas sin enviar pruebas.',
  'shared.camera.ready': 'listo',
  'shared.camera.missing': 'desaparecido',
  'shared.camera.scannerClose': 'Cerrar el escáner de invitaciones',
  'shared.camera.scannerChecking': 'Comprobando el acceso a la cámara',
  'shared.camera.checkingTakesMoment':
    'Por lo general, esto lleva sólo un momento.',
  'shared.camera.scannerPreparing':
    'Menta está preparando el escáner de invitaciones.',
  'shared.camera.scannerCloseShort': 'Cerrar escáner',
  'shared.camera.scannerAccessOff': 'El acceso a la cámara está desactivado',
  'shared.camera.scannerBlockedDescription':
    'El acceso a la cámara está desactivado para Menta. Habilítelo en Ajustes para escanear códigos QR de invitación, o cierre este escáner e introduce el código manualmente.',
  'shared.camera.scannerPermissionDescription':
    'Permita el acceso a la cámara para que Menta pueda leer el código QR y abrir el grupo o promesa correcto.',
  'shared.camera.scanInvite': 'Escanear una invitación',
  'shared.camera.scannerOpenSettings': 'Abrir ajustes',
  'shared.camera.scannerAllowCamera': 'Permitir cámara',
  'shared.camera.scannerReset': 'El escáner necesita un reinicio',
  'shared.camera.scannerRetry': 'Reintentar el escáner',
  'shared.camera.qrFrame': 'Marco de escaneo QR',
  'shared.camera.alignQr': 'Alinear el código QR dentro del marco',
  'shared.camera.wakingScanner': 'Activando el escáner de invitaciones...',
  'shared.camera.preparingScanner': 'Preparando el escáner de invitaciones...',
  'shared.camera.scannerPaused':
    'El escáner está en pausa. Vuelve a esta pantalla para continuar.',
  'shared.camera.settingsDidNotOpen':
    'La ajustes no se abrió. Abra la ajustes del dispositivo manualmente y permita el acceso a la cámara para Menta.',
  'shared.camera.permissionDidNotOpen':
    'El permiso de la cámara no se abrió. Puedes volver a intentarlo o ingresar el código de invitación manualmente.',
  'shared.camera.scannerTimeout':
    'El escáner de invitaciones tarda demasiado en activarse. Vuelve a intentarlo aquí primero.',
  'shared.camera.scannerMountFailed':
    'El escáner de invitaciones no se abrió correctamente. Vuelve a intentarlo aquí primero.',
  'shared.camera.scannerInitialisationFailed':
    'No pudimos preparar el escáner de invitaciones.',
  'shared.camera.reopenSavedProofFailed':
    'Menta no pudo reabrir la prueba guardada en este teléfono.',
  'shared.camera.proofCameraTimeout':
    'La cámara de prueba tarda demasiado en activarse. Vuelve a intentarlo aquí o elige una prueba de tu biblioteca.',
  'shared.camera.signInBeforeSending':
    'Inicia sesión nuevamente antes de enviar el comprobante.',
  'shared.camera.proofCouldNotOpen': 'Esa prueba no se pudo abrir.',
  'shared.camera.proofPrepareFailed':
    'Menta no pudo preparar esa prueba. Elige otra captura y vuelve a intentarlo.',
  'shared.camera.videoFinishFailed':
    'Menta no pudo terminar ese vídeo. Pruebe con un clip corto más.',
  'shared.camera.videoFileMissing': 'Menta no recibió un archivo de vídeo.',
  'shared.camera.videoSaveFailed':
    'Menta no pudo guardar ese vídeo. Pruebe con un clip corto más.',
  'shared.camera.photoFileMissing':
    'Menta no recibió un archivo de fotografía.',
  'shared.camera.photoCaptureFailed':
    'Menta no pudo capturar esa foto. Inténtalo de nuevo cuando la cámara esté lista.',
  'shared.camera.proofUploadFailed':
    'La prueba no fue cargada. Tu captura guardada todavía está en este teléfono.',
  'shared.camera.proofCameraMountFailed':
    'La cámara de prueba no se abrió limpiamente. Vuelve a intentarlo aquí o elige una prueba de tu biblioteca.',
  'shared.camera.openSettings': 'Abrir ajustes',
  'shared.legal.terms': 'Condiciones de uso',
  'shared.legal.termsDescription': 'Lea los términos actuales.',
  'shared.legal.communityStandards': 'Estándares comunitarios',
  'shared.legal.communityStandardsDescription':
    'Reglas para promesas, pruebas y grupos.',
  'shared.legal.privacy': 'política de privacidad',
  'shared.legal.privacyDescription': 'Cómo Menta maneja tu información.',
  'shared.legal.opensInBrowser': 'Se abre en tu navegador',
  'shared.legal.readDocument': 'Leer documento',
  'shared.legal.version': 'Versión {version}',
  'shared.wizard.stepOf': 'Paso {current} de {total}',
  'shared.fields.timePickerUnavailable':
    'Selector de hora no disponible en esta plataforma.',
  'shared.accessibility.toastCount': '{count}x',
  'shared.update.authorityUnknown': 'autoridad_desconocida',
} as const satisfies Pick<EnglishCatalogue, FullSharedUiKey>;
