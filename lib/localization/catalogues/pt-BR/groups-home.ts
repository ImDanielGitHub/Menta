import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type GroupsHomeKey = Extract<keyof EnglishCatalogue, `groupsHome.${string}`>;

export const groupsHomePtBR = {
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
  'groupsHome.invites.saved_title': 'Convite de {type} salvo',
  'groupsHome.invites.saved_detail':
    'Salvamos o código {code} neste celular. Abra novamente ou apague se o convite não funcionar mais.',
  'groupsHome.invites.open_saved': 'Abrir convite salvo',
  'groupsHome.invites.clear': 'Apagar',
  'groupsHome.invites.row_meta': '{members} · {streak}',
  'groupsHome.invites.empty_title': 'Nenhum grupo público',
  'groupsHome.invites.empty_detail':
    'Verifique novamente, entre com um código ou faça uma promessa pessoal.',
  'groupsHome.invites.check_again': 'Verificar novamente',
  'groupsHome.invites.join_code': 'Entrar com código',
  'groupsHome.invites.personal_promise': 'Fazer uma promessa pessoal',
  'groupsHome.groupAction.title': 'Para seus grupos',
  'groupsHome.groupAction.waiting': '{count} aguardando',
  'groupsHome.groupAction.waiting.one': '{count} aguardando',
  'groupsHome.groupAction.waiting.other': '{count} aguardando',
  'groupsHome.groupAction.review_named':
    'Analisar a comprovação de {possessiveName}',
  'groupsHome.groupAction.review': 'Analisar comprovação',
  'groupsHome.groupAction.review_group_meta':
    '{group} · Compare com a promessa',
  'groupsHome.groupAction.review_meta': 'Compare com a promessa',
  'groupsHome.groupAction.review_action': 'Analisar',
  'groupsHome.groupAction.pressure_named': '{group} precisa de um registro',
  'groupsHome.groupAction.pressure_detail':
    'Abra o grupo para ver o que ainda está pendente.',
  'groupsHome.groupAction.open_action': 'Abrir',
  'groupsHome.groupAction.empty_title': 'Nenhuma análise pendente',
  'groupsHome.groupAction.empty_detail': 'Ninguém aguarda sua análise agora.',
  'groupsHome.adminNotice.ownerOnlyTitle': 'Só a pessoa dona',
  'groupsHome.adminNotice.ownerOnlyDetail':
    'Só a pessoa dona pode salvar estas configurações do grupo.',
  'groupsHome.adminNotice.nameRequiredTitle': 'Nome obrigatório',
  'groupsHome.adminNotice.nameRequiredDetail':
    'Dê um nome a este grupo antes de salvar.',
  'groupsHome.adminNotice.saveUnconfirmedTitle': 'Salvamento não confirmado',
  'groupsHome.adminNotice.saveUnconfirmedDetail':
    'A Menta não pôde confirmar se as configurações foram salvas. Suas edições ainda estão aqui. Confira o grupo antes de tentar de novo.',
  'groupsHome.adminNotice.savedTitle': 'Alterações salvas',
  'groupsHome.adminNotice.savedDetail':
    'As configurações do grupo estão atualizadas.',
  'groupsHome.adminNotice.saveFailedTitle': 'As alterações não foram salvas',
  'groupsHome.adminNotice.saveFailedDetail':
    'Verifique sua conexão e tente de novo. Suas edições ainda estão aqui.',
  'groupsHome.adminNotice.leaveUnknownTitle': 'Saída não confirmada',
  'groupsHome.adminNotice.leaveFailedTitle': 'O grupo não mudou',
  'groupsHome.adminNotice.deleteUnconfirmedTitle': 'Exclusão não confirmada',
  'groupsHome.adminNotice.deleteUnconfirmedDetail':
    'A Menta não pôde confirmar se o grupo foi excluído. Volte a Grupos e confira antes de tentar de novo.',
  'groupsHome.adminNotice.deleteFailedTitle': 'Grupo não excluído',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
