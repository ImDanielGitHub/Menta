import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type EventsIndexKey = Extract<keyof EnglishCatalogue, `events.index.${string}`>;

export const eventsIndexFrCA = {
  'events.index.time.tbc': 'Heure à confirmer',
  'events.index.date.tbc': 'À confirmer',
  'events.index.capacity.unlimited': 'Aucune limite de participants',
  'events.index.capacity.full': 'Complet',
  'events.index.capacity.remaining': 'Il reste {count} places',
  'events.index.capacity.remaining.one': 'Il reste {count} place',
  'events.index.capacity.remaining.other': 'Il reste {count} places',
  'events.index.visibility.invite_only': 'Sur invitation seulement',
  'events.index.visibility.unlisted': 'Non répertorié',
  'events.index.visibility.public': 'Public',
  'events.index.error.organiser_detail':
    'Menta n’a pas pu charger vos outils d’organisateur enregistrés.',
  'events.index.back': 'Retour',
  'events.index.title': 'Événements',
  'events.index.create_hint': 'Ouvre la création d’un événement.',
  'events.index.create': 'Créer un événement',
  'events.index.loading': 'Chargement des événements',
  'events.index.try_again': 'Réessayer',
  'events.index.error.refresh_title': 'Impossible d’actualiser les événements',
  'events.index.error.refresh_detail':
    'Menta n’a pas pu charger les événements à venir. Réessayez.',
  'events.index.error.organiser_title':
    'Impossible de charger vos outils d’organisateur',
  'events.index.yours': 'Vos événements',
  'events.index.organiser_open':
    'Ouvrir le laissez-passer d’organisateur pour {event}',
  'events.index.organiser_hint':
    'Ouvre le lien de l’événement et le code d’arrivée de l’organisateur enregistrés sur ce téléphone',
  'events.index.organiser_meta': '{visibility} · Laissez-passer d’organisateur',
  'events.index.empty_title': 'Aucun événement à venir',
  'events.index.empty_detail': 'Les événements publics s’afficheront ici.',
  'events.index.upcoming': 'À venir',
  'events.index.view': 'Voir {event}',
  'events.index.view_hint':
    'Ouvre les détails de l’événement. Vérifiez les règles de présence et de photo avant de vous inscrire.',
} as const satisfies Pick<EnglishCatalogue, EventsIndexKey>;
