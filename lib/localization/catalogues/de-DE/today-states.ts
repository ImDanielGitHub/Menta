import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayStateKey = Extract<keyof EnglishCatalogue, `today.state.${string}`>;

export const todayStatesDeDE = {
  'today.state.outcome.missed_day': 'der verpasste Tag',
  'today.state.action.try_again': 'Erneut versuchen',
  'today.state.action.see_promise': 'Versprechen ansehen',
  'today.state.action.browse_groups': 'Gruppen ansehen',
  'today.state.action.make_promise': 'Versprechen machen',
  'today.state.protected.title': 'Serie geschützt',
  'today.state.protected.count_continues':
    ' Die Serie läuft mit {count} weiter.',
  'today.state.protected.freeze_detail':
    'Ein Serien-Schutz hat den verpassten Tag am {weekday} abgedeckt. Der Tag bleibt in deinem Verlauf.{countCopy}',
  'today.state.protected.detail':
    '{weekday} wurde geschützt. Der Tag bleibt in deinem Verlauf.{countCopy}',
  'today.state.loading.title': 'Heute wird geladen.',
  'today.state.loading.detail':
    'Der aktuelle Nachweis- und Prüfstatus wird geladen.',
  'today.state.loading.action': 'Wird geladen',
  'today.state.loading.last_confirmed': 'Letzten bestätigten Stand verwenden',
  'today.state.offline.promise_title': 'Dein Versprechen ist noch fällig.',
  'today.state.offline.title': 'Verbindung unterbrochen.',
  'today.state.offline.promise_detail':
    'Du kannst den Nachweis jetzt vorbereiten. Gesendet wird er, sobald du wieder verbunden bist.',
  'today.state.offline.detail':
    'Menta kann deine Versprechen gerade nicht aktualisieren. Auf diesem Telefon wurde nichts geändert.',
  'today.state.offline.prepare_proof': 'Nachweis vorbereiten',
  'today.state.load_failed.refresh_title':
    'Heute konnte nicht aktualisiert werden.',
  'today.state.load_failed.title': 'Heute konnte nicht geladen werden.',
  'today.state.load_failed.refresh_detail':
    'Der letzte bestätigte Stand wird weiterhin angezeigt. Hier hat sich kein Nachweis- oder Prüfergebnis geändert.',
  'today.state.load_failed.detail':
    'Prüfe deine Verbindung und versuch es erneut.',
  'today.state.streak.unavailable': 'Nicht verfügbar',
  'today.state.streak.missed_title':
    'Ein Tag wurde verpasst. Fang heute wieder an.',
  'today.state.streak.weekday_missed_title':
    '{weekday} wurde verpasst. Fang heute wieder an.',
  'today.state.streak.previous_detail':
    'Die letzte Serie endete bei {count}, weil der Nachweis für {weekday} nicht rechtzeitig einging. Dein Verlauf bleibt erhalten.',
  'today.state.streak.missed_detail':
    '{weekday} wurde als verpasst gespeichert. Dein Verlauf bleibt erhalten.',
  'today.state.streak.return_action': 'Mit einem Tag zurückkehren',
  'today.state.streak.history_action': '{count}-Tage-Verlauf ansehen',
  'today.state.streak.history': 'Verlauf ansehen',
  'today.state.streak.previous_label': 'Vorherige Serie',
  'today.state.streak.new_label': 'Neue Serie',
  'today.state.streak.starts_today': 'Beginnt heute',
  'today.state.streak.supporting_note':
    'Ein einziger Tag reicht für den Neustart. Menta löscht die frühere Serie nicht.',
  'today.state.returning.away_days': 'Du hast seit {count} nicht eingecheckt.',
  'today.state.returning.away': 'Du warst eine Weile nicht hier.',
  'today.state.returning.title': 'Fang dort an, wo du bist.',
  'today.state.returning.detail':
    '{awayCopy} Nichts wurde geändert. Wähle einen kleinen Schritt zurück.',
  'today.state.returning.action': 'Neu anfangen',
  'today.state.returning.history': 'Meinen Verlauf ansehen',
  'today.state.returning.fresh_start': 'Neustart',
  'today.state.returning.fresh_start_value':
    'Dein Verlauf bleibt. Du bestimmst den nächsten Schritt.',
  'today.state.returning.supporting_note':
    'Mach ein kleineres Versprechen oder öffne deinen Verlauf und kehre zum letzten zurück.',
  'today.state.no_promises.title': 'Noch ist nichts fällig.',
  'today.state.no_promises.detail':
    'Mach ein Versprechen. Menta zeigt dir dann jeden Tag, was deine Aufmerksamkeit braucht.',
  'today.state.no_promises.join_group': 'Einer bestehenden Gruppe beitreten',
  'today.state.proof_due.text_detail':
    'Füge die vereinbarte Notiz hinzu. Nur du und die prüfende Person können sie sehen.',
  'today.state.proof_due.text_action': 'Notiz als Nachweis hinzufügen',
  'today.state.proof_due.video_detail':
    'Füge das vereinbarte Video hinzu. Es bleibt privat für dieses Versprechen und die prüfende Person.',
  'today.state.proof_due.video_action': 'Nachweisvideo hinzufügen',
  'today.state.proof_due.photo_detail':
    'Füge das vereinbarte Foto hinzu. Es bleibt privat für dieses Versprechen und die prüfende Person.',
  'today.state.proof_due.photo_action': 'Nachweisfoto hinzufügen',
  'today.state.proof_due.risk_title': 'Heute zählt noch.',
  'today.state.proof_due.streak_risk_detail':
    'Deine Serie von {streak} ist noch aktiv. Füge möglichst {proofNoun} bis {dueLabel} hinzu. Der Nachweis zählt noch bis Mitternacht.',
  'today.state.proof_due.risk_detail':
    'Füge möglichst {proofNoun} bis {dueLabel} hinzu. Der Nachweis zählt noch bis Mitternacht.',
  'today.state.proof_due.log_action': 'Heutigen Nachweis eintragen',
  'today.state.proof_due.risk_note':
    'Kein Prüf- oder Tagesergebnis hat sich geändert. Als Nächstes reichst du den Nachweis ein.',
  'today.state.proof_due.title': 'Der Nachweis ist heute fällig.',
  'today.state.saved.unknown_title':
    'Menta konnte das Senden nicht bestätigen.',
  'today.state.saved.failed_title': 'Der Nachweis blieb auf diesem Telefon.',
  'today.state.saved.title': 'Dein Nachweis ist hier sicher.',
  'today.state.saved.unknown_detail':
    'Das Original ist weiterhin gespeichert. Prüfe seinen Status, bevor du es erneut versuchst.',
  'today.state.saved.failed_detail':
    'Prüfe deine Verbindung und versuch es erneut. Das Original bleibt auf diesem Telefon.',
  'today.state.saved.detail': 'Sende ihn, sobald du wieder verbunden bist.',
  'today.state.saved.check_action': 'Nachweisstatus prüfen',
  'today.state.saved.retry_action': 'Erneut senden',
  'today.state.saved.send_action': 'Gespeicherten Nachweis senden',
  'today.state.uploading.title': 'Dein Nachweis wird gesendet.',
  'today.state.uploading.detail':
    'Lass Menta geöffnet, bis das Senden bestätigt ist.',
  'today.state.uploading.action': 'Nachweis wird gesendet',
  'today.state.pending.named_title': '{promise} wartet auf Prüfung.',
  'today.state.pending.title': 'Dein Nachweis wartet auf Prüfung.',
  'today.state.pending.detail':
    'Er ist bei Menta angekommen. Das Ergebnis erscheint hier.',
  'today.state.pending.action': 'Nachweis ansehen',
  'today.state.correction.title': 'Dein Nachweis braucht eine Änderung.',
  'today.state.correction.detail':
    'Füge einen klareren Nachweis hinzu, um den Tag abzuschließen. Das Original bleibt gespeichert.',
  'today.state.correction.action': 'Nachweis ändern',
  'today.state.correction.feedback': 'Rückmeldung ansehen',
  'today.state.review.named_title': '{name} hat einen Nachweis gesendet.',
  'today.state.review.title': 'Ein Nachweis muss von dir geprüft werden.',
  'today.state.review.detail':
    'Prüfe das Foto. Bestätige es oder bitte um eine klare Änderung. Jede bestätigte Prüfung bringt {reward} Momenta, bis zu {dailyLimit} pro Tag.',
  'today.state.review.action': 'Nachweis prüfen',
  'today.state.review.see_group': 'Gruppe ansehen',
  'today.state.review.open_queue': 'Prüfliste öffnen',
  'today.state.group_risk.named_title': '{group} braucht einen Check-in.',
  'today.state.group_risk.title': 'Eine Gruppe braucht einen Check-in.',
  'today.state.group_risk.named_detail':
    'Öffne die Gruppe, um zu sehen, was fällig ist.',
  'today.state.group_risk.detail':
    'Öffne die Gruppe, um zu sehen, wer noch einchecken muss.',
  'today.state.group_risk.action': 'Gruppe öffnen',
  'today.state.accepted.named_title': '{promise} ist abgeschlossen.',
  'today.state.accepted.title': 'Heute ist abgeschlossen.',
  'today.state.accepted.detail':
    'Dein Nachweis wurde bestätigt und in deinem Verlauf gespeichert.',
  'today.state.accepted.named_receipt': '{promise} bestätigt',
  'today.state.accepted.receipt': 'Nachweis bestätigt',
  'today.state.accepted.receipt_detail':
    'Das heutige Ergebnis ist in deinem Versprechensverlauf bestätigt.',
  'today.state.all_clear.review_unknown_title':
    'Gerade ist kein Nachweis fällig.',
  'today.state.all_clear.title': 'Gerade braucht nichts deine Aufmerksamkeit.',
  'today.state.all_clear.review_unknown_detail':
    'Menta konnte Prüfanfragen nicht laden. Aktualisiere Heute erneut.',
  'today.state.all_clear.detail':
    'Komm zurück, wenn ein Versprechen fällig ist oder jemand einen Nachweis sendet.',
  'today.state.all_clear.review_status':
    'Kein Nachweis wartet auf deine Prüfung.',
} as const satisfies Pick<EnglishCatalogue, TodayStateKey>;
