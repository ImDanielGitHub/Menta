import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type NotificationsKey = Extract<
  keyof EnglishCatalogue,
  `notifications.${string}`
>;

export const notificationsPtBR = {
  'notifications.topbar.back': 'Voltar',
  'notifications.topbar.context': 'Opcional',
  'notifications.topbar.title': 'Notificações',
  'notifications.education.title': 'Quer receber lembretes das suas promessas?',
  'notifications.education.body':
    'A Menta pode avisar antes do prazo de uma comprovação e quando alguém enviar uma comprovação para você analisar. Em seguida, seu celular vai pedir permissão.',
  'notifications.education.proof_due.title': '“A comprovação está pendente”',
  'notifications.education.proof_due.body':
    'Quando o prazo de uma promessa estiver próximo',
  'notifications.education.review.title':
    '“Uma comprovação precisa da sua análise”',
  'notifications.education.review.body':
    'Quando alguém enviar uma comprovação de uma promessa compartilhada',
  'notifications.action.turn_on': 'Ativar lembretes',
  'notifications.action.continue_without': 'Continuar sem lembretes',
  'notifications.action.open_settings': 'Abrir configurações do celular',
  'notifications.action.retry': 'Tentar configurar os lembretes novamente',
  'notifications.action.back_to_settings':
    'Voltar às configurações de notificações',
  'notifications.permission_prompt.hint':
    'Abre o pedido de permissão para notificações do seu celular',
  'notifications.permission_off.title': 'Sem lembretes por enquanto',
  'notifications.permission_off.body':
    'Suas promessas continuam funcionando. Veja em Hoje o que está pendente ou ative os lembretes depois em Perfil.',
  'notifications.permission_off.later.title': 'Ative depois',
  'notifications.permission_off.later.body':
    'Abra Perfil e depois Notificações.',
  'notifications.registration_pending.title':
    'Os lembretes ainda não estão prontos',
  'notifications.registration_pending.body':
    'Tente novamente antes de depender dos lembretes ou continue e ative-os depois.',
  'notifications.phone.title': 'Notificações do celular',
  'notifications.phone.allowed': 'As notificações estão permitidas',
  'notifications.phone.allowed_by_phone': 'Permitidas por este celular',
  'notifications.status.on': 'Ativadas',
  'notifications.menta.title': 'Lembretes da Menta',
  'notifications.menta.not_connected': 'Este aparelho ainda não está conectado',
  'notifications.menta.connected': 'Este aparelho está conectado',
  'notifications.status.checking': 'Verificando…',
  'notifications.status.not_ready': 'Não estão prontos',
  'notifications.status.ready': 'Prontos',
  'notifications.granted.title':
    'Este celular está pronto para receber notificações da Menta',
  'notifications.granted.body':
    'Escolha nas configurações de notificações quais lembretes você quer receber.',
  'notifications.notice.setup_failed.title':
    'A configuração dos lembretes não foi concluída',
  'notifications.notice.setup_failed.body':
    'Tente novamente ou continue sem lembretes.',
  'notifications.notice.still_off.title':
    'As notificações continuam desativadas',
  'notifications.notice.still_off.body':
    'Suas promessas continuam funcionando. A Menta não vai pedir novamente nesta tela.',
  'notifications.notice.allowed.title':
    'Seu celular agora permite notificações',
  'notifications.notice.allowed.body':
    'A Menta está terminando de configurar os lembretes neste celular.',
  'notifications.notice.check_failed.title':
    'Não foi possível verificar a configuração de notificações',
  'notifications.notice.continue_later.body':
    'Você pode continuar sem lembretes e tentar novamente depois.',
  'notifications.notice.sign_in.title':
    'Entre na sua conta para configurar lembretes',
  'notifications.notice.sign_in.body':
    'A Menta precisa de uma conta para salvar as escolhas de lembretes deste celular.',
  'notifications.notice.prompt_failed.title':
    'Não foi possível abrir o pedido de notificações',
  'notifications.notice.settings_opening.title':
    'As configurações do seu celular estão abrindo',
  'notifications.notice.settings_opening.body':
    'Escolha se a Menta pode enviar notificações e depois volte para esta tela.',
  'notifications.notice.settings_failed.title':
    'Não foi possível abrir as configurações',
  'notifications.notice.settings_failed.body':
    'Abra as configurações do celular, escolha Menta e depois Notificações para alterar essa permissão.',
  'notifications.onboarding.title': 'Não perca o momento.',
  'notifications.onboarding.body':
    'A Menta precisa de permissão para enviar lembretes quando uma prova estiver próxima ou alguém precisar da sua revisão.',
  'notifications.onboarding.trust':
    'Somente os lembretes que você escolher. Mude quando quiser.',
  'notifications.onboarding.card.title': 'Prova vence em 30 min',
  'notifications.onboarding.card.body': 'Você prometeu. Vá até o fim.',
  'notifications.onboarding.action.turn_on': 'Ativar notificações',
  'notifications.onboarding.action.not_now': 'Agora não',
  'notifications.onboarding.permission_off.title': 'Tudo bem.',
  'notifications.onboarding.permission_off.body':
    'A Menta funciona sem notificações. Você pode ativar os lembretes mais tarde nas Configurações.',
  'notifications.onboarding.permission_off.action': 'Continuar',
  'notifications.onboarding.permission_off.settings': 'Abrir configurações',
  'notifications.onboarding.granted.title': 'Tudo pronto.',
  'notifications.onboarding.granted.body':
    'A Menta terminará de conectar os lembretes depois que você entrar na conta.',
  'notifications.onboarding.granted.action': 'Continuar para entrar',
  'notifications.onboarding.card.accessibility':
    'Prévia de uma notificação da Menta. Prova vence em 30 minutos. Você prometeu. Vá até o fim.',
} as const satisfies Pick<EnglishCatalogue, NotificationsKey>;
