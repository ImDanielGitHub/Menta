import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayStateKey = Extract<keyof EnglishCatalogue, `today.state.${string}`>;

export const todayStatesFrFR = {
  'today.state.outcome.missed_day': 'le jour manqué',
  'today.state.action.try_again': 'Réessayer',
  'today.state.action.see_promise': 'Voir la promesse',
  'today.state.action.browse_groups': 'Parcourir les groupes',
  'today.state.action.make_promise': 'Faire une promesse',
  'today.state.protected.title': 'Série protégée',
  'today.state.protected.count_continues': ' La série reste à {count}.',
  'today.state.protected.freeze_detail':
    'Un gel de série a couvert le jour manqué du {weekday}. Ce jour reste dans votre historique.{countCopy}',
  'today.state.protected.detail':
    '{weekday} a été protégé. Ce jour reste dans votre historique.{countCopy}',
  'today.state.loading.title': 'Chargement d’Aujourd’hui.',
  'today.state.loading.detail':
    'Vérification du dernier état des preuves et validations.',
  'today.state.loading.action': 'Chargement',
  'today.state.loading.last_confirmed': 'Utiliser le dernier état confirmé',
  'today.state.offline.promise_title': 'Votre promesse reste à faire.',
  'today.state.offline.title': 'Connexion perdue.',
  'today.state.offline.promise_detail':
    'Vous pouvez préparer la preuve maintenant. Elle sera envoyée lorsque la connexion reviendra.',
  'today.state.offline.detail':
    'Menta ne peut pas actualiser vos promesses pour le moment. Rien n’a changé sur ce téléphone.',
  'today.state.offline.prepare_proof': 'Préparer la preuve',
  'today.state.load_failed.refresh_title':
    'Impossible d’actualiser Aujourd’hui.',
  'today.state.load_failed.title': 'Impossible de charger Aujourd’hui.',
  'today.state.load_failed.refresh_detail':
    'Le dernier état confirmé reste affiché. Aucun résultat de preuve ou de validation n’a changé ici.',
  'today.state.load_failed.detail': 'Vérifiez votre connexion, puis réessayez.',
  'today.state.streak.unavailable': 'Indisponible',
  'today.state.streak.history': 'Voir l’historique',
  'today.state.returning.away_days':
    'Vous n’avez pas fait de suivi depuis {count}.',
  'today.state.returning.away': 'Vous n’êtes pas venu depuis un moment.',
  'today.state.returning.title': 'Prêt à recommencer ?',
  'today.state.returning.detail':
    '{awayCopy} Commencez une nouvelle promesse ou reprenez-en une que vous étiez en train de tenir.',
  'today.state.returning.action': 'Commencer une nouvelle promesse',
  'today.state.returning.history': 'Voir mon historique',
  'today.state.returning.fresh_start': 'Nouveau départ',
  'today.state.returning.fresh_start_value':
    'Votre historique reste. La prochaine action vous appartient.',
  'today.state.returning.supporting_note':
    'Choisissez une promesse plus simple ou ouvrez votre historique pour reprendre la dernière.',
  'today.state.proof_due.text_detail':
    'Ajoutez la note convenue. Seuls vous et la personne qui la vérifie pouvez la voir.',
  'today.state.proof_due.text_action': 'Ajouter une note comme preuve',
  'today.state.proof_due.video_detail':
    'Ajoutez la vidéo convenue. Elle reste privée pour cette promesse et la personne qui la vérifie.',
  'today.state.proof_due.video_action': 'Ajouter une vidéo comme preuve',
  'today.state.proof_due.photo_detail':
    'Ajoutez la photo convenue. Elle reste privée pour cette promesse et la personne qui la vérifie.',
  'today.state.proof_due.photo_action': 'Ajouter une photo comme preuve',
  'today.state.proof_due.risk_title': 'Aujourd’hui compte encore.',
  'today.state.proof_due.streak_risk_detail':
    'Votre série de {streak} est toujours active. Essayez d’ajouter {proofNoun} avant {dueLabel}. La preuve compte jusqu’à minuit.',
  'today.state.proof_due.risk_detail':
    'Essayez d’ajouter {proofNoun} avant {dueLabel}. La preuve compte jusqu’à minuit.',
  'today.state.proof_due.log_action': 'Ajouter la preuve du jour',
  'today.state.proof_due.risk_note':
    'Aucune validation et aucun résultat n’ont changé. La prochaine étape est d’ajouter la preuve.',
  'today.state.proof_due.title': 'La preuve est attendue aujourd’hui.',
  'today.state.saved.unknown_title': 'Menta n’a pas pu confirmer l’envoi.',
  'today.state.saved.failed_title': 'La preuve est restée sur ce téléphone.',
  'today.state.saved.title': 'Votre preuve est en sécurité ici.',
  'today.state.saved.unknown_detail':
    'L’original est toujours enregistré. Vérifiez son état avant de réessayer.',
  'today.state.saved.failed_detail':
    'Vérifiez votre connexion, puis réessayez. L’original reste sur ce téléphone.',
  'today.state.saved.detail': 'Envoyez-la lorsque vous aurez une connexion.',
  'today.state.saved.check_action': 'Vérifier l’état de la preuve',
  'today.state.saved.retry_action': 'Réessayer l’envoi',
  'today.state.saved.send_action': 'Envoyer la preuve enregistrée',
  'today.state.uploading.title': 'Envoi de votre preuve.',
  'today.state.uploading.detail':
    'Gardez Menta ouvert jusqu’à la confirmation de l’envoi.',
  'today.state.uploading.action': 'Envoi de la preuve',
  'today.state.pending.named_title': '{promise} attend une validation.',
  'today.state.pending.title': 'Votre preuve attend une validation.',
  'today.state.pending.detail':
    'Elle est arrivée dans Menta. Le résultat apparaîtra ici.',
  'today.state.pending.action': 'Voir la preuve',
  'today.state.correction.title': 'Votre preuve demande une modification.',
  'today.state.correction.detail':
    'Ajoutez une preuve plus claire pour terminer aujourd’hui. L’original reste enregistré.',
  'today.state.correction.action': 'Modifier la preuve',
  'today.state.correction.feedback': 'Voir la demande',
  'today.state.review.named_title': '{name} a envoyé une preuve.',
  'today.state.review.title': 'Une preuve attend votre validation.',
  'today.state.review.detail':
    'Vérifiez la photo. Validez-la ou demandez une seule modification claire. Chaque validation confirmée ajoute {reward} Momenta, dans la limite de {dailyLimit} par jour.',
  'today.state.review.action': 'Vérifier la preuve',
  'today.state.review.see_group': 'Voir le groupe',
  'today.state.review.open_queue': 'Ouvrir la liste',
  'today.state.group_risk.named_title': '{group} a besoin d’un suivi.',
  'today.state.group_risk.title': 'Un groupe a besoin d’un suivi.',
  'today.state.group_risk.named_detail':
    'Ouvrez le groupe pour voir ce qui est à faire.',
  'today.state.group_risk.detail':
    'Ouvrez le groupe pour voir qui doit encore faire son suivi.',
  'today.state.group_risk.action': 'Ouvrir le groupe',
  'today.state.accepted.named_title': '{promise} est terminée.',
  'today.state.accepted.title': 'La journée est terminée.',
  'today.state.accepted.detail':
    'Votre preuve a été validée et enregistrée dans votre historique.',
  'today.state.accepted.named_receipt': '{promise} validée',
  'today.state.accepted.receipt': 'Preuve validée',
  'today.state.accepted.receipt_detail':
    'Le résultat du jour est confirmé dans l’historique de votre promesse.',
  'today.state.all_clear.review_unknown_title':
    'Aucune preuve n’est attendue pour le moment.',
  'today.state.all_clear.title':
    'Rien ne demande votre attention pour le moment.',
  'today.state.all_clear.review_unknown_detail':
    'Menta n’a pas pu vérifier les demandes de validation. Actualisez Aujourd’hui.',
  'today.state.all_clear.detail':
    'Revenez lorsqu’une promesse sera à faire ou qu’une personne enverra une preuve.',
  'today.state.all_clear.review_status':
    'Aucune preuve n’attend votre validation.',
  'today.state.streak.day_one_title': 'Aujourd’hui, c’est le jour 1.',
  'today.state.streak.day_one_detail':
    'Ajoutez la preuve d’aujourd’hui pour lancer une nouvelle série.',
  'today.state.streak.bubble_run_ended':
    '{weekday} a été manqué, donc la série de {count} jours s’arrête. Elle reste dans votre historique.',
  'today.state.streak.bubble_missed':
    '{weekday} a été manqué. Votre historique est conservé.',
  'today.state.streak.see_run': 'Voir la série de {count} jours',
  'today.state.no_promises.title': 'Commencez par une promesse.',
  'today.state.no_promises.detail':
    'Choisissez une petite chose, montrez une photo rapide chaque jour et, si vous voulez, invitez quelqu’un à la vérifier.',
  'today.state.no_promises.join_group': 'J’ai un code d’invitation',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
