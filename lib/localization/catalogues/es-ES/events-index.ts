import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type EventsIndexKey = Extract<keyof EnglishCatalogue, `events.index.${string}`>;

export const eventsIndexEsES = {
  'events.index.time.tbc': 'Hora pendiente de confirmación',
  'events.index.date.tbc': 'PEND.',
  'events.index.capacity.unlimited': 'Sin límite de asistentes',
  'events.index.capacity.full': 'Aforo completo',
  'events.index.capacity.remaining': 'Quedan {count} plazas',
  'events.index.capacity.remaining.one': 'Queda {count} plaza',
  'events.index.capacity.remaining.other': 'Quedan {count} plazas',
  'events.index.visibility.invite_only': 'Solo con invitación',
  'events.index.visibility.unlisted': 'No publicado',
  'events.index.visibility.public': 'Público',
  'events.index.error.organiser_detail':
    'Menta no pudo cargar tus herramientas de organización guardadas.',
  'events.index.back': 'Atrás',
  'events.index.title': 'Eventos',
  'events.index.create_hint': 'Abre la creación de eventos.',
  'events.index.create': 'Crear un evento',
  'events.index.loading': 'Cargando eventos',
  'events.index.try_again': 'Volver a intentarlo',
  'events.index.error.refresh_title': 'No se pudieron actualizar los eventos',
  'events.index.error.refresh_detail':
    'Menta no pudo cargar los próximos eventos. Vuelve a intentarlo.',
  'events.index.error.organiser_title':
    'No se pudieron cargar tus herramientas de organización',
  'events.index.yours': 'Tus eventos',
  'events.index.organiser_open': 'Abrir pase de organización de {event}',
  'events.index.organiser_hint':
    'Abre el enlace del evento y el código de registro del organizador guardado en este teléfono',
  'events.index.organiser_meta': '{visibility} · Pase de organización',
  'events.index.empty_title': 'No hay próximos eventos',
  'events.index.empty_detail': 'Los eventos públicos aparecerán aquí.',
  'events.index.upcoming': 'Próximamente',
  'events.index.view': 'Ver {event}',
  'events.index.view_hint':
    'Abre los detalles del evento. Revisa las reglas de asistencia y fotos antes de unirte.',
} as const satisfies Pick<EnglishCatalogue, EventsIndexKey>;
