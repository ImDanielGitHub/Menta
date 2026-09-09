import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsPtPT = {
  'notifications.topbar.back': 'Voltar',
  'notifications.topbar.context': 'Opcional',
  'notifications.topbar.title': 'Notificações',
  'notifications.education.title': 'Quer receber lembretes das suas promessas?',
  'notifications.education.body':
    'A Menta pode avisar antes do prazo de um comprovativo e quando alguém enviar um comprovativo para si analisar. Em seguida, seu telemóvel vai pedir permissão.',
  'notifications.education.proof_due.title': '“O comprovativo está pendente”',
  'notifications.education.proof_due.body':
    'Quando o prazo de uma promessa estiver próximo',
  'notifications.education.review.title':
    '“Um comprovativo precisa da sua análise”',
  'notifications.education.review.body':
    'Quando alguém enviar um comprovativo de uma promessa partilhada',
  'notifications.action.turn_on': 'Ativar lembretes',
  'notifications.action.continue_without': 'Continuar sem lembretes',
  'notifications.action.open_settings': 'Abrir definições do telemóvel',
  'notifications.action.retry': 'Tentar configurar os lembretes novamente',
  'notifications.action.back_to_settings':
    'Voltar às definições de notificações',
  'notifications.permission_prompt.hint':
    'Abre o pedido de permissão para notificações do seu telemóvel',
  'notifications.permission_off.title': 'Sem lembretes por enquanto',
  'notifications.permission_off.body':
    'Suas promessas continuam funcionando. Veja em Hoje o que está pendente ou ative os lembretes depois em Perfil.',
  'notifications.permission_off.later.title': 'Ative depois',
  'notifications.permission_off.later.body':
    'Abra Perfil e depois Notificações.',
  'notifications.registration_pending.title':
    'Os lembretes ainda não estão prontos',
  'notifications.registration_pending.body':
    'Tente novamente antes de depender dos lembretes ou continuar e ative-os depois.',
  'notifications.phone.title': 'Notificações do telemóvel',
  'notifications.phone.allowed': 'As notificações estão permitidas',
  'notifications.phone.allowed_by_phone': 'Permitidas por este telemóvel',
  'notifications.status.on': 'Ativadas',
  'notifications.menta.title': 'Lembretes da Menta',
  'notifications.menta.not_connected': 'Este aparelho ainda não está ligado',
  'notifications.menta.connected': 'Este aparelho está ligado',
  'notifications.status.checking': 'A verificar…',
  'notifications.status.not_ready': 'Não estão prontos',
  'notifications.status.ready': 'Prontos',
  'notifications.granted.title':
    'Este telemóvel está pronto para receber notificações da Menta',
  'notifications.granted.body':
    'Escolha nas definições de notificações quais lembretes a pessoa quer receber.',
  'notifications.notice.setup_failed.title':
    'A configuração dos lembretes não foi concluída',
  'notifications.notice.setup_failed.body':
    'Tente novamente ou continuar sem lembretes.',
  'notifications.notice.still_off.title':
    'As notificações continuam desativadas',
  'notifications.notice.still_off.body':
    'Suas promessas continuam funcionando. A Menta não vai pedir novamente neste ecrã.',
  'notifications.notice.allowed.title':
    'O seu telemóvel agora permite notificações',
  'notifications.notice.allowed.body':
    'A Menta está a terminar de configurar os lembretes neste telemóvel.',
  'notifications.notice.check_failed.title':
    'Não foi possível verificar a configuração de notificações',
  'notifications.notice.continue_later.body':
    'Pode continuar sem lembretes e tentar novamente depois.',
  'notifications.notice.sign_in.title':
    'Entre na sua conta para configurar lembretes',
  'notifications.notice.sign_in.body':
    'A Menta precisa de uma conta para guardar as escolhas de lembretes deste telemóvel.',
  'notifications.notice.prompt_failed.title':
    'Não foi possível abrir o pedido de notificações',
  'notifications.notice.settings_opening.title':
    'As definições do seu telemóvel estão abrindo',
  'notifications.notice.settings_opening.body':
    'Escolha se a Menta pode enviar notificações e depois volte para este ecrã.',
  'notifications.notice.settings_failed.title':
    'Não foi possível abrir as definições',
  'notifications.notice.settings_failed.body':
    'Abra as definições do telemóvel, escolha Menta e depois Notificações para alterar essa permissão.',
  'notifications.onboarding.title': 'Não perca o momento.',
  'notifications.onboarding.body':
    'A Menta precisa de permissão para enviar lembretes quando uma prova estiver próxima ou alguém precisar da sua revisão.',
  'notifications.onboarding.trust':
    'Apenas os lembretes que escolher. Pode alterar quando quiser.',
  'notifications.onboarding.card.title': 'Prova vence em 30 min',
  'notifications.onboarding.card.body': 'Prometeu. Chegue até ao fim.',
  'notifications.onboarding.action.turn_on': 'Ativar notificações',
  'notifications.onboarding.action.not_now': 'Agora não',
  'notifications.onboarding.permission_off.title': 'Não faz mal.',
  'notifications.onboarding.permission_off.body':
    'A Menta funciona sem notificações. Pode ativar os lembretes mais tarde nas Definições.',
  'notifications.onboarding.permission_off.action': 'Continuar',
  'notifications.onboarding.permission_off.settings': 'Abrir definições',
  'notifications.onboarding.granted.title': 'Está tudo pronto.',
  'notifications.onboarding.granted.body':
    'A Menta terminará de ligar os lembretes depois de iniciar sessão.',
  'notifications.onboarding.granted.action': 'Continuar para iniciar sessão',
  'notifications.onboarding.card.accessibility':
    'Pré-visualização de uma notificação da Menta. Prova vence em 30 minutos. Prometeu. Chegue até ao fim.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
