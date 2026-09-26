import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type OnboardingKey = Extract<keyof EnglishCatalogue, `onboarding.${string}`>;

export const onboardingEsMX = {
  'onboarding.paywall.required':
    'Empieza tu compromiso con Menta Pro. Elige un plan para continuar.',
  'onboarding.paywall.capacity':
    'Mantén más compromisos y grupos activos a la vez.',
  'onboarding.welcome.title': 'Cumple las promesas que te haces.',
  'onboarding.welcome.body':
    'Empieza con una promesa. Ve paso a paso, un día a la vez.',
  'onboarding.welcome.action.start': 'Elegir mi primera promesa',
  'onboarding.welcome.action.sign_in': 'Ya uso Menta',
  'onboarding.meet.message':
    '¡Hola, soy Menta! Ayudo a la gente a hacer lo que dijo que haría.',
  'onboarding.obstacle.question': 'Sé sincero: ¿qué suele interponerse?',
  'onboarding.obstacle.fades': 'Empiezo con fuerza y luego se apaga',
  'onboarding.obstacle.unnoticed': 'Nadie se da cuenta cuando me lo salto',
  'onboarding.obstacle.forget': 'Se me olvida hasta que se acaba el día',
  'onboarding.obstacle.too_big': 'Mis metas se hacen demasiado grandes',
  'onboarding.evidence.stat': '76 %',
  'onboarding.evidence.title':
    'Quienes le contaban a un amigo cada semana alcanzaron su meta, o llegaron a la mitad, con mucha más frecuencia.',
  'onboarding.evidence.with_friend': 'Con un amigo',
  'onboarding.evidence.alone': 'Por su cuenta',
  'onboarding.evidence.alone_stat': '43 %',
  'onboarding.evidence.source':
    'Estudio sobre metas de la Dra. Gail Matthews, Dominican University of California. El grupo del 76 % también escribió sus metas y se comprometió con acciones concretas.',
  'onboarding.evidence.menta': 'Por esto te pido una prueba.',
  'onboarding.evidence.action': 'Crear mi primera promesa',
  'onboarding.proof.question': 'Cuando lo hagas, ¿cómo me lo vas a demostrar?',
  'onboarding.duration.question': '¿Cuánto tiempo quieres mantenerlo?',
  'onboarding.continue': 'Continuar',
  'onboarding.legal.terms_summary': 'Cómo funcionan tu cuenta y tus promesas.',
  'onboarding.legal.community_summary':
    'Pruebas aptas para todo público. Respeta la privacidad de los demás.',
  'onboarding.legal.privacy_summary': 'Qué recopila Menta y cómo lo usa.',
  'onboarding.preview.question': 'Esta es tu promesa. ¿Todo se ve bien?',
  'onboarding.accountability.question': '¿Quién debería revisar tu prueba?',
  'onboarding.accountability.trusted': 'Alguien de confianza',
  'onboarding.accountability.trusted_detail':
    'Verá tu prueba y la confirmará con un toque. Lo invitarás después de guardar.',
  'onboarding.accountability.private': 'Solo yo, por ahora',
  'onboarding.accountability.private_detail':
    'Mantenlo privado. Puedes invitar a alguien después.',
  'onboarding.accountability.recommended': 'Recomendado',
  'onboarding.accountability.note':
    'No se agrega a nadie hasta que envíes una invitación.',
} as const satisfies Pick<EnglishCatalogue, OnboardingKey>;
