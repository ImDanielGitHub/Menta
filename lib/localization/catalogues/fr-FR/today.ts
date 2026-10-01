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
  'today.home.streak.caption': 'jours de suite',
  'today.home.streak.accessibility':
    'Meilleure série en cours : {days}. {status} Affiche la série de chaque promesse.',
  'today.home.streak.accessibility_none':
    'Pas encore de série. Explique comment les séries sont comptées.',
  'today.home.streak.status_kept': 'Aujourd’hui est approuvé.',
  'today.home.streak.status_waiting':
    'La preuve du jour attend une vérification.',
  'today.home.streak.status_due': 'La preuve du jour est encore attendue.',
  'today.home.streak.status_risk': 'La preuve du jour est bientôt due.',
  'today.home.momenta.caption': 'Momenta',
  'today.home.momenta.accessibility':
    '{balance} Momenta. Ouvre votre portefeuille.',
  'today.home.momenta.accessibility_unknown':
    'Solde Momenta pas encore confirmé. Ouvre votre portefeuille.',
  'today.home.week.accessibility':
    '7 derniers jours : {count} jours où chaque promesse a été tenue.',
  'today.home.week.accessibility.one':
    '7 derniers jours : {count} jour où chaque promesse a été tenue.',
  'today.home.week.accessibility.other':
    '7 derniers jours : {count} jours où chaque promesse a été tenue.',
  'today.home.streaks.title': 'Vos séries',
  'today.home.streaks.note':
    'Une série compte les jours avec une preuve approuvée, pas les jours où une promesse était ouverte.',
  'today.home.streaks.empty':
    'Votre première série commence quand quelqu’un approuve votre preuve.',
  'today.home.streaks.longest': 'Plus longue : {days}',
  'today.home.streaks.row_accessibility':
    '{promise}. Série {days}. {status}. Ouvre l’historique.',
  'today.home.receipt.accessibility': 'Promesse du jour. {facts}',
  'today.home.receipt.proof': 'Preuve',
  'today.home.receipt.progress': 'Progression',
  'today.home.receipt.streak': 'Série',
  'today.home.receipt.group': 'Groupe',
  'today.home.receipt.today': 'Aujourd’hui',
  'today.home.receipt.photo': 'Photo',
  'today.home.receipt.video': 'Vidéo',
  'today.home.receipt.note': 'Note écrite',
  'today.home.receipt.status_saved': 'Enregistrée sur ce téléphone',
  'today.home.receipt.status_sending': 'Envoi en cours',
  'today.home.also.detail': '{where} · {day}',
  'today.home.personal': 'Personnel',
  'today.home.review_queue': 'Ouvrir la file de vérification',
  'today.home.bubble.returning': 'Commencez là où vous en êtes.',
  'today.countdown.hours_minutes': '{hours} h {minutes}',
  'today.countdown.hours': '{hours} h',
  'today.countdown.minutes': '{minutes} min',
  'today.countdown.left_proof': 'pour ajouter la preuve du jour',
  'today.countdown.left_streak': 'pour garder votre série de {count} jours',
  'today.countdown.left_extension': 'restantes sur votre prolongation',
  'today.countdown.note_midnight': 'La preuve compte jusqu’à minuit.',
  'today.countdown.note_last_hour':
    'Après minuit, ce jour compte comme manqué.',
  'today.countdown.note_extension':
    'La preuve compte jusqu’à la fin de votre prolongation.',
  'today.countdown.accessibility': '{duration} {caption}. {note}',
  'today.home.bubble.no_promises':
    'Qu’est-ce que vous vous promettez de faire depuis longtemps ?',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
