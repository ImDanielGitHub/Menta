import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NavigationKey = Extract<keyof EnglishCatalogue, `navigation.${string}`>;

export const navigationEsES = {
  'navigation.tab.today': 'Hoy',
  'navigation.tab.groups': 'Juntos',
  'navigation.tab.create': 'Crear',
  'navigation.tab.profile': 'Perfil',
  'navigation.create.solo.title': 'Crear una promesa personal',
  'navigation.create.solo.description':
    'Una promesa. Un plazo para enviar la prueba. De momento, sin presión de grupo.',
  'navigation.create.solo.action': 'Crear una promesa personal',
  'navigation.create.accountability.title': 'Invitar a alguien a una promesa',
  'navigation.create.accountability.description':
    'Elige quién participa, revisa las pruebas o te apoya.',
  'navigation.create.accountability.action': 'Elegir una promesa',
  'navigation.create.group.title': 'Crear un grupo',
  'navigation.create.group.description':
    'Invita a otras personas cuando tengas claro cómo funcionarán las pruebas.',
  'navigation.create.group.action': 'Crear grupo',
  'navigation.create.recommended': 'Recomendado',
  'navigation.create.private_promise': 'Empezar una promesa privada',
  'navigation.personal.title': 'Promesas personales',
  'navigation.personal.accessibility': 'Promesas personales. {detail}',
  'navigation.personal.view': 'Ver tus promesas personales',
  'navigation.personal.none': 'No hay promesas personales activas',
  'navigation.personal.active': '{count} promesas activas',
  'navigation.personal.active.one': '{count} promesa activa',
  'navigation.personal.active.other': '{count} promesas activas',
  'navigation.personal.longest': '{active} · Racha activa más larga: {days}',
  'navigation.notifications.accessibility': 'Ajustes de notificaciones',
  'navigation.notifications.hint':
    'Cambia los recordatorios y las preferencias de notificaciones de grupos.',
} as const satisfies Pick<EnglishCatalogue, NavigationKey>;
