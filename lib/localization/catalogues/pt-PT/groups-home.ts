import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type GroupsHomeKey = Extract<keyof EnglishCatalogue, `groupsHome.${string}`>;

export const groupsHomePtPT = {
  'groupsHome.summary.title': 'Grupos',
  'groupsHome.summary.view_all_accessibility': 'Ver todos os grupos',
  'groupsHome.summary.view_all': 'Ver todos',
  'groupsHome.summary.risk.safe': 'Em dia',
  'groupsHome.summary.risk.at_risk': 'Precisa de atenção',
  'groupsHome.summary.risk.critical': 'Crítico',
  'groupsHome.summary.risk.failed': 'Encerrado',
  'groupsHome.summary.risk.expired': 'Arquivado',
  'groupsHome.count.members': '{count} membros',
  'groupsHome.count.members.one': '{count} membro',
  'groupsHome.count.members.other': '{count} membros',
  'groupsHome.count.streak': 'sequência de {count} dias',
  'groupsHome.count.streak.one': 'sequência de {count} dia',
  'groupsHome.count.streak.other': 'sequência de {count} dias',
  'groupsHome.summary.meta': '{members} · {streak} · {risk}',
  'groupsHome.invites.title': 'Convites abertos',
  'groupsHome.invites.hide_accessibility': 'Ocultar convites abertos',
  'groupsHome.invites.browse_accessibility': 'Explorar convites abertos',
  'groupsHome.invites.hide': 'Ocultar',
  'groupsHome.invites.browse': 'Explorar',
  'groupsHome.invites.type.group': 'grupo',
  'groupsHome.invites.type.promise': 'promessa',
  'groupsHome.invites.saved_title': 'Convite de {type} guardado',
  'groupsHome.invites.saved_detail':
    'Guardámos o código {code} neste telemóvel. Abra novamente ou apague se o convite não funcionar mais.',
  'groupsHome.invites.open_saved': 'Abrir convite guardado',
  'groupsHome.invites.clear': 'Apagar',
  'groupsHome.invites.row_meta': '{members} · {streak}',
  'groupsHome.invites.empty_title': 'Nenhum grupo público',
  'groupsHome.invites.empty_detail':
    'Verifique novamente, entre com um código ou faça uma promessa pessoal.',
  'groupsHome.invites.check_again': 'Verificar novamente',
  'groupsHome.invites.join_code': 'Entrar com código',
  'groupsHome.invites.personal_promise': 'Fazer uma promessa pessoal',
  'groupsHome.groupAction.title': 'Para os seus grupos',
  'groupsHome.groupAction.waiting': '{count} a aguardar',
  'groupsHome.groupAction.waiting.one': '{count} a aguardar',
  'groupsHome.groupAction.waiting.other': '{count} a aguardar',
  'groupsHome.groupAction.review_named':
    'Analisar o comprovativo de {possessiveName}',
  'groupsHome.groupAction.review': 'Analisar comprovativo',
  'groupsHome.groupAction.review_group_meta':
    '{group} · Compare com a promessa',
  'groupsHome.groupAction.review_meta': 'Compare com a promessa',
  'groupsHome.groupAction.review_action': 'Analisar',
  'groupsHome.groupAction.pressure_named': '{group} precisa de um registo',
  'groupsHome.groupAction.pressure_detail':
    'Abra o grupo para ver o que ainda está pendente.',
  'groupsHome.groupAction.open_action': 'Abrir',
  'groupsHome.groupAction.empty_title': 'Nenhuma análise pendente',
  'groupsHome.groupAction.empty_detail':
    'Ninguém aguarda a sua análise neste momento.',
  'groupsHome.adminNotice.ownerOnlyTitle': 'Só a pessoa dona',
  'groupsHome.adminNotice.ownerOnlyDetail':
    'Só a pessoa dona pode guardar estas definições do grupo.',
  'groupsHome.adminNotice.nameRequiredTitle': 'Nome obrigatório',
  'groupsHome.adminNotice.nameRequiredDetail':
    'Dê um nome a este grupo antes de guardar.',
  'groupsHome.adminNotice.saveUnconfirmedTitle': 'Guardar não confirmado',
  'groupsHome.adminNotice.saveUnconfirmedDetail':
    'A Menta não conseguiu confirmar se as definições foram guardadas. As suas edições ainda estão aqui. Verifique o grupo antes de tentar novamente.',
  'groupsHome.adminNotice.savedTitle': 'Alterações guardadas',
  'groupsHome.adminNotice.savedDetail':
    'As definições do grupo estão atualizadas.',
  'groupsHome.adminNotice.saveFailedTitle': 'As alterações não foram guardadas',
  'groupsHome.adminNotice.saveFailedDetail':
    'Verifique a ligação e tente novamente. As suas edições ainda estão aqui.',
  'groupsHome.adminNotice.leaveUnknownTitle': 'Saída não confirmada',
  'groupsHome.adminNotice.leaveFailedTitle': 'O grupo não mudou',
  'groupsHome.adminNotice.deleteUnconfirmedTitle': 'Eliminação não confirmada',
  'groupsHome.adminNotice.deleteUnconfirmedDetail':
    'A Menta não conseguiu confirmar se o grupo foi eliminado. Volte a Grupos e verifique antes de tentar novamente.',
  'groupsHome.adminNotice.deleteFailedTitle': 'Grupo não eliminado',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
