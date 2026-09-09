import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type TodayKey = Extract<keyof EnglishCatalogue, `today.${string}`>;

export const todayPtBR = {
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
  'today.loading.accessibility': 'Carregando Hoje',
  'today.proof.heading': 'A seguir',
  'today.proof.solo': 'Individual',
  'today.proof.meta': '{group} · Dia {day}/{total} · {status}',
  'today.proof.status.waiting_review': 'Aguardando análise',
  'today.proof.status.approved': 'Comprovação aprovada',
  'today.proof.status.correction_requested': 'Nova comprovação solicitada',
  'today.proof.status.sent': 'Comprovação enviada',
  'today.proof.status.due_now': 'Comprovação pendente agora',
  'today.proof.status.due': 'Comprovação pendente',
  'today.proof.action.view': 'Ver',
  'today.proof.action.update': 'Atualizar',
  'today.proof.action.write': 'Escrever',
  'today.proof.action.record': 'Gravar',
  'today.proof.action.add_photo': 'Adicionar foto',
  'today.proof.action.add_proof': 'Adicionar comprovação',
  'today.proof.empty.title': 'Ainda não há promessas',
  'today.proof.empty.body':
    'Faça uma promessa e seu primeiro registro aparecerá aqui.',
  'today.proof.empty.action': 'Fazer uma',
} as const satisfies Partial<Pick<EnglishCatalogue, TodayKey>>;
