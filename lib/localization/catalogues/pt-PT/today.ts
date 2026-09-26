import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayPtPT = {
  'today.progress.streak_days': '{count} dias',
  'today.progress.streak_days.one': '{count} dia',
  'today.progress.streak_days.other': '{count} dias',
  'today.progress.day_of': 'Dia {day} de {total}',
  'today.progress.day': 'Dia {day}',
  'today.progress.current_streak': 'Sequência atual',
  'today.progress.promise': 'Progresso da promessa',
  'today.progress.accessibility.current_streak': 'Sequência atual: {value}.',
  'today.progress.accessibility.promise': 'Progresso da promessa: {value}.',
  'today.all_clear.due_now': 'pendências agora',
  'today.all_clear.accessibility.zero_due': 'Nenhuma pendência agora.',
  'today.loading.accessibility': 'A carregar Hoje',
  'today.proof.heading': 'A seguir',
  'today.proof.solo': 'Individual',
  'today.proof.meta': '{group} · Dia {day}/{total} · {status}',
  'today.proof.status.waiting_review': 'a aguardar análise',
  'today.proof.status.approved': 'Comprovativo aprovado',
  'today.proof.status.correction_requested': 'Novo comprovativo solicitado',
  'today.proof.status.sent': 'Comprovativo enviado',
  'today.proof.status.due_now': 'Comprovativo pendente agora',
  'today.proof.status.due': 'Comprovativo pendente',
  'today.proof.action.view': 'Ver',
  'today.proof.action.update': 'Atualizar',
  'today.proof.action.write': 'Escrever',
  'today.proof.action.record': 'Gravar',
  'today.proof.action.add_photo': 'Adicionar fotografia',
  'today.proof.action.add_proof': 'Adicionar comprovativo',
  'today.proof.empty.title': 'Ainda não há promessas',
  'today.proof.empty.body':
    'Faça uma promessa e o seu primeiro registo aparecerá aqui.',
  'today.proof.empty.action': 'Fazer uma',
  'today.home.streak.caption': 'dias seguidos',
  'today.home.streak.accessibility':
    'Melhor sequência atual: {days}. {status} Mostra a sequência de cada promessa.',
  'today.home.streak.accessibility_none':
    'Ainda sem sequência. Mostra como as sequências são contadas.',
  'today.home.streak.status_kept': 'Hoje está aprovado.',
  'today.home.streak.status_waiting':
    'A prova de hoje está a aguardar revisão.',
  'today.home.streak.status_due': 'A prova de hoje ainda está pendente.',
  'today.home.streak.status_risk': 'A prova de hoje vence em breve.',
  'today.home.momenta.caption': 'Momenta',
  'today.home.momenta.accessibility': '{balance} Momenta. Abre a sua carteira.',
  'today.home.momenta.accessibility_unknown':
    'Saldo de Momenta ainda não confirmado. Abre a sua carteira.',
  'today.home.week.accessibility':
    'Últimos 7 dias: {count} dias com prova aprovada.',
  'today.home.week.accessibility.one':
    'Últimos 7 dias: {count} dia com prova aprovada.',
  'today.home.week.accessibility.other':
    'Últimos 7 dias: {count} dias com prova aprovada.',
  'today.home.streaks.title': 'As suas sequências',
  'today.home.streaks.note':
    'Uma sequência conta dias com prova aprovada, não dias com uma promessa aberta.',
  'today.home.streaks.empty':
    'A sua primeira sequência começa quando alguém aprova a sua prova.',
  'today.home.streaks.longest': 'Mais longa: {days}',
  'today.home.streaks.row_accessibility':
    '{promise}. Sequência {days}. {status}. Abre o histórico.',
  'today.home.receipt.accessibility': 'Promessa de hoje. {facts}',
  'today.home.receipt.proof': 'Prova',
  'today.home.receipt.progress': 'Progresso',
  'today.home.receipt.streak': 'Sequência',
  'today.home.receipt.group': 'Grupo',
  'today.home.receipt.today': 'Hoje',
  'today.home.receipt.photo': 'Foto',
  'today.home.receipt.video': 'Vídeo',
  'today.home.receipt.note': 'Nota escrita',
  'today.home.receipt.status_saved': 'Guardada neste telemóvel',
  'today.home.receipt.status_sending': 'A enviar',
  'today.home.also.detail': '{where} · {day}',
  'today.home.personal': 'Pessoal',
  'today.home.review_queue': 'Abrir a fila de revisão',
  'today.home.bubble.returning': 'Comece onde está.',
  'today.countdown.hours_minutes': '{hours}h {minutes}min',
  'today.countdown.hours': '{hours}h',
  'today.countdown.minutes': '{minutes} min',
  'today.countdown.left_proof': 'para adicionares a prova de hoje',
  'today.countdown.left_streak': 'para manter a sua sequência de {count} dias',
  'today.countdown.left_extension': 'restantes na sua prorrogação',
  'today.countdown.note_midnight': 'A prova conta até à meia-noite.',
  'today.countdown.note_last_hour':
    'Depois da meia-noite, este dia conta como falhado.',
  'today.countdown.note_extension':
    'A prova conta até ao fim da sua prorrogação.',
  'today.countdown.accessibility': '{duration} {caption}. {note}',
  'today.home.bubble.no_promises': 'O que anda sempre a dizer que vai fazer?',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
