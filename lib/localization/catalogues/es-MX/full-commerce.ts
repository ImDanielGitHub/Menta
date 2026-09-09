/** Customer-facing copy for the Momenta wallet, shop, inventory, and Pro flows. */
import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullCommerceKey = Extract<keyof EnglishCatalogue, `commerce.${string}`>;

export const fullCommerceEsMX = {
  'commerce.proJourney.back': 'Atrás',
  'commerce.proJourney.title': 'Menta Pro',
  'commerce.proJourney.subtitle':
    'Más espacio para las promesas que quieres cumplir.',
  'commerce.proJourney.capacity': 'Más promesas y grupos activos',
  'commerce.proJourney.capacityDetail':
    'Supera los límites activos del plan gratuito.',
  'commerce.proJourney.momenta': 'Momenta con tu suscripción',
  'commerce.proJourney.momentaDetail':
    'Usa los Momenta de tu plan para más promesas, grupos y artículos.',
  'commerce.proJourney.ads': 'Sin pausas publicitarias obligatorias',
  'commerce.proJourney.adsDetail': 'Concéntrate en tus promesas.',
  'commerce.proJourney.choose': 'Elige tu plan Pro.',
  'commerce.proJourney.sameFeatures':
    'Semanal o anual. Ambos planes incluyen todas las funciones Pro.',
  'commerce.proJourney.loading': 'Cargando planes de la tienda',
  'commerce.proJourney.unavailable': 'Los planes no están disponibles ahora',
  'commerce.proJourney.retryDetail':
    'Comprueba tu conexión e inténtalo de nuevo. Puedes seguir usando Menta gratis.',
  'commerce.proJourney.retry': 'Reintentar',
  'commerce.proJourney.annual': 'Pro anual',
  'commerce.proJourney.weekly': 'Pro semanal',
  'commerce.proJourney.intro': 'Empieza con una semana',
  'commerce.proJourney.perYear': 'al año',
  'commerce.proJourney.perWeek': 'a la semana',
  'commerce.proJourney.firstWeek': 'por tu primera semana',
  'commerce.proJourney.annualTerms':
    'Se cobran {price} cada año. Se renueva automáticamente.',
  'commerce.proJourney.weeklyTerms':
    'Se cobran {price} cada semana. Se renueva automáticamente.',
  'commerce.proJourney.introTerms':
    '{intro} por la primera semana, luego {price} por semana. Se renueva automáticamente.',
  'commerce.proJourney.annualCredits':
    '{amount} Momenta al confirmarse tu pago anual. Crear, unirse y los artículos siguen costando Momenta.',
  'commerce.proJourney.weeklyCredits':
    '{amount} Momenta con cada pago semanal confirmado, incluida la semana de introducción. Crear, unirse y los artículos siguen costando Momenta.',
  'commerce.proJourney.introTitle': 'Tu primera semana con Pro.',
  'commerce.proJourney.confirmTitle': 'Tu plan Pro.',
  'commerce.proJourney.allIncluded':
    'Todas las funciones Pro están incluidas. Revisa el precio y la renovación antes de suscribirte.',
  'commerce.proJourney.today': 'Pagas hoy',
  'commerce.proJourney.yearAccess': 'Un año de acceso Pro',
  'commerce.proJourney.weekAccess': 'Una semana de acceso Pro',
  'commerce.proJourney.renewal': 'Qué ocurre después',
  'commerce.proJourney.cancel':
    'Cancela en los ajustes de suscripciones de tu tienda antes de la próxima renovación. El acceso continúa hasta que termine el periodo pagado.',
  'commerce.proJourney.seePlans': 'Ver planes Pro',
  'commerce.proJourney.seeOffer': 'Revisar mi oferta',
  'commerce.proJourney.subscribe': 'Suscribirme a Pro',
  'commerce.proJourney.stayFree': 'Seguir usando Menta gratis',
  'commerce.proJourney.restore': 'Restaurar compras',
  'commerce.powerUp.freezeLabel': 'Congelación de racha',
  'commerce.powerUp.freezeDescription':
    'Cubre automáticamente el próximo día perdido elegible.',
  'commerce.powerUp.freezeSummary':
    'Menta usa uno automáticamente después de un día perdido elegible.',
  'commerce.powerUp.extensionLabel': 'Extensión de 12 horas',
  'commerce.powerUp.extensionDescription':
    'Agrega 12 horas a la fecha límite de una promesa activa.',
  'commerce.powerUp.extensionSummary':
    'Elige una promesa activa. Una extensión se utiliza inmediatamente.',
  'commerce.powerUp.extensionSuccess':
    'A la promesa seleccionada se le añadieron 12 horas.',
  'commerce.nav.wallet': 'Billetera',
  'commerce.nav.shop': 'Tienda',
  'commerce.nav.items': 'Artículos',
  'commerce.nav.sections': 'Secciones de Momenta',
  'commerce.accessibility.goBack': 'Volver',
  'commerce.accessibility.loadingWallet': 'Cargando saldo de la billetera',
  'commerce.accessibility.loadingActivity':
    'Comprobando la actividad de la billetera',
  'commerce.accessibility.checkActivity':
    'Comprueba la actividad de la billetera nuevamente',
  'commerce.accessibility.loadingItem':
    'Cargando el artículo actual de la tienda',
  'commerce.accessibility.loadingPromises': 'Cargando tus promesas',
  'commerce.accessibility.checking': 'Comprobando…',
  'commerce.action.tryAgain': 'Intentar otra vez',
  'commerce.action.checkAgain': 'comprobar de nuevo',
  'commerce.action.refreshItems': 'Actualizar artículos',
  'commerce.action.refreshInventory': 'Actualizar inventario',
  'commerce.action.openShop': 'tienda abierta',
  'commerce.action.openItems': 'Abre tus artículos',
  'commerce.action.backToShop': 'volver a la tienda',
  'commerce.action.close': 'Cerrar',
  'commerce.action.cancelPurchase': 'Cancelar compra',
  'commerce.action.returnToDraft': 'Volver al borrador',
  'commerce.action.seeProPlans': 'Ver planes Pro',
  'commerce.paywall.seePro': 'Ver planes Pro',
  'commerce.action.seeWaysToEarn': 'Ver formas de ganar',
  'commerce.wallet.title': 'Momenta',
  'commerce.wallet.balance': 'Saldo',
  'commerce.wallet.balanceNote':
    'Crear tu primera promesa y tu primer grupo es gratis. También puedes unirte por primera vez gratis. Usa Momenta para más promesas, grupos, protectores de racha y artículos de la tienda. No tiene valor monetario.',
  'commerce.wallet.balanceAccessibility': '{balance} Momenta',
  'commerce.wallet.balanceUnavailable': 'No pudimos cargar tu saldo.',
  'commerce.wallet.balanceUnavailableDetail':
    'Nada cambió. Inténtalo de nuevo antes de gastar Momenta.',
  'commerce.wallet.refreshing': 'Actualizando tu billetera',
  'commerce.wallet.loadingDetails':
    'Cargando tu saldo, artículos y actividad reciente.',
  'commerce.wallet.refreshBalance': 'No se pudo actualizar el saldo',
  'commerce.wallet.refreshDidNotFinish': 'La actualización no terminó',
  'commerce.wallet.refreshFallback': 'No pudimos actualizar tu saldo.',
  'commerce.wallet.recentActivity': 'Actividad reciente',
  'commerce.wallet.activityEmpty':
    'Las recompensas, compras y gastos confirmados aparecerán aquí.',
  'commerce.wallet.earn': 'Gana Momenta',
  'commerce.wallet.openShop': 'tienda abierta',
  'commerce.wallet.add': 'Añadir Momenta',
  'commerce.wallet.addDetail':
    'Menta puede agregarlo después de revisiones confirmadas o hitos de racha. También puedes elegir un patrocinador opcional o comprar un pack.',
  'commerce.wallet.invite': 'invitar a alguien',
  'commerce.wallet.checkingInviteRewards':
    'Comprobando las recompensas de las invitaciones',
  'commerce.wallet.checking': 'Comprobando…',
  'commerce.wallet.inviteUnavailable':
    'No se pudieron cargar las recompensas de invitación',
  'commerce.wallet.inviteValue': 'Invitar',
  'commerce.wallet.referralsPaused':
    'Las recompensas por invitación están en pausa',
  'commerce.wallet.paused': 'En pausa',
  'commerce.wallet.inviteCap':
    'Has ganado todas las {cap} recompensas de invitación de este año.',
  'commerce.wallet.inviteEarn':
    '{amount} cada uno cuando un nuevo miembro se une y hace tu primera promesa',
  'commerce.wallet.earnReview': 'Gana revisando',
  'commerce.wallet.reviewMeta':
    '{amount} después de cada revisión completa, hasta 20 revisiones por día',
  'commerce.wallet.watchAd': 'Ver un anuncio opcional',
  'commerce.wallet.dailyLimits': 'Se aplican límites diarios',
  'commerce.wallet.open': 'Abierto',
  'commerce.wallet.buyPack': 'Comprar paquete Momenta',
  'commerce.wallet.checkingPrice': 'Comprobando el precio actual',
  'commerce.wallet.unavailable': 'Indisponible',
  'commerce.wallet.viewPro': 'Ver opciones profesionales',
  'commerce.wallet.logInFirst': 'Inicia sesión primero',
  'commerce.wallet.logInToEarn': 'Inicia sesión para ganar Momenta.',
  'commerce.wallet.noAd': 'No hay anuncios disponibles',
  'commerce.wallet.noReward': 'No se obtuvo ninguna recompensa',
  'commerce.paywall.noAdIsAvailable': 'No hay ningún anuncio disponible',
  'commerce.paywall.rewardNotEarned': 'Recompensa no ganada',
  'commerce.wallet.tryAgainLater': 'Vuelve a intentarlo más tarde.',
  'commerce.wallet.watchFullAd':
    'Mira el anuncio completo para cobrar la recompensa.',
  'commerce.wallet.rewardAdded': 'Momenta añadido',
  'commerce.wallet.status': 'Estado',
  'commerce.wallet.added': 'Añadido',
  'commerce.wallet.adUnavailable': 'Anuncio no disponible',
  'commerce.wallet.noAdNow':
    'No hay ningún anuncio disponible en este momento. Vuelve a intentarlo más tarde.',
  'commerce.wallet.dailyLimit':
    'Has conseguido las recompensas publicitarias de hoy',
  'commerce.wallet.cooldown':
    'Tu próxima recompensa publicitaria aún no está lista',
  'commerce.wallet.rewardNotAdded': 'La recompensa no fue añadida.',
  'commerce.wallet.packUnavailable':
    'Este paquete Momenta no está disponible en este momento. No se cobró nada.',
  'commerce.wallet.activityRefreshFailed':
    'No se pudo actualizar la actividad de la billetera.',
  'commerce.wallet.refreshBeforeAd':
    'Actualiza tu billetera antes de ver otro anuncio.',
  'commerce.wallet.addedToBalance': '{amount} Se agregó Momenta a tu saldo.',
  'commerce.wallet.updated': 'Billetera actualizada',
  'commerce.wallet.updatedDetail':
    'Tu saldo, artículos y actividad reciente están actualizados.',
  'commerce.wallet.refreshFailed': 'Error al actualizar',
  'commerce.wallet.tryAgainMoment': 'Inténtalo de nuevo en un momento.',
  'commerce.wallet.noBalance':
    'No se muestra ningún saldo. Comprueba tu conexión y vuelve a intentarlo.',
  'commerce.wallet.lastBalance':
    'Tu último saldo todavía se muestra. Comprueba tu conexión y vuelve a intentarlo.',
  'commerce.wallet.activityTitle': 'Actividad',
  'commerce.wallet.activitySubtitle':
    'Actividad de Momenta confirmada, la más nueva primero.',
  'commerce.wallet.activityDidNotLoad':
    'La actividad de la billetera no se cargó',
  'commerce.wallet.activityDidNotLoadDetail':
    'La actividad reciente no se cargó. Comprueba nuevamente antes de confiar en recompensas o gastos recientes.',
  'commerce.wallet.noActivity': 'Aún no hay actividad',
  'commerce.wallet.noActivityDetail':
    'Las recompensas, las compras y los Momenta que gastes aparecerán aquí.',
  'commerce.wallet.activityOutOfDate':
    'La actividad puede estar desactualizada',
  'commerce.wallet.activityOutOfDateDetail':
    'Es posible que falten recompensas o gastos recientes. Vuelve a consultar la actividad más reciente.',
  'commerce.wallet.recent': 'Reciente',
  'commerce.wallet.today': 'Hoy',
  'commerce.wallet.yesterday': 'Ayer',
  'commerce.wallet.daysAgo': 'Hace {count} días',
  'commerce.wallet.purchaseDescription': 'Momenta añadido',
  'commerce.wallet.yearly': 'Menta Pro, anual',
  'commerce.wallet.monthly': 'Menta Pro, mensual',
  'commerce.wallet.weekly': 'Menta Pro, semanal',
  'commerce.wallet.oneOff': 'Menta Pro, única',
  'commerce.wallet.subscription': 'Suscripción Menta Pro',
  'commerce.wallet.pack': 'Paquete de Momenta',
  'commerce.wallet.earnedDescription': 'Momenta ganado',
  'commerce.wallet.bonusDescription': 'Bonificación de Momenta',
  'commerce.wallet.spentDescription': 'Momenta gastado',
  'commerce.wallet.adjustmentDescription': 'Ajuste de equilibrio',
  'commerce.wallet.activityDescription': 'Actividad de Momenta',
  'commerce.wallet.promiseCreated': 'Promesa creada',
  'commerce.wallet.groupCreated': 'Grupo creado',
  'commerce.shop.title': 'Tienda',
  'commerce.shop.intro':
    'Gasta Momenta en mejoras útiles y haz que Menta se sienta como tuya.',
  'commerce.shop.balance': 'Saldo de Momenta',
  'commerce.shop.balanceUnavailable': 'Saldo y artículos no disponibles',
  'commerce.shop.balanceUnavailableDetail':
    'Aún puedes navegar, pero las compras y el estado del artículo no estarán disponibles hasta que se carguen el saldo y los artículos.',
  'commerce.shop.outOfDate': 'La tienda puede estar desactualizada',
  'commerce.shop.loading': 'Cargando tienda',
  'commerce.shop.loadingDetail': 'Cargando los artículos disponibles ahora.',
  'commerce.shop.unavailable': 'Tienda no disponible',
  'commerce.shop.nothingChanged': '{message} No se gastó ni agregó nada.',
  'commerce.shop.noItems': 'No hay artículos disponibles en este momento',
  'commerce.shop.noItemsDetail':
    'Vuelve a consultar más tarde para ver mejoras, temas, marcos de perfil y herramientas de inteligencia artificial.',
  'commerce.shop.boosts': 'Impulsa',
  'commerce.shop.boostsDetail':
    'Protección y tiempo extra para promesas activas.',
  'commerce.shop.themes': 'Temas',
  'commerce.shop.themesDetail':
    'Cambia el color y el estilo de la superficie de Menta.',
  'commerce.shop.frames': 'Marcos de perfil',
  'commerce.shop.framesDetail':
    'Agrega un marco distintivo alrededor de tu foto de perfil.',
  'commerce.shop.aiTools': 'herramientas de inteligencia artificial',
  'commerce.shop.aiToolsDetail':
    'Asistencia opcional que te mantiene en control.',
  'commerce.shop.available': 'Disponible',
  'commerce.shop.owned': 'Propiedad',
  'commerce.shop.inUse': 'En uso',
  'commerce.shop.free': 'Gratis',
  'commerce.shop.availableCount': '{count} disponible',
  'commerce.shop.usedUp': 'Agotado',
  'commerce.shop.balanceIs': 'Tu saldo es {balance} Momenta',
  'commerce.shop.nowAvailable': 'Ahora tienes {quantity} disponible',
  'commerce.shop.short': '{amount} Momenta corto',
  'commerce.shop.streak': '{days} racha de días',
  'commerce.shop.unlocksAfter':
    'Se desbloquea después de una racha de {days} días',
  'commerce.shop.loadingAccount': 'Saldo y artículos no disponibles',
  'commerce.shop.spendBalance': '{amount} Momenta',
  'commerce.shop.categoryBoost': 'Aumentar',
  'commerce.shop.categoryStyle': 'Estilo',
  'commerce.shop.categoryAi': 'AI',
  'commerce.shop.openItem': 'Abrir {name}',
  'commerce.shop.itemsCount': '{count} artículos',
  'commerce.shop.itemsCount.one': '{count} elemento',
  'commerce.shop.itemsCount.other': '{count} artículos',
  'commerce.shop.balanceIsSentence': 'Tu saldo es {balance} Momenta.',
  'commerce.shop.nowAvailableSentence': 'Ahora tienes {quantity} disponible.',
  'commerce.shop.purchasePendingDetail':
    'Menta no pudo terminar de comprobar esta compra. Inténtalo de nuevo: no gastarás Momenta dos veces.',
  'commerce.shop.purchaseReceipt': '{name} ahora está en Tus artículos.',
  'commerce.shop.purchaseReceiptWithInventory':
    '{name} ahora está en Tus artículos. Ahora tienes {quantity} disponible.',
  'commerce.shop.purchaseReceiptWithBalance':
    '{name} ahora está en Tus artículos. Tu saldo es {balance} Momenta.',
  'commerce.shop.purchaseReceiptWithInventoryAndBalance':
    '{name} ahora está en Tus artículos. Ahora tienes {quantity} disponible. Tu saldo es {balance} Momenta.',
  'commerce.shop.purchaseLabel': 'Compra',
  'commerce.shop.styleLabel': 'Estilo',
  'commerce.shop.currency': 'Momenta',
  'commerce.shop.appearance.ember': 'Tema de ascuas',
  'commerce.shop.appearance.glacier': 'Tema Glaciar',
  'commerce.shop.appearance.aurora': 'Tema de aurora',
  'commerce.shop.appearance.iris': 'Tema de iris',
  'commerce.shop.appearance.cobalt': 'Tema de cobalto',
  'commerce.shop.appearance.jade': 'Tema de jade',
  'commerce.shop.appearance.orchid': 'Tema de orquídeas',
  'commerce.shop.appearance.horizon': 'Tema del horizonte',
  'commerce.shop.appearance.graphite': 'Tema de grafito',
  'commerce.shop.appearance.neon': 'Tema de neón',
  'commerce.shop.appearance.tidepool': 'Tema de la piscina de marea',
  'commerce.shop.appearance.goldFrame': 'Marco dorado',
  'commerce.shop.appearance.violetFrame': 'Marco violeta',
  'commerce.shop.appearance.iceFrame': 'Marco de hielo',
  'commerce.shop.appearance.neonFrame': 'Marco de neón',
  'commerce.shop.appearance.obsidianFrame': 'Marco de obsidiana',
  'commerce.shop.appearance.sparkFrame': 'Marco de chispa',
  'commerce.shop.appearance.weekFrame': 'Marco de semana',
  'commerce.shop.appearance.fortnightFrame': 'Marco de quincena',
  'commerce.shop.appearance.monthFrame': 'Marco del mes',
  'commerce.shop.appearance.seasonFrame': 'Marco de temporada',
  'commerce.shop.automaticProtection': 'Protección automática',
  'commerce.shop.automaticProtectionDetail':
    'Menta los aplica después de un día perdido elegible.',
  'commerce.shop.readyToUse': 'Preparado para usar',
  'commerce.shop.readyToUseDetail':
    'Elige una promesa activa cuando necesite más tiempo.',
  'commerce.shop.appearance': 'Apariencia',
  'commerce.shop.appearanceDetail': 'Elige un estilo propio para usar.',
  'commerce.shop.styleOwnedDetail':
    'Estilos que posees. Usa un estilo a la vez.',
  'commerce.shop.boostOwnedDetail':
    'Soporte de protección y plazos que está listo en esta cuenta.',
  'commerce.shop.aiOwnedDetail': 'Herramientas opcionales de tu propiedad.',
  'commerce.shop.all': 'Todo',
  'commerce.shop.yourItems': 'Tus artículos',
  'commerce.shop.yourItemsIntro':
    'Usa mejoras cuando las necesite, mantén lista la protección automática y elige un estilo.',
  'commerce.shop.items': 'Artículos',
  'commerce.shop.styles': 'Estilos',
  'commerce.shop.loadingItems': 'Cargando tus artículos',
  'commerce.shop.loadingItemsDetail': 'Cargando tus potenciadores y estilos.',
  'commerce.shop.itemsUnavailable': 'Artículos no disponibles',
  'commerce.shop.itemsUnavailableDetail':
    'Menta no pudo cargar tus artículos. No se cambió nada.',
  'commerce.shop.noItemsYet': 'Aún no hay artículos',
  'commerce.shop.showAll': 'Mostrar todo',
  'commerce.shop.nothingInSection': 'Nada en esta sección',
  'commerce.shop.chooseAll': 'Elige Todo para ver tus otros artículos.',
  'commerce.shop.itemsOutOfDate': 'Los artículos pueden estar desactualizados',
  'commerce.shop.itemsUpdated': 'Tus artículos están actualizados.',
  'commerce.shop.itemsRefreshed':
    'Tus potenciadores y estilos se han actualizado.',
  'commerce.shop.tryRefreshAgain': 'Intenta actualizar nuevamente',
  'commerce.shop.howItWorks': 'como funciona',
  'commerce.shop.choose': 'Elegir',
  'commerce.shop.use': 'Usar',
  'commerce.shop.remove': 'Eliminar',
  'commerce.shop.useStyle': 'Usa este estilo',
  'commerce.shop.removeStyle': 'Eliminar este estilo',
  'commerce.shop.itemUnavailable': 'Artículo no disponible',
  'commerce.shop.notCurrentItem': 'Este artículo no está en la tienda actual.',
  'commerce.shop.currentItem': 'Artículo actual de la tienda',
  'commerce.shop.itemAccountDetail':
    'Puede leer sobre este artículo, pero comprarlo o usarlo no estará disponible hasta que se carguen tu saldo y tus artículos.',
  'commerce.shop.promise': 'Promesa',
  'commerce.shop.style': 'Estilo',
  'commerce.shop.boost': 'Aumentar',
  'commerce.shop.ready': '{count} listo',
  'commerce.shop.readyLabel': 'Listo',
  'commerce.shop.state': 'Estado',
  'commerce.shop.reachStreakAuto':
    'Alcanza una racha de {days} días. Menta lo agrega a Tus artículos automáticamente.',
  'commerce.shop.appearanceWarm':
    '{name} le da a Menta una apariencia más cálida.',
  'commerce.shop.frameTitle': '{name} enmarca tu foto de perfil.',
  'commerce.shop.oneUse': 'un uso',
  'commerce.shop.unlocks': 'Se desbloquea con una racha de {days} días',
  'commerce.shop.buyQuestion': '¿Comprar {name}?',
  'commerce.shop.buyDetail': 'Solo gastas Momenta si la compra se realiza.',
  'commerce.shop.currentBalance': 'Saldo actual',
  'commerce.shop.spend': 'Gastar',
  'commerce.shop.balanceAfter': 'Saldo después de la compra',
  'commerce.shop.buyFor': 'Comprar por {amount} Momenta',
  'commerce.shop.buyNamedFor': 'Compra {name} por {amount} Momenta',
  'commerce.shop.costScrollHint': 'Desplácese para revisar el costo y el saldo',
  'commerce.shop.choosePromise': 'Elige una promesa',
  'commerce.shop.loadingPromises': 'Cargando tus promesas',
  'commerce.shop.findingPromises':
    'Encontrar promesas que puedan utilizar esta extensión.',
  'commerce.shop.extensionStillAvailable':
    'Tu extensión aún está disponible. Intenta cargar promesas nuevamente.',
  'commerce.shop.extensionDetail':
    'Esto utiliza una extensión y retrasa la fecha límite de esa promesa 12 horas más tarde.',
  'commerce.shop.promiseTargetsMissing':
    'Los objetivos de promesa no se cargaron',
  'commerce.shop.noActivePromises': 'Sin promesas activas',
  'commerce.shop.startBeforeExtension':
    'Inicia o únete a una promesa antes de usar una extensión.',
  'commerce.shop.startPromise': 'iniciar una promesa',
  'commerce.shop.activePromise': 'promesa activa',
  'commerce.shop.dayStreak': '{count} racha de días',
  'commerce.shop.addMomenta': 'Añadir {amount} Momenta',
  'commerce.shop.coverDifference':
    'Tienes {balance} Momenta. Elige cómo cubrir la diferencia de {name}.',
  'commerce.shop.itemStillHere': 'Tu artículo todavía está aquí',
  'commerce.shop.comeBack': 'Vuelve después de añadir suficiente Momenta.',
  'commerce.shop.earnReviewAccessibility':
    'Gana revisando. Cada revisión completa agrega {amount} Momenta, hasta 20 revisiones por día.',
  'commerce.shop.watchAdAccessibility':
    'Mire un anuncio opcional. Se aplican límites diarios. Hasta {amount} Momenta.',
  'commerce.shop.watchAdNoAmountAccessibility':
    'Mire un anuncio opcional. Se aplican límites diarios.',
  'commerce.shop.buyPackAccessibility':
    'Comprar paquete Momenta. {amount} Momenta para {price}.',
  'commerce.shop.buyPackChecking':
    'Comprar paquete Momenta. Comprobando el precio actual.',
  'commerce.shop.upTo': 'Hasta +{amount}',
  'commerce.shop.seePro': 'Ver planes Pro',
  'commerce.shop.refreshStatus': 'A hoy',
  'commerce.shop.balanceItemsCurrent':
    'Tu saldo y artículos están actualizados.',
  'commerce.shop.checkStatus': 'comprobar estado',
  'commerce.action.checkStatus': 'comprobar estado',
  'commerce.shop.checkPurchaseAgain': 'Intenta comprar nuevamente',
  'commerce.shop.keepStreak': 'Mantén una racha de {days} días',
  'commerce.shop.getMomenta': 'Obtener Momenta',
  'commerce.shop.buyAgainFor': 'Compra de nuevo por {amount} Momenta',
  'commerce.shop.loadingBalanceItems': 'Cargando tu saldo y artículos...',
  'commerce.shop.extensionStillChecking':
    'La extensión aún se está comprobando',
  'commerce.shop.couldNotLoadPromises': 'No se pudieron cargar las promesas',
  'commerce.shop.promisesDidNotLoad':
    'Las promesas no se cargaron. Tu extensión aún está disponible.',
  'commerce.shop.availableLabel': 'Disponible',
  'commerce.shop.checkingPurchase': 'Comprobando…',
  'commerce.shop.purchaseComplete': 'Completo',
  'commerce.shop.styleActivated': '{name} está en uso',
  'commerce.shop.boughtAndUsing':
    'Compraste {name} y Menta ahora lo está usando.',
  'commerce.shop.tapUseStyle':
    '{message} Toca Usar este estilo para aplicarlo.',
  'commerce.shop.refreshIfMissing':
    '{message} Actualiza tus artículos si el cambio no aparece.',
  'commerce.shop.removed': '{name} eliminado',
  'commerce.shop.usingStyle': 'Menta ahora está usando este estilo.',
  'commerce.shop.styleInUse': '{name} está en uso.',
  'commerce.shop.styleNoLongerUsed': 'Menta ya no usa este estilo.',
  'commerce.shop.styleRemoved': '{name} fue eliminado.',
  'commerce.shop.couldNotUseStyle': 'No se pudo usar este estilo',
  'commerce.shop.couldNotRemoveStyle': 'No se pudo eliminar este estilo',
  'commerce.shop.noAvailable': 'No hay {name}s disponibles',
  'commerce.shop.refreshBeforeUse':
    'Actualiza tus artículos antes de volver a intentarlo.',
  'commerce.shop.freezeReady': 'Tu congelación está lista',
  'commerce.shop.freezeDetail':
    'Menta usa uno automáticamente después de un día perdido elegible. No es necesario encenderlo.',
  'commerce.shop.automatic': 'Automático',
  'commerce.shop.extensionUnknown': 'Resultado de la extensión desconocido',
  'commerce.shop.extensionNotUsed': 'Extensión no utilizada',
  'commerce.shop.checkExtensionStatus': 'Verificar el estado de la extensión',
  'commerce.shop.deadlineExtended': 'Plazo ampliado',
  'commerce.shop.deadlineUpdated':
    '{message} Actualiza tus artículos si el recuento disponible no se ha actualizado.',
  'commerce.shop.refreshItemsAction': 'Actualizar artículos',
  'commerce.shop.promiseDeadline': 'Fecha límite de promesa',
  'commerce.shop.twelveHoursLater': '12 horas después',
  'commerce.shop.extension': 'Extensión',
  'commerce.shop.usedOnce': 'Usado una vez',
  'commerce.shop.notAvailable': '{name} no está disponible',
  'commerce.shop.returnToShop':
    'Actualiza tus artículos o regresa a la tienda para comprar otro.',
  'commerce.shop.useExtension': 'Usar ahora',
  'commerce.shop.noneAvailable': 'Ninguno disponible',
  'commerce.shop.chooseActivePromise': 'Elige una promesa activa',
  'commerce.shop.extensionUsed': 'Una extensión se utiliza inmediatamente.',
  'commerce.shop.appearancePreview': 'Vista previa de apariencia',
  'commerce.shop.profilePreview': 'Vista previa del perfil',
  'commerce.shop.now': 'Ahora',
  'commerce.shop.due': 'Pendiente',
  'commerce.shop.plusTwelveHours': '+12h',
  'commerce.shop.itemOutcome': 'Resultado del artículo',
  'commerce.shop.afterPurchase': 'Después de la compra',
  'commerce.shop.activatesAfterPurchase': 'Se activa después de la compra.',
  'commerce.shop.activeNow': 'Activo ahora',
  'commerce.shop.readyToEquip': 'Listo para equipar',
  'commerce.shop.coversMissedDay': 'Cubre el siguiente día perdido elegible.',
  'commerce.shop.addsDeadline': 'Se mueve una fecha límite 12 horas más tarde.',
  'commerce.shop.coverDescription':
    'Cubre automáticamente el próximo día perdido elegible.',
  'commerce.shop.addDescription':
    'Agrega 12 horas a la fecha límite de una promesa activa.',
  'commerce.shop.choosePromiseAfter':
    'Elige la promesa activa después de la compra o más tarde de Tus artículos.',
  'commerce.shop.buttonsColours':
    'Los botones, las luces y los artículos seleccionados utilizan los colores cálidos de Ember.',
  'commerce.shop.frameProfile':
    'El marco aparece en cualquier lugar donde Menta muestre tu identidad de perfil.',
  'commerce.shop.frameDescription':
    'El marco aparece en tu foto de perfil una vez desbloqueado.',
  'commerce.shop.frameLockedBody':
    'Alcanza una racha de {days} días. El marco aparece en tu foto de perfil una vez desbloqueado.',
  'commerce.shop.genericReview': 'Revise el artículo antes de comprarlo.',
  'commerce.shop.underYourItems': '{name} estará disponible en Tus artículos.',
  'commerce.shop.access': 'Acceso',
  'commerce.shop.unlocksAt': 'Se desbloquea con una racha de {days} días',
  'commerce.shop.afterPurchaseFact': 'Después de la compra',
  'commerce.paywall.close': 'Cerrar muro de pago',
  'commerce.paywall.heroTitle': 'Más espacio para seguir adelante.',
  'commerce.paywall.heroSubtitle':
    'Mantén más promesas y grupos en movimiento, sin que los límites de los planes gratuitos se interpongan en tu camino.',
  'commerce.paywall.whatChanges': 'Qué cambia Pro',
  'commerce.paywall.choosePlan': 'Elige un plan',
  'commerce.paywall.monthly': 'Pro mensual',
  'commerce.paywall.annual': 'Profesional anual',
  'commerce.paywall.loadingPlans': 'Cargando planes Pro…',
  'commerce.paywall.loadingPrice': 'Cargando precio…',
  'commerce.paywall.priceUnavailable': 'Indisponible',
  'commerce.paywall.storePrices': 'Los precios se cargan desde la App Store.',
  'commerce.paywall.planTerms':
    'Elige un plan para ver tu precio y términos de renovación.',
  'commerce.paywall.billedMonthly': 'Facturado {price} mensualmente',
  'commerce.paywall.renewsMonthly': 'Se renueva mensualmente',
  'commerce.paywall.monthEquivalent': '{price} equivalente a un mes',
  'commerce.paywall.renewsYearly': 'Se renueva anualmente',
  'commerce.paywall.trialTerms':
    'Apple muestra los términos de la prueba antes de confirmar.',
  'commerce.paywall.autoRenewsMonthly':
    'Se renueva automáticamente mensualmente. {period}. Cancele en cualquier Momenta en la configuración de tu suscripción de Apple.',
  'commerce.paywall.autoRenewsYearly':
    'Se renueva automáticamente anualmente. {period}. Cancele en cualquier Momenta en la configuración de tu suscripción de Apple.',
  'commerce.paywall.openCheckout': 'Abriendo caja de Apple...',
  'commerce.paywall.continueMonthly': 'Continuar con el pago mensual',
  'commerce.paywall.continueAnnual': 'Continuar al pago anual',
  'commerce.paywall.chooseToContinue': 'Elige un plan para continuar',
  'commerce.paywall.loadingDots': 'Cargando...',
  'commerce.paywall.loadingSelectedPrice': 'Cargando precio {plan}…',
  'commerce.paywall.plansUnavailable':
    'Los planes no están disponibles temporalmente',
  'commerce.paywall.purchasesUnavailable':
    'Las compras no están disponibles en este dispositivo',
  'commerce.paywall.checkConnectionPlans':
    'Verifica tu conexión e intenta cargar los planes nuevamente.',
  'commerce.paywall.updateTryAgain':
    'Actualiza Menta o vuelve a intentarlo más tarde.',
  'commerce.paywall.retryPlans': 'Reintentar cargar planes',
  'commerce.paywall.whatProDoes': 'Promesas y grupos más activos',
  'commerce.paywall.morePromises':
    'Mantén más de {promises} promesas activas y {groups} grupos sin alcanzar el límite gratuito.',
  'commerce.paywall.momentaPeriod': 'Momenta cada periodo de facturación',
  'commerce.paywall.momentaPeriodDetail':
    '{monthly} cada mes, o {annual} en el plan anual. Pro levanta las tapas libres; Los usuarios que crean y se unen siguen gastando Momenta al precio normal.',
  'commerce.paywall.noRequiredAds': 'No se requieren pausas publicitarias',
  'commerce.paywall.noRequiredAdsDetail':
    'Cree y administre promesas sin las interrupciones necesarias de los patrocinadores.',
  'commerce.paywall.restore': 'Restaurar compras',
  'commerce.paywall.restoring': 'Restaurando...',
  'commerce.paywall.manageWithApple': 'Administrar Menta Pro con Apple',
  'commerce.paywall.freeNote':
    'Gratis incluye {promises} promesas en vivo y {groups} grupos activos a la vez, además de hasta {challenges} nuevas promesas cada mes. Las personas que crean y se unen siguen gastando Momenta.',
  'commerce.paywall.quotaGroup':
    'El plan gratuito incluye hasta {limit} grupo activo{suffix} a la vez.',
  'commerce.paywall.quotaChallenge':
    'El plan gratuito incluye {active} promesas activas a la vez y hasta {monthly} nuevas promesas cada mes.',
  'commerce.paywall.quotaKnown':
    'El plan gratuito incluye {limit} de estas acciones.',
  'commerce.paywall.quotaReached':
    'Has alcanzado el límite gratuito para esta acción.',
  'commerce.paywall.legalDisclaimer':
    'El pago se carga a través de tu cuenta de la tienda de aplicaciones al Momenta de la confirmación de la compra. La suscripción se renueva automáticamente a menos que se desactive la renovación automática al menos 24 horas antes del final del período actual. Se cargará a tu cuenta la renovación dentro de las 24 horas anteriores al final del período actual. Puede administrar y cancelar suscripciones en la configuración de suscripción de tu tienda.',
  'commerce.paywall.terms': 'Condiciones de uso',
  'commerce.paywall.privacy': 'política de privacidad',
  'commerce.paywall.termsDidNotOpen': 'Los términos no se abrieron',
  'commerce.paywall.privacyDidNotOpen': 'La política de privacidad no se abrió',
  'commerce.paywall.tryBrowserTerms':
    'Inténtalo de nuevo o visita menta.quest/terms en tu navegador.',
  'commerce.paywall.tryBrowserPrivacy':
    'Inténtalo de nuevo o visita menta.quest/privacy en tu navegador.',
  'commerce.paywall.checkoutStillOpen': 'La caja aún está abierta',
  'commerce.paywall.checkoutStillOpenDetail':
    'No sabemos si la compra finalizó. No lo vuelvas a comprar. Cuando se cierre el proceso de pago, comprueba el acceso Pro o restaura las compras.',
  'commerce.paywall.openingCheckout': 'Abrir caja de Apple',
  'commerce.paywall.appleConfirm':
    'Apple te pedirá que confirmes la compra. Pro se enciende después de que Menta verifica tu acceso.',
  'commerce.paywall.unsupportedDetail':
    'Actualiza Menta o vuelve a intentarlo más tarde.',
  'commerce.paywall.proActive': 'Menta Pro está activo',
  'commerce.paywall.havePro': 'Tienes Menta Pro',
  'commerce.paywall.featuresReady':
    'Tus funciones Pro están listas. Gestiona o cancela tu plan con Apple.',
  'commerce.paywall.proActiveDetail': 'Puede utilizar tus funciones Pro ahora.',
  'commerce.paywall.proActiveAgain': 'Menta Pro vuelve a estar activo',
  'commerce.paywall.previousActive':
    'Tu compra anterior está activa. No se le volvió a acusar.',
  'commerce.paywall.previousActiveAccount':
    'Tu compra anterior está activa en esta cuenta. No se le volvió a acusar.',
  'commerce.paywall.manageSubscription': 'Administrar suscripción',
  'commerce.paywall.purchaseCancelled': 'Compra cancelada',
  'commerce.paywall.notChargedChoose':
    'No te acusaron. Puedes elegir un plan cuando estés listo.',
  'commerce.paywall.purchaseFailed': 'La compra no se realizó',
  'commerce.paywall.purchaseFailedDetail':
    'Pro no se activó. Revisa tu conexión y vuelve a intentarlo.',
  'commerce.paywall.restoreFailed': 'No se pudieron restaurar las compras',
  'commerce.paywall.restoreFailedDetail':
    'Comprueba tu conexión y vuelve a intentarlo. No se cobró nada.',
  'commerce.paywall.restoreFailedChanged':
    'Comprueba tu conexión y vuelve a intentarlo. No se cobró ni cambió nada.',
  'commerce.paywall.adsUnavailable': 'Los anuncios no están disponibles',
  'commerce.paywall.tryUpdate':
    'Inténtalo de nuevo más tarde o actualiza Menta.',
  'commerce.paywall.adDidNotLoad': 'El anuncio no se cargó',
  'commerce.paywall.adDidNotPlay': 'El anuncio no se reprodujo.',
  'commerce.paywall.tryTomorrow': 'Inténtalo de nuevo mañana.',
  'commerce.paywall.rewardNotReady': 'La recompensa aún no está lista',
  'commerce.paywall.waitTwoMinutes':
    'Espere dos minutos antes de ver otro anuncio.',
  'commerce.paywall.refreshBeforeAd':
    'Tu saldo no cambió. Actualiza antes de ver otro anuncio.',
  'commerce.paywall.adLoadTryAgain':
    'El anuncio no se cargó. Intentar otra vez.',
  'commerce.paywall.rewardNotAddedDetail':
    'La recompensa no fue añadida. Tu saldo no cambió.',
  'commerce.paywall.adError': 'Error de anuncio',
  'commerce.paywall.noMatchingPurchase':
    'No se encontró ninguna compra que coincida',
  'commerce.paywall.noMatchingPurchaseDetail':
    'Comprueba la cuenta de Apple utilizada para la compra original. Si Apple muestra un cargo, obtenga ayuda antes de volver a comprar.',
  'commerce.paywall.checkAccess': 'Verificar acceso Pro',
  'commerce.paywall.checkAccessLater': 'Comprueba más tarde',
  'commerce.paywall.planSelectionHint':
    'Selecciona este plan. A continuación confirmarás la compra con Apple.',
  'commerce.paywall.checkingAccess': 'Comprobando el acceso Pro',
  'commerce.paywall.checkingAccessDetail':
    'Esta revisión no generará ningún cargo.',
  'commerce.paywall.accessDelayed': 'Pro está tardando más en activarse',
  'commerce.paywall.accessDelayedDetail':
    'Es posible que tu compra aún esté finalizando. No lo vuelvas a comprar. Comprueba el acceso Pro o restaura compras.',
  'commerce.paywall.proNotActive': 'Pro aún no está activo',
  'commerce.paywall.proNotActiveDetail':
    'No lo vuelvas a comprar. Restaura las compras o comprueba el acceso Pro nuevamente en un momento.',
  'commerce.paywall.couldNotCheck': 'No pudimos verificar el acceso Pro',
  'commerce.paywall.couldNotCheckDetail':
    'No lo vuelvas a comprar. Restaura las compras o comprueba el acceso Pro más tarde.',
  'commerce.paywall.restoringPurchases': 'Restaurando compras...',
  'commerce.paywall.restoringDetail':
    'Verificar compras vinculadas a esta cuenta de Apple. No se le cobrará.',
  'commerce.paywall.manage': 'Administrar Menta Pro',
  'commerce.paywall.couldNotOpenSubscriptions':
    'No se pudieron abrir las suscripciones de Apple',
  'commerce.paywall.openAppleSettings':
    'Abra Ajustes, toque tu cuenta de Apple y luego Suscripciones para administrar Menta Pro.',
  'commerce.paywall.manageDetail':
    'Cambia o cancela tu plan en Ajustes de Apple. Menta actualiza Pro cuando regresas.',
  'commerce.paywall.purchaseTermsReturn':
    'Apple mostrará los términos finales y le pedirá que los confirme. Vuelve a Menta cuando se cierre el pago.',
  'commerce.paywall.continueApple': 'Continuar en la configuración de Apple',
  'commerce.paywall.startPro': 'Comience a usar Pro',
  'commerce.paywall.choosePlanAction': 'Elige un plan',
  'commerce.paywall.returnMenta': 'Regresar a Menta',
  'commerce.paywall.backPlans': 'Volver a los planes',
  'commerce.paywall.tryRestore': 'Intenta restaurar de nuevo',
  'commerce.paywall.proAccess': 'Acceso profesional',
  'commerce.paywall.active': 'Activo',
  'commerce.paywall.needMomenta': 'Se necesita más Momenta',
  'commerce.paywall.needMore': 'Necesita {amount} más Momenta',
  'commerce.paywall.savedSubject':
    'Tu {subject} se guarda mientras eliges qué hacer a continuación.',
  'commerce.paywall.oneAd': 'Un anuncio agrega {amount} Momenta.',
  'commerce.paywall.oneAdStillNeed':
    'Un anuncio agrega {amount} Momenta. Aún necesitarías {remaining} más.',
  'commerce.paywall.oneAdEnough':
    'Un anuncio agrega {amount} Momenta, suficiente para este {subject}.',
  'commerce.paywall.adLoading': 'Cargando anuncio...',
  'commerce.paywall.watchAdFor': 'Ver un anuncio de {amount} Momenta',
  'commerce.paywall.freeLimit': 'Límite libre',
  'commerce.paywall.reachedLimit': 'Has alcanzado el límite gratuito',
  'commerce.paywall.revenueCat.notInitializedDetail':
    'Las compras no están listas. Comprueba tu conexión y vuelve a intentarlo.',
  'commerce.paywall.revenueCat.notInitialized': 'Compras no inicializadas',
  'commerce.paywall.revenueCat.unavailableDetail':
    'Las compras no están disponibles en este dispositivo.',
  'commerce.paywall.revenueCat.unavailable':
    'Compras no disponibles en esta plataforma',
  'commerce.paywall.revenueCat.noCurrentOffering':
    'No hay ninguna oferta actual configurada.',
  'commerce.paywall.revenueCat.noCurrentOfferingShort': 'Ninguna oferta actual',
  'commerce.paywall.revenueCat.noCreditOffering':
    'No se configura ninguna oferta de crédito.',
  'commerce.paywall.revenueCat.noCreditOfferingShort':
    'No hay oferta de crédito disponible',
  'commerce.paywall.revenueCat.planPackageMissing':
    'Paquete de compra no encontrado para el plan seleccionado.',
  'commerce.paywall.revenueCat.packageMissing': 'Paquete no encontrado',
  'commerce.paywall.revenueCat.startingPurchase': 'Iniciando compra segura…',
  'commerce.paywall.revenueCat.purchaseAccessPending':
    'Apple regresó de la compra, pero Menta aún no ha confirmado el acceso Pro.',
  'commerce.paywall.revenueCat.creditPackageMissing':
    'Paquete de crédito no encontrado.',
  'commerce.paywall.revenueCat.startingCreditPurchase':
    'Iniciando compra de crédito…',
  'commerce.paywall.revenueCat.restoreAccessPending':
    'Apple devolvió una compra Pro, pero Menta aún no ha confirmado el acceso.',
  'commerce.paywall.draftSaved': '{message} Tu borrador se guarda.',
  'commerce.commerce.offline': 'Estás desconectado',
  'commerce.commerce.offlineDetail':
    'Tu último saldo y artículos aún se muestran. Vuelve a conectarse y actualiza antes de comprar o usar algo.',
  'commerce.commerce.fetchError':
    'No se pudieron obtener los detalles más recientes',
  'commerce.commerce.fetchErrorDetail':
    'Nada cambió. Inténtalo de nuevo antes de comprar o usar cualquier cosa.',
  'commerce.commerce.insufficient': 'No hay suficiente Momenta',
  'commerce.commerce.insufficientDetail':
    'Necesitas {amount} más Momenta. No se gastó nada.',
  'commerce.commerce.insufficientGeneric':
    'Necesitas más Momenta. No se gastó nada.',
  'commerce.commerce.zero': '0',
  'commerce.commerce.submitting': 'Finalizando tu compra',
  'commerce.commerce.submittingDetail':
    'Mantén esta pantalla abierta. No vuelvas a comprar el artículo mientras Menta comprueba lo que pasó.',
  'commerce.commerce.checking': 'Comprobando',
  'commerce.commerce.notChanged': 'Aún no cambiado',
  'commerce.commerce.unknown': 'Todavía estamos revisando esta compra.',
  'commerce.commerce.unknownDetail':
    'No lo vuelvas a comprar todavía. Primero comprueba tu saldo y tus artículos; es posible que la compra aún se realice.',
  'commerce.commerce.stillChecking': 'Todavía comprobando',
  'commerce.commerce.wait': 'Espere hasta que lo revisen',
  'commerce.commerce.storePending': 'Comprobando tu Momenta',
  'commerce.commerce.storePendingDetail':
    'Apple aceptó la compra. Tu Momenta aparecerá después de que Menta lo confirme. Verificar nuevamente no le cobrará.',
  'commerce.commerce.complete': 'Completo',
  'commerce.commerce.waiting': 'Espera',
  'commerce.commerce.purchaseComplete': 'Compra completa',
  'commerce.commerce.account': 'Cuenta',
  'commerce.commerce.updated': 'Actualizado',
  'commerce.commerce.nothingHere': 'Nada aquí todavía',
  'commerce.commerce.completedAppear':
    'Las compras completadas aparecerán aquí.',
  'commerce.commerce.nothingSpent':
    'No se gastó nada ni se agregó ningún artículo.',
  'commerce.commerce.cancelled': 'Compra cancelada',
  'commerce.commerce.cancelledDetail': 'No se cargó ni agregó nada.',
  'commerce.commerce.failed': 'La compra no se realizó',
  'commerce.commerce.failedDetail':
    'No se gastó nada ni se agregó ningún artículo.',
  'commerce.commerce.purchaseLabel': 'Compra',
  'commerce.commerce.buyAgainLabel': 'Comprar de nuevo',
  'commerce.commerce.momentaLabel': 'Momenta',
  'commerce.commerce.momentaSpentLabel': 'Momenta gastado',
  'commerce.commerce.notStarted': 'No iniciado',
  'commerce.commerce.checkingLabel': 'Comprobando',
  'commerce.commerce.balanceItemsLabel': 'Saldo y partidas',
  'commerce.commerce.notChangedYet': 'Aún no cambiado',
  'commerce.commerce.stillCheckingLabel': 'Todavía comprobando',
  'commerce.commerce.waitUntilChecked': 'Espere hasta que lo revisen',
  'commerce.commerce.applePurchaseLabel': 'compra de manzana',
  'commerce.commerce.waitingLabel': 'Espera',
  'commerce.commerce.yourItemsLabel': 'Tus artículos',
  'commerce.commerce.accountLabel': 'Cuenta',
  'commerce.commerce.paymentLabel': 'Pago',
  'commerce.commerce.notMade': 'no hecho',
  'commerce.commerce.notAdded': 'No añadido',
  'commerce.commerce.itemsLabel': 'Artículos',
  'commerce.commerce.unchanged': 'Sin alterar',
  'commerce.commerce.purchaseCompleteGeneric': 'Tu compra está completa.',
  'commerce.commerce.purchaseCompleteForItem':
    '{name} ahora está en Tus artículos.',
  'commerce.commerce.purchaseStatusComplete': 'Completo',
  'commerce.commerce.updatedStatus': 'Actualizado',
  'commerce.readback.powerUp.unknown':
    'No pudimos saber si se utilizó la extensión. Comprueba la promesa antes de volver a intentarlo.',
  'commerce.readback.powerUp.challengeAccessDenied':
    'Elige una promesa activa que pertenezca a esta cuenta.',
  'commerce.readback.powerUp.challengeNotExtended':
    'El plazo no cambió. Actualiza la promesa antes de volver a intentarlo.',
  'commerce.readback.powerUp.challengeRequired':
    'Elige una promesa activa antes de usar esta extensión.',
  'commerce.readback.powerUp.idempotencyReused':
    'Esta acción ya no es para la extensión que se muestra. Ciérralo y comienza de nuevo.',
  'commerce.readback.powerUp.invalidRequest':
    'La extensión no pudo iniciarse. Ciérralo y vuelve a intentarlo.',
  'commerce.readback.powerUp.noInventory':
    'No hay extensiones disponibles. Actualiza tus artículos para comprobarlos nuevamente.',
  'commerce.readback.powerUp.requestInProgress':
    'Menta todavía está comprobando si se utilizó la extensión. Comprueba nuevamente antes de usar otro.',
  'commerce.readback.powerUp.unauthorized':
    'Inicia sesión nuevamente antes de usar una extensión.',
  'commerce.readback.powerUp.unsupported':
    'Este impulso anterior ya no se utiliza. Actualiza tus artículos para tu reposición.',
  'commerce.readback.powerUp.failed':
    'La extensión no fue utilizada. Actualiza tus artículos e inténtalo de nuevo.',
  'commerce.readback.powerUp.used': 'Se utilizó la extensión.',
  'commerce.readback.shop.unknown': 'No pudimos saber si la compra se realizó.',
  'commerce.readback.shop.insufficient':
    'No tienes suficiente Momenta para este artículo.',
  'commerce.readback.shop.invalidRequest':
    'Esta compra no pudo iniciarse. Ciérralo y vuelve a intentarlo.',
  'commerce.readback.shop.itemUnavailable':
    'Este artículo no está disponible en este momento.',
  'commerce.readback.shop.factMismatch':
    'Esta compra ya no es para el artículo mostrado. Ciérralo y comienza de nuevo.',
  'commerce.readback.shop.unauthorized':
    'Inicia sesión nuevamente antes de comprar este artículo.',
  'commerce.readback.shop.userNotFound':
    'No pudimos encontrar tu cuenta Menta. Inicia sesión nuevamente.',
  'commerce.readback.shop.failed':
    'La compra no se concretó. No se gastó nada.',
  'commerce.economy.freezeGrantNone':
    'Mantener una racha puede provocar una congelación.',
  'commerce.economy.freezeGrantOne':
    'Mantener una racha {days} también otorga una congelación.',
  'commerce.economy.freezeGrantTwo':
    'Mantener una racha {first} o {second} también otorga una congelación.',
  'commerce.economy.freezeGrantMany':
    'Mantener una racha {leading} o {last} también otorga una congelación.',
  'commerce.economy.inventoryEmpty':
    'Aún no tienes artículos. Compra potenciadores y estilos en la tienda. {freeze}',
  'commerce.economy.weekFreezeLabel': 'Congelación de semana',
  'commerce.economy.weekFreezeBenefit':
    'Una racha congelada por cumplir una promesa durante una semana.',
  'commerce.economy.monthFreezeLabel': 'Congelación del mes',
  'commerce.economy.monthFreezeBenefit':
    'Otro congelamiento por mantener una racha de 30 días.',
  'commerce.economy.createFirstFree': 'Gratis: primera promesa',
  'commerce.economy.createCost': '{amount} Momenta',
  'commerce.economy.quotaActiveTitle': 'Estás en el límite de promesa gratuita',
  'commerce.economy.quotaActiveMessage':
    'Las cuentas gratuitas pueden cumplir 2 promesas reales. Termine o deje uno, o inicia Pro antes de crear otro.',
  'commerce.economy.quotaMonthlyTitle':
    'Se alcanzó el límite de creación mensual',
  'commerce.economy.quotaMonthlyMessage':
    'El plan gratuito incluye 4 nuevas promesas cada mes. Tu borrador todavía está aquí.',
  'commerce.commerce.loadingTitle': 'Comprobando los datos más recientes',
  'commerce.commerce.loadingDetail': 'Cargando tu saldo y tus artículos.',
  'commerce.paywall.oneAdEnough.group':
    'Un anuncio añade {amount} Momenta, suficiente para este grupo.',
  'commerce.paywall.oneAdEnough.promise':
    'Un anuncio añade {amount} Momenta, suficiente para esta promesa.',
  'commerce.paywall.oneAdEnough.draft':
    'Un anuncio añade {amount} Momenta, suficiente para este borrador.',
  'commerce.paywall.quotaGroup.one':
    'El plan gratuito incluye hasta {limit} grupo activo a la vez.',
  'commerce.paywall.quotaGroup.other':
    'El plan gratuito incluye hasta {limit} grupos activos a la vez.',
  'commerce.paywall.savedSubject.group':
    'Tu grupo se ha guardado mientras decides qué hacer a continuación.',
  'commerce.paywall.savedSubject.promise':
    'Tu promesa se ha guardado mientras decides qué hacer a continuación.',
  'commerce.paywall.savedSubject.draft':
    'Tu borrador se ha guardado mientras decides qué hacer a continuación.',
  'commerce.wallet.rewardCheckingTitle': 'Revisando tu recompensa',
  'commerce.wallet.rewardCheckingDetail':
    'Mantén esta pantalla abierta hasta que termine.',
  'commerce.wallet.rewardMissingTitle': 'La recompensa todavía no ha llegado',
  'commerce.wallet.rewardMissingDetail':
    'Actualiza tu saldo antes de ver a otro patrocinador.',
  'commerce.wallet.refreshBalanceAction': 'Actualizar saldo',
  'commerce.wallet.rewardDailyLimitTitle': 'Eso es todo por hoy',
  'commerce.wallet.rewardDailyLimitDetail':
    'Ya recibiste las recompensas de patrocinadores de hoy.',
  'commerce.wallet.rewardCheckingAccessibility':
    'Revisando el estado de la recompensa',
  'commerce.wallet.refreshingBalance': 'Actualizando saldo…',
  'commerce.wallet.rewardClaimInProgress':
    'Menta todavía está revisando tu recompensa anterior.',
} as const satisfies Pick<EnglishCatalogue, FullCommerceKey>;
