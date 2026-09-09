import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayFrFR = {
  'today.progress.streak_days': '{count} jours',
  'today.progress.streak_days.one': '{count} jour',
  'today.progress.streak_days.other': '{count} jours',
  'today.progress.day_of': 'Jour {day} sur {total}',
  'today.progress.day': 'Jour {day}',
  'today.progress.current_streak': 'Série en cours',
  'today.progress.promise': 'Progression de la promesse',
  'today.progress.accessibility.current_streak': 'Série en cours : {value}.',
  'today.progress.accessibility.promise':
    'Progression de la promesse : {value}.',
  'today.all_clear.due_now': 'à faire maintenant',
  'today.all_clear.accessibility.zero_due': 'Aucune action requise maintenant.',
  'today.loading.accessibility': 'Chargement d’Aujourd’hui',
  'today.proof.heading': 'À suivre',
  'today.proof.solo': 'En solo',
  'today.proof.meta': '{group} · Jour {day}/{total} · {status}',
  'today.proof.status.waiting_review': 'En attente de validation',
  'today.proof.status.approved': 'Preuve validée',
  'today.proof.status.correction_requested': 'Nouvelle preuve demandée',
  'today.proof.status.sent': 'Preuve envoyée',
  'today.proof.status.due_now': 'Preuve à fournir maintenant',
  'today.proof.status.due': 'Preuve à fournir',
  'today.proof.action.view': 'Voir',
  'today.proof.action.update': 'Modifier',
  'today.proof.action.write': 'Écrire',
  'today.proof.action.record': 'Filmer',
  'today.proof.action.add_photo': 'Ajouter une photo',
  'today.proof.action.add_proof': 'Ajouter une preuve',
  'today.proof.empty.title': 'Aucune promesse pour l’instant',
  'today.proof.empty.body':
    'Faites une promesse. Votre premier suivi apparaîtra ici.',
  'today.proof.empty.action': 'En faire une',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
