import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type EventsIndexKey = Extract<keyof EnglishCatalogue, `events.index.${string}`>;

export const eventsIndexPtPT = {
  'events.index.time.tbc': 'Horário a confirmar',
  'events.index.date.tbc': 'A confirmar',
  'events.index.capacity.unlimited': 'Sem limite de participantes',
  'events.index.capacity.full': 'Lotado',
  'events.index.capacity.remaining': '{count} lugares restantes',
  'events.index.capacity.remaining.one': '{count} vaga restante',
  'events.index.capacity.remaining.other': '{count} lugares restantes',
  'events.index.visibility.invite_only': 'Somente por convite',
  'events.index.visibility.unlisted': 'Não listado',
  'events.index.visibility.public': 'Público',
  'events.index.error.organiser_detail':
    'A Menta não conseguiu carregar suas ferramentas de organização guardadas.',
  'events.index.back': 'Voltar',
  'events.index.title': 'Eventos',
  'events.index.create_hint': 'Abre o formulário para criar um evento.',
  'events.index.create': 'Criar um evento',
  'events.index.loading': 'A carregar eventos',
  'events.index.try_again': 'Tentar novamente',
  'events.index.error.refresh_title': 'Não foi possível atualizar os eventos',
  'events.index.error.refresh_detail':
    'A Menta não conseguiu carregar os próximos eventos. Tente novamente.',
  'events.index.error.organiser_title':
    'Não foi possível carregar suas ferramentas de organização',
  'events.index.yours': 'Seus eventos',
  'events.index.organiser_open': 'Abrir passe de organização de {event}',
  'events.index.organiser_hint':
    'Abre o ligação do evento e o código de entrada do organizador guardados neste telemóvel',
  'events.index.organiser_meta': '{visibility} · Passe de organização',
  'events.index.empty_title': 'Nenhum evento próximo',
  'events.index.empty_detail': 'Os eventos públicos aparecerão aqui.',
  'events.index.upcoming': 'Próximos',
  'events.index.view': 'Ver {event}',
  'events.index.view_hint':
    'Abre os detalhes do evento. Verifique as regras de presença e fotografias antes de participar.',
} as const satisfies Pick<EnglishCatalogue, EventsIndexKey>;
