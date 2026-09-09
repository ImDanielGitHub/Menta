import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NavigationKey = Extract<keyof EnglishCatalogue, `navigation.${string}`>;

export const navigationPtPT = {
  'navigation.tab.today': 'Hoje',
  'navigation.tab.groups': 'Juntos',
  'navigation.tab.create': 'Criar',
  'navigation.tab.profile': 'Perfil',
  'navigation.create.solo.title': 'Criar uma promessa individual',
  'navigation.create.solo.description':
    'Uma promessa. Um prazo para enviar o comprovativo. Sem pressão de grupo por enquanto.',
  'navigation.create.solo.action': 'Criar uma promessa individual',
  'navigation.create.accountability.title': 'Convidar alguém para uma promessa',
  'navigation.create.accountability.description':
    'Escolha quem participa, revê o comprovativo ou o apoia.',
  'navigation.create.accountability.action': 'Escolher uma promessa',
  'navigation.create.group.title': 'Criar um grupo',
  'navigation.create.group.description':
    'Convide outras pessoas quando o processo de comprovativo estiver claro para partilhar.',
  'navigation.create.group.action': 'Criar grupo',
  'navigation.create.recommended': 'Recomendado',
  'navigation.create.private_promise': 'Começar uma promessa privada',
  'navigation.personal.title': 'Promessas individuais',
  'navigation.personal.accessibility': 'Promessas individuais. {detail}',
  'navigation.personal.view': 'Ver suas promessas individuais',
  'navigation.personal.none': 'Nenhuma promessa individual ativa',
  'navigation.personal.active': '{count} promessas ativas',
  'navigation.personal.active.one': '{count} promessa ativa',
  'navigation.personal.active.other': '{count} promessas ativas',
  'navigation.personal.longest': '{active} · Série ativa mais longa: {days}',
  'navigation.notifications.accessibility': 'Definições de notificações',
  'navigation.notifications.hint':
    'Altere os lembretes e as preferências de notificações dos grupos.',
} as const satisfies Pick<EnglishCatalogue, NavigationKey>;
