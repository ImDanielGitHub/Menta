import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type GroupsHomeKey = Extract<keyof EnglishCatalogue, `groupsHome.${string}`>;

export const groupsHomeEsMX = {
  'groupsHome.summary.title': 'Grupos',
  'groupsHome.summary.view_all_accessibility': 'Ver todos los grupos',
  'groupsHome.summary.view_all': 'Ver todos',
  'groupsHome.summary.risk.safe': 'Al día',
  'groupsHome.summary.risk.at_risk': 'Necesita atención',
  'groupsHome.summary.risk.critical': 'Crítico',
  'groupsHome.summary.risk.failed': 'Finalizado',
  'groupsHome.summary.risk.expired': 'Archivado',
  'groupsHome.count.members': '{count} miembros',
  'groupsHome.count.members.one': '{count} miembro',
  'groupsHome.count.members.other': '{count} miembros',
  'groupsHome.count.streak': 'racha de {count} días',
  'groupsHome.count.streak.one': 'racha de {count} día',
  'groupsHome.count.streak.other': 'racha de {count} días',
  'groupsHome.summary.meta': '{members} · {streak} · {risk}',
  'groupsHome.invites.title': 'Invitaciones abiertas',
  'groupsHome.invites.hide_accessibility': 'Ocultar invitaciones abiertas',
  'groupsHome.invites.browse_accessibility': 'Explorar invitaciones abiertas',
  'groupsHome.invites.hide': 'Ocultar',
  'groupsHome.invites.browse': 'Explorar',
  'groupsHome.invites.type.group': 'grupo',
  'groupsHome.invites.type.promise': 'promesa',
  'groupsHome.invites.saved_title': 'Invitación de {type} guardada',
  'groupsHome.invites.saved_detail':
    'Guardamos el código {code} en este celular. Ábrelo de nuevo o bórralo si la invitación ya no funciona.',
  'groupsHome.invites.open_saved': 'Abrir invitación guardada',
  'groupsHome.invites.clear': 'Borrar',
  'groupsHome.invites.row_meta': '{members} · {streak}',
  'groupsHome.invites.empty_title': 'No hay grupos públicos',
  'groupsHome.invites.empty_detail':
    'Vuelve a comprobarlo, únete con un código o haz una promesa personal.',
  'groupsHome.invites.check_again': 'Revisar de nuevo',
  'groupsHome.invites.join_code': 'Unirme con un código',
  'groupsHome.invites.personal_promise': 'Crear una promesa personal',
  'groupsHome.groupAction.title': 'Para tus grupos',
  'groupsHome.groupAction.waiting': '{count} pendientes',
  'groupsHome.groupAction.waiting.one': '{count} pendiente',
  'groupsHome.groupAction.waiting.other': '{count} pendientes',
  'groupsHome.groupAction.review_named':
    'Revisar la prueba de {possessiveName}',
  'groupsHome.groupAction.review': 'Revisar prueba',
  'groupsHome.groupAction.review_group_meta':
    '{group} · Compárala con la promesa',
  'groupsHome.groupAction.review_meta': 'Compárala con la promesa',
  'groupsHome.groupAction.review_action': 'Revisar',
  'groupsHome.groupAction.pressure_named': '{group} necesita un registro',
  'groupsHome.groupAction.pressure_detail':
    'Abre el grupo para ver qué sigue pendiente.',
  'groupsHome.groupAction.open_action': 'Abrir',
  'groupsHome.groupAction.empty_title': 'No hay revisiones pendientes',
  'groupsHome.groupAction.empty_detail':
    'Ahora mismo nadie espera que revises tu prueba.',
} as const satisfies Pick<EnglishCatalogue, GroupsHomeKey>;
