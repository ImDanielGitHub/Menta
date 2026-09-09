import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullGroupsKey = Extract<keyof EnglishCatalogue, `groups.${string}`>;

/** Spanish (Spain) copy for group, invite, join, and funding journeys. */
/** Catálogo en español de España para grupos, invitaciones, uniones y fondos. */
export const fullGroupsEsMX = {
  'groups.tab.title': 'Grupos',
  'groups.tab.archived': 'Grupos archivados',
  'groups.tab.archived_hint': 'Abre tus grupos archivados y completados.',
  'groups.tab.create': 'Crear grupo',
  'groups.tab.create_hint': 'Inicia la creación del grupo.',
  'groups.tab.mine': 'Mis grupos',
  'groups.tab.mine_hint': 'Muestra los grupos a los que perteneces.',
  'groups.tab.discover': 'Descubrir',
  'groups.tab.discover_hint':
    'Muestra grupos públicos a los que puedes unirte.',
  'groups.tab.invite_ready': 'Invitación lista para comprobar',
  'groups.tab.enter_code': 'Introduce un código de invitación',
  'groups.tab.invite_hint': 'Abre la entrada de invitación de grupo o promesa.',
  'groups.tab.invite_row': 'Invitación lista para comprobar',
  'groups.tab.enter_invite_row': 'Introduce el código de invitación',
  'groups.tab.invite_detail':
    'Usa un enlace, un código QR o un código de invitación.',
  'groups.tab.check': 'Comprobar',
  'groups.tab.enter': 'Entrar',
  'groups.tab.sign_in_title': 'Es necesario iniciar sesión',
  'groups.tab.sign_in_detail': 'Inicia sesión antes de unirte a este grupo.',
  'groups.tab.invite_needed_title': 'Invitación necesaria',
  'groups.tab.invite_needed_detail':
    'Este grupo no es público. Usa un código de alguien que ya esté dentro.',
  'groups.tab.joined_title': 'grupo unido',
  'groups.tab.joined_action': 'grupo',
  'groups.tab.join_unknown_title': 'Unirse no confirmado',
  'groups.tab.join_unknown_detail':
    'Menta no pudo confirmar si te uniste. Consulta Mis grupos antes de volver a intentarlo.',
  'groups.tab.join_unknown_action': 'Consulta Mis grupos',
  'groups.tab.create_solo': 'Crear una promesa individual',
  'groups.tab.enter_code_action': 'Introduce el código',
  'groups.tab.sign_in': 'Iniciar sesión',
  'groups.tab.my_groups': 'Mis grupos',
  'groups.tab.try_again': 'Intentar otra vez',
  'groups.tab.go_today': 'Ir a hoy',
  'groups.tab.back_groups': 'Volver a Grupos',
  'groups.tab.create_action': 'Crear grupo',
  'groups.tab.new': 'Nuevo',
  'groups.tab.joined_detail': '{group} ahora está en tus grupos.',
  'groups.tab.code_saved': 'El código {code} está guardado en este celular.',
  'groups.tab.join_action': 'Introduce un código de invitación',
  'groups.tab.offline_title': 'Estás desconectado',
  'groups.tab.offline_detail':
    'Estos son los últimos grupos guardados en este celular. Conéctese en línea antes de unirse, abandonar o cambiar un grupo.',
  'groups.tab.loading': 'Cargando tus grupos',
  'groups.tab.empty_title': 'Aún no hay grupos',
  'groups.tab.empty_detail': 'Crea un grupo o únete con una invitación.',
  'groups.tab.discover_empty_title': 'Sin grupos públicos',
  'groups.tab.discover_empty_detail':
    'Los grupos públicos aparecerán aquí cuando estén disponibles.',
  'groups.tab.list_open_hint': 'Abre el tablero del grupo.',
  'groups.tab.discover_open_hint':
    'Muestra los detalles del grupo. Unirse es una acción separada.',
  'groups.tab.discover_before_join':
    'Consulta las reglas de prueba y promesa compartida antes de unirse.',
  'groups.tab.known_group': 'Grupo conocido · acciones en pausa',
  'groups.list.your_groups': 'Tus grupos',
  'groups.list.public_groups': 'Grupos públicos',
  'groups.list.load_failed': 'Los grupos no se pudieron cargar',
  'groups.list.load_failed_detail':
    'Nada cambió. Inténtalo de nuevo cuando tu conexión sea estable.',
  'groups.list.ended': 'Grupo finalizado · registro final disponible',
  'groups.list.archived': 'Archivado · registro final disponible',
  'groups.list.streak': 'Racha de grupo de días {count}',
  'groups.list.view_before_joining': 'Ver {group} antes de unirse',

  'groups.archive.description':
    'Los grupos anteriores permanecen como de solo lectura.',
  'groups.archive.stale_detail':
    'Mostrando la última lista guardada. Verifica de nuevo cuando tu conexión sea estable.',
  'groups.archive.stale_title': 'Grupos archivados no actualizados',
  'groups.archive.groups': 'Grupos',
  'groups.archive.read_only': 'Solo lectura',
  'groups.archive.order': 'Orden',
  'groups.archive.recent': 'Reciente',
  'groups.archive.newest_first': 'Lo nuevo primero',
  'groups.archive.history': 'Historia',
  'groups.archive.open_hint':
    'Abre este grupo en el historial de solo lectura.',
  'groups.archive.open_label': 'Abrir grupo archivado {group}',
  'groups.archive.check_again': 'comprobar de nuevo',
  'groups.archive.loading': 'Cargando grupos archivados',
  'groups.archive.empty_label':
    'No hay grupos archivados. Los grupos que archives o finalices aparecerán aquí.',
  'groups.archive.empty_title': 'No hay grupos archivados',
  'groups.archive.empty_detail':
    'Los grupos que archives o finalices aparecerán aquí.',
  'groups.archive.load_failed': 'No se pudieron cargar los grupos archivados',

  'groups.create.public_label': 'Cualquiera puede encontrarlo',
  'groups.create.public_note':
    'El grupo aparece en Descubrir. La gente puede verlo y unirse sin preguntarte.',
  'groups.create.private_label': 'Solo las personas que invitas',
  'groups.create.private_note':
    'El grupo está oculto. Necesitas el enlace de invitación, el código QR o el código para entrar.',
  'groups.create.missing_id': 'Falta la identificación del grupo.',
  'groups.create.load_error': 'No se pudo cargar la configuración.',
  'groups.create.not_created_title': 'Grupo no creado',
  'groups.create.not_created_detail':
    'No se pudo crear el grupo. Inténtalo de nuevo.',
  'groups.create.name_prompt': '¿Cómo llamarás a este grupo?',
  'groups.create.name_help':
    'Usa al menos tres caracteres para que las personas sepan a qué se están uniendo.',
  'groups.create.settings_prompt': '¿Quién puede encontrar y unirse?',
  'groups.create.review_prompt': '¿Listo para crear este grupo?',
  'groups.create.choose_join': 'Elige quién puede unirse',
  'groups.create.review_group': 'revisión del grupo',
  'groups.create.create_group': 'Crear grupo',
  'groups.create.name_heading': 'Nombra el grupo',
  'groups.create.sign_in_title': 'Es necesario iniciar sesión',
  'groups.create.sign_in_detail':
    'Inicia sesión antes de crear un grupo. Tu borrador todavía está aquí.',
  'groups.create.promise_unavailable_title': 'Primera promesa no disponible',
  'groups.create.promise_unavailable_detail':
    'Menta no puede vincular este grupo sin la primera promesa confirmada. El borrador de tu grupo sigue aquí. Vuelve a Hoy e inténtalo de nuevo.',
  'groups.create.name_short_detail': 'Usa al menos tres caracteres.',
  'groups.create.default_description': 'Un grupo para tu primera promesa.',
  'groups.create.cost_unknown_title':
    'No se pudo confirmar el coste del grupo.',
  'groups.create.cost_unknown_detail':
    'Menta no creó el grupo ni gastó Momenta. Comprueba tu conexión y vuelve a intentarlo.',
  'groups.create.paused_title': 'Creación de grupo pausada',
  'groups.create.cooldown_detail':
    'Puedes crear otro grupo después de que finalice el periodo de espera actual.',
  'groups.create.last_group': 'tu ultimo grupo',
  'groups.create.cooldown_active.one':
    '{group} falló recientemente, por lo que la creación del grupo y las uniones se pausan durante {hours} una hora más. Mantén la secuencia de promesas en movimiento con una prueba en solitario mientras finaliza el periodo de espera del grupo.',
  'groups.create.cooldown_active.other':
    '{group} falló recientemente, por lo que la creación del grupo y las uniones se pausan durante {hours} horas más. Mantén la secuencia de promesas en movimiento con una prueba en solitario mientras finaliza el periodo de espera del grupo.',
  'groups.create.cooldown_active':
    '{group} falló recientemente, por lo que la creación de grupos y las uniones se pausan para {hours}. Mantén la secuencia de promesas en movimiento con una prueba en solitario mientras finaliza el periodo de espera del grupo.',
  'groups.create.limit_title': 'Límite gratuito alcanzado',
  'groups.create.limit_detail':
    'Tu borrador todavía está aquí. Inicia Pro o deja espacio antes de crear otro grupo.',
  'groups.create.momenta_title': 'Se necesita más Momenta',
  'groups.create.image': 'Imagen de grupo',
  'groups.create.image_accessibility': 'Imagen de grupo',
  'groups.create.group_name_label': 'Nombre del grupo *',
  'groups.create.group_name_accessibility': 'Nombre del grupo',
  'groups.create.group_name_placeholder': 'Movimiento diario',
  'groups.create.image_help':
    'Elige la imagen que la gente verá al lado de este grupo.',
  'groups.create.reminders_detail':
    'Permitir recordatorios de revisiones para este grupo. Los miembros aún controlan las notificaciones en tus celulares.',
  'groups.create.your_group': 'tu grupo',
  'groups.create.review_outcome':
    'Crear el grupo te convierte en tu primer miembro. Nadie más se une hasta que les envías una invitación y luego puedes cambiar el nombre y la configuración.',
  'groups.create.back_from_creation': 'Volver de la creación del grupo',
  'groups.create.step': 'Paso {current} de {total}',
  'groups.create.nothing_created': 'Aún no se ha creado nada.',
  'groups.create.add_then_invite':
    'Añade la primera promesa y luego invite a personas.',
  'groups.create.creating_detail':
    'Mantén esta pantalla abierta mientras Menta crea el grupo.',
  'groups.create.entries_saved': 'Tus entradas todavía están en esta pantalla.',
  'groups.create.review_reminders': 'Revisar recordatorios',
  'groups.create.who_can_join': '¿Quién puede unirse?',
  'groups.create.on': 'En',
  'groups.create.off': 'Apagado',
  'groups.create.creation_cost': 'Coste de creación',
  'groups.create.checking_cost': 'Comprobando el coste actual...',
  'groups.create.free': 'Gratis',
  'groups.create.draft_saved': 'Borrador guardado en este celular',
  'groups.create.restoring_draft': 'Restaurando el borrador de tu grupo',
  'groups.create.creating': 'Creando {group}',
  'groups.create.creating_button': 'Creando…',
  'groups.create.try_again': 'Intentar otra vez',
  'groups.create.invite_people': 'invitar gente',
  'groups.create.add_promise': 'Añadir la primera promesa',
  'groups.create.open_group': 'grupo',
  'groups.create.go_today': 'Ir a hoy',
  'groups.create.back': 'Atrás',
  'groups.create.exit_setup': 'Salir de la configuración',
  'groups.create.restoring_button': 'Restaurando borrador…',
  'groups.create.creating_label': 'Creando grupo',
  'groups.create.review_change': 'Cambiar',
  'groups.create.checking_limits': 'Comprobando los límites del grupo',
  'groups.create.limits_detail':
    'Tu borrador permanece en este celular mientras finaliza esta verificación.',
  'groups.create.created_title': '{group} está listo.',
  'groups.create.created_detail':
    'El grupo se ha guardado. No se han enviado invitaciones.',
  'groups.create.days': '{count} días',
  'groups.create.days.one': '{count} día',
  'groups.create.days.other': '{count} días',
  'groups.create.group_details': 'Detalles del grupo',
  'groups.create.membership': 'Pertenencia',
  'groups.create.membership_value': 'Privado hasta que alguien se una',
  'groups.create.invitations': 'Invitaciones',
  'groups.create.invitations_value': 'Listo para compartir',
  'groups.create.first_promise': 'Primera promesa',
  'groups.create.first_promise_value': 'Aún no añadido',
  'groups.create.starting_point': 'Punto de partida',
  'groups.create.choose_start': 'Elige un punto de partida',
  'groups.create.choose_start_detail':
    'Usa un punto de partida sencillo o empieza con un grupo en blanco.',
  'groups.create.blank_group': 'Empieza con un grupo en blanco',
  'groups.create.change_start': 'Cambiar punto de partida',
  'groups.create.change': 'Cambiar',
  'groups.create.walking': 'Caminar o hacer ejercicio',
  'groups.create.walking_detail':
    'Una caminata diaria, una sesión de ejercicio, estiramiento o deporte.',
  'groups.create.study': 'Estudiar',
  'groups.create.study_detail': 'Una sesión de estudio enfocado cada día.',
  'groups.create.creative': 'Trabajo creativo',
  'groups.create.creative_detail':
    'Veinte minutos de escritura, dibujo, música o creación.',
  'groups.create.reset': 'Reiniciar',
  'groups.create.reset_detail': 'Descanso, reflexión y rutinas tranquilas.',
  'groups.create.cooldown_detail_group':
    'Puedes crear otro grupo después de que finalice el periodo de espera de {group}.',
  'groups.create.momenta_detail':
    'Este grupo cuesta {cost} Momenta y tu saldo es {balance}. Tu borrador todavía está aquí.',
  'groups.create.spend_question': '¿Gastar {cost} Momenta?',
  'groups.create.spend_detail':
    'La creación de este grupo cuesta {cost} Momenta y deja {balance} en tu saldo.',
  'groups.create.spend_accessibility':
    'Confirmar gasto {cost} Momenta. Tu saldo será {balance} Momenta.',
  'groups.create.created_accessibility': 'Grupo creado. {group} está listo.',
  'groups.create.ready': '{group} está listo',
  'groups.create.change_label': 'Cambiar {label}',
  'groups.create.promise_not_linkable':
    'Tu promesa original no puede convertirse en la promesa de este grupo porque ya comenzó o cambió. El borrador de tu grupo todavía está aquí. Puedes regresar más tarde y crear explícitamente un grupo vacío.',
  'groups.create.group_already_confirmed':
    'Este grupo de incorporación ya fue confirmado con diferentes detalles. Abre el grupo confirmado en lugar de crear otro.',
  'groups.create.first_group_unavailable':
    'Este grupo de primera promesa solo está disponible antes de crear otro grupo. El borrador de tu grupo todavía está aquí. Puedes regresar más tarde y crear explícitamente un grupo vacío.',
  'groups.create.insufficient_momenta':
    'No tienes suficiente Momenta para crear este grupo.',
  'groups.create.link_failed':
    'Menta no pudo confirmar el grupo y la primera promesa juntos. El borrador de tu grupo todavía está aquí. Intentar otra vez.',
  'groups.create.image_move_label': 'Mover',
  'groups.create.image_focus_label': 'Enfocar',
  'groups.create.image_reset_label': 'Reiniciar',
  'groups.create.image_create_label': 'Crear',

  'groups.join.promise_title': 'Únete a la promesa',
  'groups.join.back': 'Atrás',
  'groups.join.loading_title': 'Comprobando los detalles de la unión',
  'groups.join.loading_detail':
    'Estamos verificando esta promesa y tu saldo actual de Momenta.',
  'groups.join.loading_action': 'Comprobando detalles',
  'groups.join.loading_accessibility':
    'Verificar el coste actual de inscripción y el saldo de la billetera',
  'groups.join.review_detail':
    'Revisa el coste y tu saldo. Nada cambia hasta que te unes.',
  'groups.join.review_title': '¿Únete a {name}?',
  'groups.join.momenta_value': '{amount} Momentas',
  'groups.join.confirmed_title': 'Estás en {name}.',
  'groups.join.confirmed_detail':
    'Tu saldo de Momenta está actualizado. Tu primera prueba está lista en este {destination}.',
  'groups.join.debit': '−{amount}',
  'groups.join.confirm': 'Únete a {cost} Momenta',
  'groups.join.maybe_later': 'tal vez más tarde',
  'groups.join.cost': 'Coste de inscripción',
  'groups.join.available': 'Disponible ahora',
  'groups.join.need_more_title': 'Necesitas {shortfall} más Momenta',
  'groups.join.need_more_detail': 'No se te ha cobrado y aún no te has unido.',
  'groups.join.earn': 'Ver formas de ganar',
  'groups.join.back_today': 'Volver a hoy',
  'groups.join.not_reserved_title': 'Tu lugar aún no está reservado',
  'groups.join.not_reserved_detail':
    'Gana más Momenta y luego regresa aquí para unirte.',
  'groups.join.receipt_label': 'Unirse al recibo',
  'groups.join.membership': 'Pertenencia',
  'groups.join.joined': 'Unido',
  'groups.join.momenta': 'momentos',
  'groups.join.new_balance': 'Nuevo equilibrio · {balance}',
  'groups.join.no_charge': 'Sin cargo',
  'groups.join.first_proof': 'Primera prueba',
  'groups.join.open_group': 'grupo',
  'groups.join.open_promise': 'promesa abierta',
  'groups.join.check_status_title': 'Necesitamos verificar si te uniste',
  'groups.join.check_status_detail':
    'La última solicitud terminó antes de que Menta recibiera un recibo. No volveremos a unirnos hasta que se comprueba la pertenencia y el saldo.',
  'groups.join.check_status': 'Verificar estado de unión',
  'groups.join.return_today': 'Volver a hoy',
  'groups.join.second_paused_title': 'Una segunda unión está en pausa',
  'groups.join.second_paused_detail':
    'Verificar el resultado existente evita una membresía o cargo duplicado.',
  'groups.join.failed_title': 'No se pudo confirmar la unión.',
  'groups.join.failed_detail':
    'No se confirma ninguna membresía ni cargo de Momenta.',
  'groups.join.no_change': 'Ningún cambio confirmado',
  'groups.join.already_title': 'Ya estás en esta promesa.',
  'groups.join.back_action': 'Atrás',
  'groups.join.boundary':
    'Tu membresía y tu saldo de Momenta permanecen sin cambios hasta que Menta confirme la inscripción.',
  'groups.join.sign_in_before': 'Inicia sesión antes de unirte.',
  'groups.join.no_debit':
    'No se ha ejecutado ninguna membresía ni débito de Momenta.',
  'groups.join.incomplete': 'Este enlace para unirse está incompleto.',
  'groups.join.open_current':
    'Abre una promesa actual o solicita un nuevo enlace de invitación.',

  'groups.invite.title': 'invitar gente',
  'groups.invite.back_group': 'Volver al grupo',
  'groups.invite.loading': 'Cargando invitación activa',
  'groups.invite.missing_group':
    'A esta invitación le falta el grupo. Vuelve al grupo y vuelve a intentarlo.',
  'groups.invite.load_error':
    'Menta no pudo cargar esta invitación. Comprueba tu conexión y vuelve a intentarlo.',
  'groups.invite.copy_link': 'Copiar enlace de invitación',
  'groups.invite.copy_code': 'Copiar código de invitación',
  'groups.invite.copied': 'copiado',
  'groups.invite.link_copied': 'Enlace de invitación copiado.',
  'groups.invite.code_copied': 'Código de invitación copiado.',
  'groups.invite.copy_error':
    'La invitación no se ha copiado. Inténtalo de nuevo.',
  'groups.invite.share': 'Compartir invitación',
  'groups.invite.share_closed':
    'La invitación sigue aquí si necesitas enviarla o copiarla de nuevo.',
  'groups.invite.share_error':
    'La menú para compartir no se abrió. Intentar otra vez.',
  'groups.invite.replace': 'Reemplazar código de invitación',
  'groups.invite.replace_loading': 'Reemplazo…',
  'groups.invite.keep': 'Mantener la invitación actual',
  'groups.invite.new_share': 'Compartir nueva invitación',
  'groups.invite.replace_question': '¿Reemplazar esta invitación?',
  'groups.invite.current_code': 'código actual',
  'groups.invite.stops_working': 'Dejará de funcionar',
  'groups.invite.not_replaced': 'Invitación no reemplazada',
  'groups.invite.new_ready': 'Nueva invitación lista',
  'groups.invite.active_code': 'código activo',
  'groups.invite.active': 'Activo',
  'groups.invite.show_qr': 'Mostrar código QR',
  'groups.invite.hide_qr': 'Ocultar código QR',
  'groups.invite.show_qr_detail':
    'Abre un código ampliado para que alguien cercano lo escanea.',
  'groups.invite.replace_detail': 'La invitación actual dejará de funcionar.',
  'groups.invite.try_again': 'Intentar otra vez',
  'groups.invite.back': 'Atrás',
  'groups.invite.load_failed': 'La invitación no se cargó',
  'groups.invite.action_failed': 'La acción de invitación falló',
  'groups.invite.invite_to': 'Invitar personas a {group}',
  'groups.invite.intro':
    'Deja que alguien escanea el código QR o envía el enlace de invitación. Pueden ver el grupo antes de unirse.',
  'groups.invite.show_qr_full':
    'Mostrar invitación QR en pantalla completa. Invitar {code}',
  'groups.invite.active_detail':
    'Activo ahora. Cualquiera que tenga esta invitación puede ver el grupo antes de unirse.',
  'groups.invite.qr_title': 'Invitar QR',
  'groups.invite.qr_heading': 'Escanea para ver el grupo',
  'groups.invite.qr_detail':
    'Al escanear se abren los detalles del grupo. No se une al grupo.',
  'groups.invite.share_qr': 'Compartir QR',
  'groups.invite.qr_label':
    'Código QR de invitación grupal para invitación {code}',
  'groups.invite.no_code': 'No se proporcionó ningún código de invitación.',
  'groups.invite.group_invite': 'invitación grupal',
  'groups.invite.share_title': 'Invitar personas a {group}',
  'groups.invite.share_returned': 'Invitar listo para compartir',
  'groups.invite.replaced_accessibility':
    'Nueva invitación lista. La invitación anterior ya no funciona.',
  'groups.invite.replace_error':
    'Menta no pudo confirmar una nueva invitación. Verifica el código actual antes de compartirlo.',
  'groups.invite.replace_warning':
    'El enlace actual, el código QR y el código dejarán de funcionar. Las personas que ya se unieron permanecen en el grupo.',
  'groups.invite.replaced_detail':
    'La invitación anterior ya no funciona. Comparte este código a partir de ahora.',

  'groups.preview.close': 'Cerrar',
  'groups.preview.details_label': 'Detalles del grupo {group}',
  'groups.preview.public': 'Público',
  'groups.preview.private': 'Sólo invitación',
  'groups.preview.group': 'grupo',
  'groups.preview.no_description': 'No se ha añadido ninguna descripción.',
  'groups.preview.people': 'Gente',
  'groups.preview.active_promises': 'Promesas activas',
  'groups.preview.available_after_joining': 'Disponible después de unirse',
  'groups.preview.current_streak': 'Racha actual',
  'groups.preview.no_streak': 'Aún no hay racha',
  'groups.preview.joining': 'Unión...',
  'groups.preview.join': 'Unirse al grupo',
  'groups.preview.join_hint':
    'Únete a este grupo para participar en tus promesas compartidas.',
  'groups.preview.view_board': 'Ver tablero',
  'groups.preview.view_board_hint':
    'Consulta las promesas del grupo y los miembros antes de unirte.',
  'groups.preview.member': '{count} miembros',
  'groups.preview.member.one': '{count} miembro',
  'groups.preview.member.other': '{count} miembros',
  'groups.preview.promise': '{count} promesas',
  'groups.preview.promise.one': '{count} promesa',
  'groups.preview.promise.other': '{count} promesas',
  'groups.preview.day': '{count} días',
  'groups.preview.day.one': '{count} día',
  'groups.preview.day.other': '{count} días',

  'groups.admin.back': 'Volver',
  'groups.admin.summary': 'Resumen del grupo',
  'groups.admin.details': 'Detalles',
  'groups.admin.visibility': 'Visibilidad',
  'groups.admin.discoverable': 'Descubrible',
  'groups.admin.code_required': 'Código requerido',
  'groups.admin.people': 'Gente',
  'groups.admin.your_role': 'Tu papel',
  'groups.admin.guest': 'Invitado',
  'groups.admin.who_join': '¿Quién puede unirse?',
  'groups.admin.selected': 'Seleccionado',
  'groups.admin.review_reminders': 'Revisar recordatorios',
  'groups.admin.reminders_detail':
    'Los miembros deben permitir las notificaciones en tu celular.',
  'groups.admin.reminders_allowed': 'Recordatorios de revisiones permitidos',
  'groups.admin.invitations': 'Invitaciones',
  'groups.admin.manage_invite': 'Administrar invitación',
  'groups.admin.manage_invite_detail':
    'Comparte o reemplaza la invitación actual.',
  'groups.admin.members': 'Miembros',
  'groups.admin.members_detail': 'Ver roles y acceso de los miembros.',
  'groups.admin.people_count': '{count} personas',
  'groups.admin.open': 'Abierto',
  'groups.admin.group_missing_detail':
    'Este grupo ya no está disponible en la lista actual.',
  'groups.admin.group_not_found': 'Grupo no encontrado',
  'groups.admin.settings_permission_detail':
    'Sólo los propietarios y administradores pueden gestionar esta configuración de grupo.',
  'groups.admin.settings_unavailable': 'Ajustes no disponibles',
  'groups.admin.group': 'Grupo',
  'groups.admin.ownership': 'Propiedad del grupo',
  'groups.admin.leave': 'Dejar grupo',
  'groups.admin.remove_account_detail': 'Elimina tu cuenta de este grupo.',
  'groups.admin.transfer_unavailable':
    'Menta aún no puede transferir la propiedad del grupo.',
  'groups.admin.delete': 'Eliminar grupo',
  'groups.admin.delete_detail':
    'Eliminar permanentemente este grupo después de la confirmación.',
  'groups.admin.description':
    'Gestionar el acceso, las invitaciones y la pertenencia.',
  'groups.admin.save': 'Guardar cambios',
  'groups.admin.saving': 'Ahorro…',
  'groups.admin.settings': 'Ajustes de grupo',
  'groups.admin.delete_question': '¿Eliminar grupo?',
  'groups.admin.delete_warning':
    'Esto elimina permanentemente el grupo, tus promesas compartidas, tu historial de pruebas y el acceso de miembros para todos. Mantén esta pantalla abierta hasta que Menta confirme el resultado.',
  'groups.admin.members_description':
    'Mira quién pertenece a este grupo y qué rol tiene cada persona.',
  'groups.admin.members_manage_description':
    'Invita a personas o cambia los roles de los miembros.',
  'groups.admin.access': 'Acceso',
  'groups.admin.manage': 'Administrar',
  'groups.admin.view_only': 'Ver sólo',
  'groups.admin.invite_empty_detail':
    'Envía la invitación primero. Los roles de los miembros aparecerán aquí una vez que alguien se una.',
  'groups.admin.no_members': 'Aún no hay miembros',
  'groups.admin.owner': 'Dueño',
  'groups.admin.admins': 'Administradores',
  'groups.admin.member': 'Miembro',
  'groups.admin.report': 'Miembro del informe',
  'groups.admin.make_admin': 'Hacer administrador',
  'groups.admin.remove_admin': 'Quitar rol de administrador',
  'groups.admin.remove_member': 'Eliminar miembro',
  'groups.admin.manage_member': 'Administrar {member}',
  'groups.admin.view_member': 'Ver {member}',
  'groups.admin.member_hint': 'Abre acciones de miembros.',
  'groups.admin.member_readonly_hint': 'Detalles de miembro de solo lectura.',
  'groups.admin.locked': 'bloqueado',
  'groups.admin.updating': 'Actualizando',
  'groups.admin.loading_members': 'Cargando miembros',
  'groups.admin.loading_settings': 'Cargando configuración de grupo',
  'groups.admin.load_members_error':
    'No se pudieron cargar los miembros del grupo.',
  'groups.admin.members_load_failed': 'Los miembros no pudieron cargar',
  'groups.admin.invite_people': 'invitar gente',
  'groups.admin.member_actions_hint':
    'Abre informes. Los administradores de grupo también ven acciones de función y eliminación.',
  'groups.admin.open_member_actions': 'Acciones abiertas para {member}',
  'groups.board.you': 'Tú',
  'groups.board.member_status_accessibility': '{name}. {status}. {detail}',
  'groups.board.review_member': 'Revise la prueba de {member}',
  'groups.board.submit_proof': 'Envía tu prueba',
  'groups.board.loading': 'Cargando tablero de grupo',
  'groups.board.no_review': 'No es necesario revisar las pruebas',
  'groups.board.review_one': '1 prueba necesita revisión',
  'groups.board.review_many': 'Las pruebas {count} necesitan revisión',
  'groups.board.nothing_waiting':
    'No hay nada esperando revisión en este momento.',
  'groups.board.check_one':
    'Compruébalo antes de que el resultado del grupo de hoy sea definitivo.',
  'groups.board.check_many':
    'Compruébalos antes de que el resultado del grupo de hoy sea definitivo.',
  'groups.board.review_proof': 'Prueba de revisión',
  'groups.board.review_proofs': 'Revisar pruebas',
  'groups.board.proof_due': 'Prueba entregada hoy',
  'groups.board.add_proof_deadline': 'Añade tu prueba antes de {deadline}.',
  'groups.board.daily_deadline': 'la fecha límite diaria',
  'groups.board.add_proof': 'Añadir prueba',
  'groups.board.actions': 'Acciones grupales',
  'groups.board.promises': 'Promesas',
  'groups.board.shared_promise': 'Promesa compartida',
  'groups.board.open_rule': 'Abre la regla de prueba de hoy.',
  'groups.board.live': 'Vivir',
  'groups.board.today': 'Hoy',
  'groups.board.approved_today': 'Aprobado hoy',
  'groups.board.approved_count': '{completed} de {total} aprobado',
  'groups.board.added_proof_count': '{count} de {total} agregaron una prueba',
  'groups.board.today_board': 'tablero de hoy',
  'groups.board.public_group': 'grupo publico',
  'groups.board.member_count': 'Miembros de {count}',
  'groups.board.shared_promise_label': 'Promesa compartida',
  'groups.board.default_promise': 'Preséntese y comparta pruebas',
  'groups.board.join_before_detail':
    'Abre el grupo para ver la promesa activa antes de unirse.',
  'groups.board.join_cost': 'Coste de inscripción',
  'groups.board.return_groups': 'Volver a grupos',
  'groups.board.read_only': 'Sólo lectura',
  'groups.board.final_promise': 'Promesa final',
  'groups.board.final_rule':
    'La regla de prueba final se conserva como referencia.',
  'groups.board.proof_history': 'Historial de pruebas',
  'groups.board.promise_rules': 'reglas de promesa',
  'groups.board.saved_board': 'Mostrando el tablero del grupo guardado',
  'groups.board.saved_status': 'Estado guardado',
  'groups.board.saved_approved':
    'Las pruebas {completed} de {total} fueron aprobadas en el tablero guardado.',
  'groups.board.saved_proof_missing':
    'El estado de prueba de hoy no se guardó en este celular.',
  'groups.board.stale_detail':
    'Verifica de nuevo antes de unirse, salir, enviar pruebas o revisarlas.',
  'groups.board.stale_notice':
    '{updated}. Verifica de nuevo antes de unirse, salir, enviar pruebas o revisarlas.',
  'groups.board.stale_footnote':
    'Aún puedes leer el historial guardado. Conéctese e inténtalo de nuevo antes de cambiar de membresía, enviar pruebas, revisar pruebas o enviar un recordatorio.',
  'groups.board.permission_title': 'No tienes acceso a este grupo',
  'groups.board.offline_title': 'Este grupo no está disponible sin conexión',
  'groups.board.unavailable_title': 'Este grupo no está disponible',
  'groups.board.permission_detail':
    'Tu cuenta no tiene permiso para leer este grupo. Pídele a un propietario una invitación actual.',
  'groups.board.offline_detail':
    'No hay ningún tablero guardado para mostrar. Vuelve a conectarte y luego prueba con el grupo en vivo de nuevo.',
  'groups.board.unavailable_detail':
    'Es posible que se haya eliminado, archivado o hecho privado.',
  'groups.board.go_groups': 'Ir a grupos',
  'groups.board.enter_code': 'Introduce otro código',
  'groups.detail.opening': 'Apertura del tablero del grupo',
  'groups.detail.opening_detail':
    'Verificación de miembros, promesas compartidas y estado de revisión de hoy.',
  'groups.detail.promises': 'Promesas',
  'groups.detail.reviews': 'Reseñas',
  'groups.detail.window': 'Ventana',
  'groups.detail.preparing_promises':
    'Preparando el carril de promesa compartido.',
  'groups.detail.checking_members':
    'Comprobar quién puede presentar y revisar pruebas.',
  'groups.detail.load_failed': 'El grupo no se pudo cargar.',
  'groups.detail.unavailable': 'Grupo no disponible',
  'groups.detail.unavailable_detail':
    'Este grupo puede estar archivado, ser privado o no estar disponible temporalmente.',
  'groups.detail.what_you_can_do': 'que puedes hacer',
  'groups.detail.what_you_can_do_detail':
    'Inténtalo de nuevo, vuelve a Grupos o pídele al propietario del grupo una nueva invitación.',
  'groups.admin.discard_question': '¿Descartar cambios?',
  'groups.admin.discard_detail': 'Tus ediciones no se han guardado.',
  'groups.admin.keep_editing': 'Sigue editando',
  'groups.admin.discard': 'Descartar cambios',
  'groups.admin.cannot_leave': 'No puedes abandonar este grupo todavía',
  'groups.admin.leave_question': '¿Dejar el grupo?',
  'groups.admin.transfer_warning':
    'Menta aún no puede transferir la propiedad del grupo. Puedes conservar el grupo o eliminarlo permanentemente. Nada cambia hasta que eliges una acción.',
  'groups.admin.leave_detail':
    'Tu cuenta permanece en el grupo hasta que se confirme tu salida.',
  'groups.admin.close': 'Cerrar',
  'groups.admin.cancel': 'Cancelar',
  'groups.admin.check_members': 'Verifica la lista de miembros de nuevo',
  'groups.admin.current_role': 'Función actual: {role}',
  'groups.admin.promote_question': '¿Hacer administrador?',
  'groups.admin.demote_question': '¿Eliminar la función de administrador?',
  'groups.admin.promote_detail':
    '{member} podrá ayudar a administrar los miembros.',
  'groups.admin.demote_detail':
    '{member} volverá al acceso normal para miembros.',
  'groups.admin.remove_question': '¿Quitar miembro?',
  'groups.admin.remove_warning':
    '{member} perderá el acceso al grupo. Las pruebas anteriores permanecen en el historial del grupo, pero no pueden enviar ni revisar nuevas promesas del grupo.',

  'groups.empty.shared_title': 'Aún no hay promesas compartidas',
  'groups.empty.shared_detail':
    'Añade la primera promesa para que todos sepan qué hacer y qué pruebas cuentan.',
  'groups.empty.add_promise': 'Añadir la primera promesa',
  'groups.empty.invite_people': 'invitar gente',
  'groups.empty.shared_note':
    'No se debe pagar nada hasta que se cumpla la primera promesa.',
  'groups.join.open_camera': 'cámara abierta',
  'groups.join.scan_detail': 'Escanea un código QR de invitación grupal.',
  'groups.join.enter_code_instead':
    'Introduce el código de invitación en tu lugar',
  'groups.join.code_required': 'Código de invitación *',
  'groups.join.code_accessibility': 'código de invitación',
  'groups.join.code_placeholder': 'CAMINATA-7K2',
  'groups.join.code_placeholder_long': 'ABCD2345',
  'groups.join.link_or_code': 'Enlace o código de invitación',
  'groups.join.find_invite': 'encontrar invitación',
  'groups.join.paste_clipboard': 'Pegar desde el portapapeles',
  'groups.join.checking_invite': 'Comprobando invitación de grupo',
  'groups.join.not_now': 'Ahora no',
  'groups.join.joining_long': 'Unión…',
  'groups.join.continue_sign_in': 'Continuar iniciando sesión',
  'groups.join.retry_preview': 'Reintentar vista previa',
  'groups.join.how_it_works': 'como funciona',
  'groups.join.group_invite': 'invitación grupal',
  'groups.join.shared_promise': 'Promesa compartida',
  'groups.join.close_scanner': 'Cerrar el escáner de invitaciones',
  'groups.join.code_helper':
    'Pega el código de tu mensaje de invitación o cartel grupal.',
  'groups.join.scan_mode_detail':
    'Abre la cámara solo cuando alguien te esté mostrando el QR de invitación.',
  'groups.join.scan_prompt':
    'Apunte tu celular al cartel de invitación o al código QR.',
  'groups.join.preview_intro':
    'Al entrar un código solo se obtiene una vista previa del grupo.',
  'groups.join.preview_free':
    'Unirte por primera vez es gratis, ya sea a una promesa o a un grupo. Verás cualquier costo antes de confirmar.',
  'groups.join.preview_paid':
    'Unirse cuesta {cost} Momenta. Tu código se utiliza sólo después de que el grupo te acepte.',
  'groups.join.preview_unknown':
    'Tu código se utiliza sólo después de que el grupo te acepte. Si unirse a Momenta cuesta, verá el monto antes de gastar nada.',
  'groups.join.preview_free_membership': 'Unirte aquí es gratis.',
  'groups.join.preview_paid_detail':
    'Unirse cuesta {cost} Momenta. La vista previa no te ha cobrado.',
  'groups.join.preview_unchanged':
    'Unirse te agrega a este grupo. La vista previa no ha cambiado nada.',
  'groups.join.scan_qr': 'Escanear QR',
  'groups.join.scan_qr_accessibility': 'Escanear invitación QR',
  'groups.join.paste_code': 'Pegar código',
  'groups.join.paste_accessibility': 'Pegar código de invitación',
  'groups.join.sign_in': 'Inicia sesión para unirte',
  'groups.join.joining': 'Unión...',
  'groups.join.screen_subtitle':
    'Pega un enlace o introduce un código. Verás el grupo antes de unirte.',
  'groups.join.join_group': 'Unirse al grupo',
  'groups.join.details_toggle_show': 'Muestra lo que sucede después de unirte',
  'groups.join.details_toggle_hide': 'Ocultar lo que sucede después de unirse',
  'groups.join.details_toggle': '¿Qué pasa cuando me uno?',
  'groups.join.details':
    'Verá las promesas del grupo, enviará pruebas cuando sea necesario realizar el seguimiento y revisará otras pruebas cuando sea necesario. Un seguimiento cuenta después de que un miembro acepta la prueba. Las pruebas, las rachas y las revisiones quedan ligadas al grupo.',
  'groups.join.receipt.already': 'Ya eres miembro',
  'groups.join.receipt.joined': 'grupo unido',
  'groups.join.receipt.already_title': 'Ya estás en este grupo.',
  'groups.join.receipt.joined_title': 'Estás en {group}.',
  'groups.join.receipt.group_fallback': 'el grupo',
  'groups.join.receipt.already_detail':
    'No se gastó ningún Momenta. Abre el tablero del grupo para seguir registrándose.',
  'groups.join.receipt.free_detail':
    'Te uniste gratis. Abre el grupo para ver sus promesas.',
  'groups.join.receipt.spent_detail':
    'Pasaste {cost} Momenta. Abre el grupo para ver las promesas y el primer seguimiento.',
  'groups.join.receipt.spent_label': 'Momenta gastado',
  'groups.join.receipt.zero': '0 momentos',
  'groups.join.receipt.spent_value': '{cost} Momentas',
  'groups.join.receipt.next_move': 'Tu próximo movimiento',
  'groups.join.receipt.view_group': 'Ver grupo',
  'groups.join.receipt.view_groups': 'Ver grupos',
  'groups.join.receipt.use_another': 'usa otro codigo',
  'groups.join.receipt.join_another': 'Únete a otro grupo',
  'groups.join.show_momenta': 'Mostrar opciones de Momenta',
  'groups.join.see_pro': 'Ver planes Pro',
  'groups.join.sign_in_now': 'Iniciar sesión ahora',
  'groups.join.try_another': 'Prueba con otro código',
  'groups.join.momenta_needed': 'Momenta necesario',
  'groups.join.cost_missing':
    'El coste de unirse no se cargó. Vuelve a la invitación y comprueba de nuevo antes de unirse.',
  'groups.join.watch_ad': 'Ver anuncio de Momenta',
  'groups.join.see_pro_options': 'Ver opciones profesionales',
  'groups.join.cost_needed':
    'Unirse cuesta {cost} Momenta. Agrega suficiente Momenta y luego regresa a esta invitación.',
  'groups.join.promise_invite_found': 'Invitación prometida encontrada',
  'groups.join.promise_invite_detail':
    'Esta invitación es para una promesa, no para un grupo. Menta lo guardó para que la aplicación pueda abrirlo después de iniciar sesión.',
  'groups.join.promise_invite_title': 'Esta es una invitación de promesa.',
  'groups.join.promise_invite_saved':
    'Menta lo guardó para el flujo de promesa. No se ha ejecutado ninguna unión al grupo.',
  'groups.join.invalid_title': 'Ese código de invitación no se reconoce.',
  'groups.join.enter_code_title': 'Introduce un código de invitación',
  'groups.join.invalid_detail':
    'Verifica el código e inténtalo de nuevo. Nada ha cambiado.',
  'groups.join.enter_code_detail':
    'Pega el enlace o código de la invitación del grupo.',
  'groups.join.expired_title': 'Esta invitación ha caducado',
  'groups.join.expired_detail':
    'Pídele al propietario del grupo una nueva invitación.',
  'groups.join.replaced_title': 'Esta invitación fue reemplazada',
  'groups.join.replaced_detail':
    'Pídele al propietario del grupo tu enlace o código más reciente.',
  'groups.join.inactive_title': 'Este grupo ya no está activo.',
  'groups.join.inactive_detail': 'Ninguna membresía o Momenta cambió.',
  'groups.join.invalid_invite_detail':
    'Consulta el código o solicita una nueva invitación.',
  'groups.join.sign_in_title': 'Inicia sesión para continuar',
  'groups.join.sign_in_detail':
    'Vuelve a esta invitación después de iniciar sesión.',
  'groups.join.preview_unavailable_title':
    'Vista previa de invitación no disponible',
  'groups.join.preview_unavailable_detail':
    'Menta no pudo comprobar esta invitación. Nada ha cambiado, por lo que es seguro volver a intentarlo cuando esté en línea.',
  'groups.join.unavailable_title': 'Esta invitación no está disponible',
  'groups.join.unavailable_detail':
    'Pregúntale al propietario del grupo tu invitación de grupo actual.',
  'groups.join.qr_invalid_title': 'QR no incluía una invitación grupal',
  'groups.join.qr_invalid_detail':
    'Escanea un QR de invitación de grupo Menta o introduce el código manualmente.',
  'groups.join.missing_code_title': 'código faltante',
  'groups.join.missing_code_detail':
    'Introduce un código de invitación o escanea una invitación QR para continuar.',
  'groups.join.invalid_code_title':
    'Ese código no coincide con ninguna invitación.',
  'groups.join.invalid_code_detail':
    'Vuelve a verificar el código o escanea el QR de nuevo.',
  'groups.join.preview_first_title':
    'Primero, obtenga una vista previa de esta invitación',
  'groups.join.preview_first_detail':
    'Menta no se ha sumado ni ha cambiado nada.',
  'groups.join.quota_title': 'Estás en el límite del grupo gratuito',
  'groups.join.quota_detail':
    'Las cuentas gratuitas pueden estar en 2 grupos activos. Deja uno o inicia Pro para unirte a este grupo.',
  'groups.join.momenta_detail':
    'Unirse cuesta {cost} Momenta y tu saldo es {balance}. Gana una recompensa rápida o usa Pro y luego regresa directamente a esta invitación.',
  'groups.join.join_group_title': 'Únete a un grupo',
  'groups.join.invited_you': '{inviter} te invitó',
  'groups.join.invited_by': 'Invitado por {inviter}',
  'groups.join.how_it_works_detail':
    'Los miembros publican pruebas. Otro miembro elegible lo revisa.',
  'groups.join.already_member_detail':
    'Ya estás en este grupo. No se ejecutará ninguna segunda unión.',
  'groups.join.inviter_invite': 'Invitación de {inviter}',
  'groups.join.outcome_stale_title': 'Esta invitación ya no está activa',
  'groups.join.outcome_stale_detail':
    'Pídele al propietario del grupo un código nuevo. No se gastó ningún Momenta en esta invitación.',
  'groups.join.outcome_sign_in_title': 'Inicia sesión para continuar',
  'groups.join.outcome_sign_in_detail':
    'Tu invitación puede permanecer lista mientras inicias sesión y luego puedes volver a intentarlo.',
  'groups.join.outcome_momenta_title': 'Momenta necesario',
  'groups.join.outcome_momenta_detail':
    'Gana una recompensa rápida o usa Pro y luego regresa directamente a esta invitación.',
  'groups.join.outcome_quota_title': 'Estás en el límite del grupo gratuito',
  'groups.join.outcome_quota_detail':
    'Las cuentas gratuitas pueden estar en 2 grupos activos. Deja uno o inicia Pro para unirte a este grupo.',
  'groups.join.outcome_closed_title': 'Grupo cerrado',
  'groups.join.outcome_closed_detail':
    'Este grupo ya no está activo. Consulta con el propietario o explora otros grupos.',
  'groups.join.outcome_retry_title': 'Unirse no confirmado',
  'groups.join.outcome_retry_detail':
    'Menta aún no pudo confirmar tu lugar. Tu código todavía está aquí, así que inténtalo de nuevo cuando recupere la conexión.',

  'groups.referral.title': 'Déjalos escanear para unirse',
  'groups.referral.body':
    'Pídeles que escaneen este código. Abre tu enlace de referencia.',
  'groups.referral.qr_label':
    'Código QR de invitación de referencia. Escanea para abrir el enlace de invitación.',
  'groups.referral.qr_unavailable':
    'Código QR no disponible. Aún puedes probar las opciones para compartir o copiar a continuación.',
  'groups.referral.qr_preparing': 'Preparando tu código QR…',
  'groups.redirect.title': 'Unirse',
  'groups.redirect.invite_code': 'código de invitación',
  'groups.redirect.promise_saved': 'Invitación de promesa guardada',
  'groups.redirect.promise_subtitle':
    'Comprobando el enlace de promesa y tu estado de inicio de sesión.',
  'groups.redirect.invite_saved': 'Invitación guardada',
  'groups.redirect.promise_detail':
    'La siguiente pantalla mostrará el coste de inscripción actual antes de que algo cambie.',
  'groups.redirect.group_opening': 'Invitación al grupo de apertura',
  'groups.redirect.group_subtitle':
    'Verificar la invitación al grupo y tu inicio de sesión.',
  'groups.redirect.group_found': 'Invitación de grupo encontrada',
  'groups.redirect.group_detail':
    'Puedes ver el grupo antes de decidir si te unes.',
  'groups.redirect.needs_code': 'El enlace de invitación necesita un código.',
  'groups.redirect.needs_code_subtitle':
    'Este enlace de invitación no incluía un código de grupo o de promesa.',
  'groups.redirect.missing_code': 'Falta el código de invitación',
  'groups.redirect.missing_code_detail':
    'Solicita un nuevo enlace de invitación o introduce un código de grupo manualmente.',
  'groups.redirect.opening': 'Invitación de apertura',
  'groups.redirect.opening_subtitle':
    'Comprobando el enlace de invitación y tu estado de inicio de sesión.',
  'groups.redirect.one_moment': 'Un momento',
  'groups.redirect.checking': 'Menta está comprobando el código de invitación.',
  'groups.redirect.enter_group_code': 'Introduce el código del grupo',
  'groups.redirect.without_invite': 'Continuar sin invitación',
  'groups.redirect.referral_title': 'Invitar',
  'groups.redirect.referral_missing_title':
    'El enlace de referencia necesita un código',
  'groups.redirect.referral_missing_subtitle':
    'Este enlace de referencia no incluía el código que Menta necesita.',
  'groups.redirect.referral_missing_notice': 'Falta el código de referencia',
  'groups.redirect.referral_missing_detail':
    'Pídele a tu amigo que reenvíe el enlace de invitación o continúa en Menta sin una referencia.',
  'groups.redirect.without_referral': 'Continuar sin referencia',
  'groups.redirect.referral_existing_title':
    'La invitación es para cuentas nuevas.',
  'groups.redirect.referral_existing_subtitle':
    'Esta cuenta ya está configurada, por lo que Menta no cambiará tu referencia.',
  'groups.redirect.account_ready': 'Cuenta ya configurada',
  'groups.redirect.account_ready_detail':
    'Los enlaces de referencia se aplican al crear una nueva cuenta Menta. Tu cuenta actual permanece sin cambios.',
  'groups.redirect.continue_menta': 'Continuar a Menta',
  'groups.redirect.referral_opening': 'Referencia de apertura',
  'groups.redirect.referral_opening_subtitle':
    'Guardaremos la referencia y lo llevaremos de regreso a Menta.',
  'groups.redirect.referral_saved': 'Referencia guardada',
  'groups.redirect.referral_saved_detail':
    'La referencia se guarda y permanecerá visible mientras inicia sesión o crea tu cuenta.',
  'groups.redirect.referral_checking':
    'Menta está comprobando la referencia antes de abrir la aplicación.',
  'groups.detail.archive': 'Archivar este grupo',
  'groups.detail.archive_detail':
    'Sácalo de tu lista activa y conserva el historial.',
  'groups.detail.first_promise': 'Primera promesa compartida',
  'groups.detail.first_promise_detail':
    'Añade la regla de promesa y prueba que todos usarán.',
  'groups.detail.reviews_title': 'Reseñas',
  'groups.detail.invite': 'invitar gente',
  'groups.detail.add_promise': 'Añadir la primera promesa',
  'groups.detail.open_board': 'tablero abierto',
  'groups.detail.review_later': 'Revisar más tarde',
  'groups.detail.commitments': 'Los compromisos que este grupo está siguiendo.',
  'groups.detail.add': 'Añadir',
  'groups.detail.member_detail':
    'Personas que pueden enviar y revisar pruebas.',
  'groups.detail.manage': 'Administrar',
  'groups.detail.no_members': 'No hay miembros cargados',
  'groups.detail.no_members_detail':
    'Revisa el grupo de nuevo o invita a alguien.',
  'groups.detail.report': 'Grupo de informes',
  'groups.detail.report_detail':
    'Informar contenido grupal inseguro o inapropiado.',
  'groups.detail.invite_sheet_detail':
    'Copia el código o abre la menú para compartir.',
  'groups.detail.members_sheet_detail': 'Ver roles y administrar el acceso.',
  'groups.detail.settings_sheet_detail':
    'Cambia el nombre, quién puede unirse, las invitaciones y los controles del propietario.',
  'groups.detail.leave': 'Dejar grupo',
  'groups.detail.delete': 'Eliminar grupo',
  'groups.detail.delete_detail': 'Elimina el grupo y tu historial para todos.',
  'groups.detail.delete_warning':
    'Esto elimina permanentemente el grupo, tus promesas compartidas, tu historial de pruebas y el acceso de miembros para todos.',
  'groups.detail.cancel': 'Cancelar',
  'groups.detail.sign_in_detail': 'Inicia sesión antes de unirte a este grupo.',
  'groups.detail.joined_title': 'Unido',
  'groups.detail.joined_detail': 'Estás en el grupo.',
  'groups.detail.join_failed': 'Unirse falló',
  'groups.detail.join_failed_detail': 'No se pudo unir a este grupo.',
  'groups.detail.left_title': 'grupo de izquierda',
  'groups.detail.left_detail': 'Ya no perteneces a este grupo.',
  'groups.detail.leave_unknown_title': 'Salida no confirmada',
  'groups.detail.leave_unknown_detail':
    'Menta no pudo confirmar si te fuiste. Vuelve a Grupos y comprueba tu membresía antes de volver a intentarlo.',
  'groups.detail.leave_failed_title': 'Dejar no completado',
  'groups.detail.leave_warning':
    'Dejarás de aparecer en este grupo y no podrás enviar ni revisar nuevas promesas de grupo. Las pruebas del historial permanecen en la historia del grupo.',
  'groups.detail.deleted_title': 'Grupo eliminado',
  'groups.detail.deleted_detail':
    'El grupo, tus promesas compartidas y tu historial de pruebas fueron eliminados para todos.',
  'groups.detail.delete_unknown_title': 'Eliminar no confirmado',
  'groups.detail.delete_unknown_detail':
    'Menta no pudo confirmar si el grupo fue eliminado. Vuelve a Grupos y comprueba antes de volver a intentarlo.',
  'groups.detail.delete_failed_title': 'Grupo no eliminado',
  'groups.detail.archive_failed_title': 'Error de archivado',
  'groups.detail.not_archived_title': 'Grupo no archivado',
  'groups.detail.archive_failed_detail':
    'Menta no pudo archivar este grupo. Tu historial y tu posición en la lista activa no han cambiado. Inténtalo de nuevo.',
  'groups.detail.archived_title': 'Grupo archivado',
  'groups.detail.archived_detail':
    'Ahora está en grupos archivados y tu historial aún está disponible.',
  'groups.detail.day_streak': 'Racha de grupo de días {count}',
  'groups.detail.open_proof_detail': 'Abre tu prueba para este grupo.',
  'groups.detail.member_board_detail': 'Hay personas {count} en este foro.',
  'groups.detail.created_title': 'Grupo creado.',
  'groups.detail.created_detail':
    'Añade la primera promesa compartida y luego invite a personas.',
  'groups.detail.privacy_group': 'Grupo {privacy}',
  'groups.detail.joined_count': '{count} se unió',
  'groups.detail.invite_ready': 'Enlace de invitación listo',
  'groups.detail.nudges_off': 'Se aleja',
  'groups.detail.nudges_on': 'Empujes en',
  'groups.detail.review_prompt_detail':
    'Compare cada prueba con la promesa compartida.',
  'groups.detail.review_proof_count': 'Revisar las pruebas {count}',
  'groups.detail.glance_title': 'Grupo de un vistazo',
  'groups.detail.glance_detail':
    'Mantén visibles la promesa compartida, las personas y la próxima acción de responsabilidad mientras usa el tablero.',
  'groups.detail.no_fixed_streak': 'Sin objetivo de racha fija',
  'groups.detail.review_against_promise':
    'Revisión contra la promesa compartida.',
  'groups.share.back_you': 'De vuelta a ti',
  'groups.share.invite_someone': 'invitar a alguien',
  'groups.share.invite_someone_title': 'Invitar a alguien a Menta',
  'groups.share.preparing': 'Preparando tu invitación',
  'groups.share.choose_where': 'Elige dónde compartir',
  'groups.share.ready_after_return': 'Listo para volver a compartir',
  'groups.share.reward_confirmed': '{amount} Momenta añadidos',
  'groups.share.link_copied': 'Enlace copiado',
  'groups.share.unavailable': 'Enlace de invitación no disponible',
  'groups.share.ready_detail':
    'Deja que escanear el código o compartir tu enlace de referencia.',
  'groups.share.preparing_detail':
    'Tu invitación se abrirá cuando el enlace esté listo.',
  'groups.share.choose_where_detail':
    'Elige una persona o aplicación en la menú para compartir de tu celular.',
  'groups.share.returned_detail':
    'Menta no puede decir si se envió el enlace. Puedes compartirlo de nuevo o copiarlo.',
  'groups.share.copied_detail':
    'Está en el portapapeles de este celular. No ha sido enviado.',
  'groups.share.unavailable_detail':
    'El enlace no se ha copiado ni abierto. Inténtalo de nuevo.',
  'groups.share.share_hint': 'Abre la menú para compartir de tu celular.',
  'groups.share.share_subtitle': 'Envíalo a través de cualquier aplicación.',
  'groups.share.share_link': 'Compartir enlace',
  'groups.share.copy_hint': 'Copia el enlace de invitación a este celular.',
  'groups.share.copy_subtitle': 'Pégalo donde elijas',
  'groups.share.copy_link': 'Copiar enlace',
  'groups.share.programme': 'Programa de referencia',
  'groups.share.checking_rewards':
    'Comprobación de recompensas por referencias',
  'groups.share.checking_rewards_detail':
    'Aún puedes compartir tu enlace activo mientras Menta verifica los términos de recompensa actuales.',
  'groups.share.terms_unavailable': 'Términos de recompensa no disponibles',
  'groups.share.terms_unavailable_detail':
    'Aún puedes compartir tu enlace. Menta mostrará los términos de la recompensa cuando pueda confirmarlos.',
  'groups.share.rewards_paused': 'Las recompensas están en pausa',
  'groups.share.paused_detail':
    'Aún puedes compartir tu enlace, pero Menta no agregará Momenta de referencia mientras el programa esté en pausa.',
  'groups.share.annual_limit': 'Límite anual',
  'groups.share.rewards_title': 'Tus recompensas por recomendar',
  'groups.share.limit_resets': 'Restablecimientos de límites',
  'groups.share.at_midnight': 'A las 00:00 UTC',
  'groups.share.retry_hint': 'Crea un nuevo enlace de invitación.',
  'groups.share.preparing_label': 'Preparando invitación',
  'groups.share.preparing_action': 'Preparando invitación…',
  'groups.share.opening_handoff': 'Abrir menú para compartir',
  'groups.share.opening_action': 'Abriendo menú para compartir...',
  'groups.share.share_again': 'compartir de nuevo',
  'groups.share.message':
    'Únete a mí en Menta. Usa este enlace y luego crea tu primera promesa para completar la referencia.\\n\\n{link}',
  'groups.join.clipboard_empty': 'Portapapeles vacío',
  'groups.join.clipboard_empty_detail':
    'Copia un código de invitación, luego vuelve y péguelo aquí.',
  'groups.join.code_pasted': 'Código pegado',
  'groups.join.invite_ready': 'Código de invitación listo.',
  'groups.join.check_code': 'Compruébalo antes de unirte.',
  'groups.join.paste_failed': 'Error al pegar',
  'groups.join.clipboard_error':
    'Menta no pudo leer tu portapapeles. En tu lugar, escriba el código de invitación.',
  'groups.share.limit_reached': 'Has alcanzado tu límite de recompensa',
  'groups.share.both_earn': 'Ambos pueden ganar {amount} Momenta',
  'groups.share.limit_detail':
    'Has utilizado todas las {limit} recompensas por invitación disponibles este año. Un nuevo miembro elegible aún puede ganar {amount} Momenta cuando usa tu enlace y crea tu primera promesa, mientras las recompensas están activas. Puedes volver a ganar con {date}.',
  'groups.share.eligible_detail':
    'Un nuevo miembro elegible utiliza tu enlace y crea tu primera promesa. Si las recompensas aún están activas, los dos ganaréis {amount} Momenta. Puedes ganar hasta recompensas por referencia {limit} cada año.',
  'groups.navigation.no_saved_title': 'No hay invitación guardada',
  'groups.navigation.no_saved_detail':
    'Pega un código o abre un nuevo enlace de invitación.',
  'groups.navigation.ready_title': 'Invitación lista para comprobar',
  'groups.navigation.promise_ready_detail':
    'Mira la promesa y las condiciones para unirte antes de que algo cambie.',
  'groups.navigation.group_ready_detail':
    'Mira el grupo antes de decidir si desea unirse.',
  'groups.navigation.invalid_title': 'La invitación ya no es válida',
  'groups.navigation.invalid_detail':
    'El código guardado no se puede utilizar. Solicita un nuevo enlace de invitación.',
  'groups.navigation.cleared_title': 'Invitación guardada borrada',
  'groups.navigation.cleared_detail': 'Menta esperará un nuevo enlace.',
  'groups.navigation.sign_in_title': 'Es necesario iniciar sesión',
  'groups.navigation.sign_in_detail':
    'Inicia sesión antes de abrir esta invitación.',
  'groups.funding.terms_mismatch':
    'Menta devolvió los términos de unión para un promesa diferente.',
  'groups.funding.quote_unavailable':
    'Menta no pudo cargar los términos de unión.',
  'groups.funding.quote_unavailable_detail':
    'Los detalles de unión no se cargaron. Inténtalo de nuevo antes de unirte.',
  'groups.funding.already_member':
    'La membresía ya está presente. No se ha reclamado ningún nuevo débito o recibo de unión.',
  'groups.funding.receipt_mismatch':
    'Menta devolvió un recibo de unión que no coincidía con esta solicitud.',
  'groups.funding.status_receipt_mismatch':
    'Menta devolvió un recibo de inscripción que no coincidía con esta verificación de estado.',
  'groups.funding.join_unknown':
    'Menta no pudo confirmar si te uniste. Verifica tu membresía antes de volver a intentarlo.',
  'groups.funding.status_membership_mismatch':
    'Menta devolvió el estatus de miembro para un promesa diferente.',
  'groups.funding.status_unknown':
    'Menta aún no pudo verificar tu membresía. Intentar otra vez.',
  'groups.funding.status_unavailable':
    'Menta aún no pudo verificar esta unión.',
  'groups.funding.member_without_receipt':
    'La membresía está confirmada, pero no hay recibo de débito de inscripción. No se reclama ningún cargo de Momenta.',
  'groups.funding.no_receipt':
    'No se encontró ningún recibo de membresía o inscripción. Puedes volver a intentar la misma solicitud sin riesgo.',
  'groups.detail.privacy_group.discoverable': 'Grupo visible',
  'groups.detail.privacy_group.invite_link_only':
    'Grupo solo con enlace de invitación',
  'groups.detail.privacy_group.invite_only': 'Grupo solo con invitación',
  'groups.source.image_move_description':
    'Caminar, hacer ejercicio y rutinas activas',
  'groups.source.image_focus_description':
    'Estudiar, planificar y trabajar con concentración',
  'groups.source.image_create_description':
    'Escritura, arte, música y creación',
  'groups.source.image_reset_description':
    'Descanso, reflexión y rutinas tranquilas',
  'groups.source.metric.member_unit': 'miembro',
  'groups.source.metric.members_unit': 'miembros',
  'groups.source.metric.day_streak_unit': 'racha de días del grupo',
  'groups.source.metric.day_streak_value': 'racha de {count} días',
  'groups.source.metric.proof_unit': 'prueba por revisar',
  'groups.source.metric.proofs_unit': 'pruebas por revisar',
  'groups.source.role.owner': 'Propietario',
  'groups.source.role.admin': 'Administrador',
  'groups.source.role.moderator': 'Moderador',
  'groups.source.role.member': 'Miembro',
  'groups.source.date.no_fixed': 'Sin fechas fijas',
  'groups.source.date.range': '{start} a {end}',
  'groups.source.date.starts': 'Empieza el {date}',
  'groups.source.date.ends': 'Termina el {date}',
  'groups.source.group.fallback': 'Grupo',
  'groups.source.member.count': '{count} miembros',
  'groups.source.member.count.one': '{count} miembro',
  'groups.source.member.count.other': '{count} miembros',
  'groups.source.member.fallback': 'Miembro',
  'groups.source.privacy.discoverable': 'Visible',
  'groups.source.privacy.invite_link_only': 'Solo con enlace de invitación',
  'groups.source.privacy.invite_only': 'Solo con invitación',
  'groups.source.header.member': '{role} · {members}',
  'groups.source.header.public': '{privacy} · {members}',
  'groups.source.review.rule':
    'Los miembros envían pruebas. Otro miembro elegible las revisa.',
  'groups.source.board.headline.ready': 'Tablero listo',
  'groups.source.board.headline.review': '{count} revisiones',
  'groups.source.board.headline.review.one': '{count} revisión',
  'groups.source.board.headline.review.other': '{count} revisiones',
  'groups.source.board.headline.promise_live': '{count} promesas activas',
  'groups.source.board.headline.promise_live.one': '{count} promesa activa',
  'groups.source.board.headline.promise_live.other': '{count} promesas activas',
  'groups.source.board.hint.first_rule': 'Añade la primera regla de prueba',
  'groups.source.board.hint.members': '{count} miembros',
  'groups.source.board.hint.members.one': '{count} miembro',
  'groups.source.board.hint.members.other': '{count} miembros',
  'groups.source.board.body.empty':
    'Añade la primera promesa compartida antes de que venza la prueba diaria.',
  'groups.source.board.body.review':
    'Revisa la prueba pendiente para actualizar el registro del grupo.',
  'groups.source.board.body.due':
    'Envía la prueba de la promesa compartida cuando te toque hacer el seguimiento.',
  'groups.source.streak.progress': '{completed} de {total} días confirmados',
  'groups.source.summary.accessibility':
    'Racha del grupo de {streak} días. {members}. {pending}.',
  'groups.source.promise.default_title': 'Promesa compartida',
  'groups.source.promise.default_subtitle':
    'Abre la regla de prueba y envía la de hoy.',
  'groups.source.promise.detail_default':
    'Abre la promesa para ver tu regla de prueba e historial.',
  'groups.source.promise.detail': 'Abre los detalles de la promesa.',
  'groups.source.proof.count': '{count} pruebas',
  'groups.source.proof.count.one': '{count} prueba',
  'groups.source.proof.count.other': '{count} pruebas',
  'groups.source.proof.pending': '{count} pruebas por revisar',
  'groups.source.proof.pending.one': '{count} prueba por revisar',
  'groups.source.proof.pending.other': '{count} pruebas por revisar',
  'groups.source.review.waiting': '{count} pruebas esperan revisión.',
  'groups.source.review.waiting.one': '{count} prueba espera revisión.',
  'groups.source.review.waiting.other': '{count} pruebas esperan revisión.',
  'groups.source.review.button': 'Revisar {count} pruebas',
  'groups.source.review.button.one': 'Revisar {count} prueba',
  'groups.source.review.button.other': 'Revisar {count} pruebas',
  'groups.source.review.open': 'Revisar {count}',
  'groups.source.member.view_all': 'Ver los {count}',
  'groups.source.read_only.ended_on':
    'Este grupo terminó el {date}. Puedes ver tus promesas, miembros e historial de pruebas.',
  'groups.source.read_only.failed':
    'Este grupo terminó sin alcanzar tu objetivo. Puedes ver tus promesas, miembros e historial de pruebas.',
  'groups.source.read_only.ended':
    'Este grupo ha terminado. Puedes ver tus promesas, miembros e historial de pruebas.',
  'groups.source.accountability.saved_group_picker.open_action':
    'Hacerlo con un grupo',
  'groups.source.accountability.saved_group_picker.title':
    'Hacerlo con un grupo',
  'groups.source.accountability.saved_group_picker.detail':
    'Elige a qué grupo pertenece esta promesa. No se comparte nada hasta que confirmes.',
  'groups.source.accountability.saved_group_picker.loading':
    'Cargando tus grupos',
  'groups.source.accountability.saved_group_picker.load_error_title':
    'No se pudieron cargar tus grupos',
  'groups.source.accountability.saved_group_picker.load_error_detail':
    'Tu promesa sigue siendo privada. Intenta cargar tus grupos de nuevo.',
  'groups.source.accountability.saved_group_picker.empty_title':
    'Aún no tienes grupos guardados',
  'groups.source.accountability.saved_group_picker.empty_detail':
    'Primero crea un grupo y vuelve para agregar esta promesa.',
  'groups.source.accountability.saved_group_picker.people_unknown':
    'Número de personas no disponible',
  'groups.source.accountability.saved_group_picker.public': 'Público',
  'groups.source.accountability.saved_group_picker.private': 'Privado',
  'groups.source.accountability.saved_group_picker.row_hint':
    'Seleccionar este grupo',
  'groups.source.accountability.saved_group_picker.row_accessibility':
    '{group}. {people}. {privacy}.',
  'groups.source.accountability.saved_group_picker.meta':
    '{people} · {privacy}',
  'groups.source.accountability.saved_group_picker.unknown_title':
    'Vínculo no confirmado',
  'groups.source.accountability.saved_group_picker.unknown_detail':
    'Es posible que Menta haya agregado la promesa. Revisa de nuevo con la misma solicitud antes de intentar otra cosa.',
  'groups.source.accountability.saved_group_picker.failed_title':
    'Promesa no agregada',
  'groups.source.accountability.saved_group_picker.failed_detail':
    'No se compartió nada. Elige otro grupo o cierra esta ventana.',
  'groups.source.accountability.saved_group_picker.confirmed':
    '{group} ahora incluye esta promesa.',
  'groups.source.accountability.saved_group_picker.check_again':
    'Revisar de nuevo',
  'groups.source.accountability.saved_group_picker.close_for_now':
    'Cerrar por ahora',
  'groups.source.accountability.saved_group_picker.choose_another':
    'Elegir otro grupo',
  'groups.source.accountability.saved_group_picker.not_now': 'Ahora no',
  'groups.source.accountability.saved_group_picker.continue_with':
    'Continuar con {group}',
  'groups.source.accountability.saved_group_picker.choose_group':
    'Elegir un grupo',
  'groups.source.accountability.saved_group_picker.create_new':
    'Crear un grupo nuevo',
  'groups.source.accountability.saved_group_picker.create_new_detail':
    'Usa la configuración de grupos que ya conoces',
  'groups.source.accountability.saved_group_picker.create_new_accessibility':
    'Crear un grupo nuevo para esta promesa',
  'groups.source.accountability.saved_group_picker.create_handoff_failed_title':
    'No se pudo abrir la configuración del grupo',
  'groups.source.accountability.saved_group_picker.create_handoff_failed_detail':
    'Tu promesa sigue siendo privada. Intenta abrir de nuevo la configuración del grupo.',
  'groups.create.promise_link.missing_context_title':
    'Vínculo de la promesa no disponible',
  'groups.create.promise_link.missing_context_detail':
    'Vuelve a la promesa y abre de nuevo la configuración del grupo. No se creó ningún grupo.',
  'groups.create.promise_link.confirmed_accessibility':
    'Se creó {group} y ahora incluye tu promesa.',
  'groups.create.promise_link.linking_title': 'Agregando tu promesa…',
  'groups.create.promise_link.linking_detail':
    '{group} está listo. Menta está confirmando el vínculo de la promesa.',
  'groups.create.promise_link.linking_button': 'Agregando promesa…',
  'groups.create.promise_link.unknown_title':
    'Grupo creado. Hay que revisar el vínculo.',
  'groups.create.promise_link.unknown_detail':
    '{group} está listo, pero Menta no pudo confirmar si se agregó la promesa. Revisa de nuevo con la misma solicitud.',
  'groups.create.promise_link.failed_title':
    'Grupo creado. Promesa no agregada.',
  'groups.create.promise_link.failed_detail':
    '{group} está listo y no se compartió nada. Vuelve a la promesa para elegir el siguiente paso.',
  'groups.create.promise_link.check_again': 'Revisar el vínculo',
  'groups.create.promise_link.return_to_promise': 'Volver a la promesa',
} as const satisfies Pick<EnglishCatalogue, FullGroupsKey>;
