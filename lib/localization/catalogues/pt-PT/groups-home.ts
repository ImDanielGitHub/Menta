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
  'groupsHome.groupAction.title': 'Para seus grupos',
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
  'groupsHome.groupAction.empty_detail': 'Ninguém aguarda sua análise agora.',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
