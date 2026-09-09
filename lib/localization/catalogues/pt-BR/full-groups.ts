import type { EnglishCatalogue } from '@/lib/localization/en-NZ';

type FullGroupsKey = Extract<keyof EnglishCatalogue, `groups.${string}`>;

export const fullGroupsPtBR = {
  'groups.tab.title': 'Grupos',
  'groups.tab.archived': 'Grupos arquivados',
  'groups.tab.archived_hint': 'Abre seus grupos arquivados e concluídos.',
  'groups.tab.create': 'Criar grupo',
  'groups.tab.create_hint': 'Inicia a criação do grupo.',
  'groups.tab.mine': 'Meus',
  'groups.tab.mine_hint': 'Mostra os grupos aos quais você pertence.',
  'groups.tab.discover': 'Descobrir',
  'groups.tab.discover_hint':
    'Mostra grupos públicos dos quais você pode participar.',
  'groups.tab.invite_ready': 'Convite pronto para verificação',
  'groups.tab.enter_code': 'Digite um código de convite',
  'groups.tab.invite_hint': 'Abre a entrada de convite de grupo ou promessa.',
  'groups.tab.invite_row': 'Convite pronto para verificação',
  'groups.tab.enter_invite_row': 'Digite o código de convite',
  'groups.tab.invite_detail': 'Use um link, código QR ou código de convite.',
  'groups.tab.check': 'Verificar',
  'groups.tab.enter': 'Entrar',
  'groups.tab.sign_in_title': 'Login obrigatório',
  'groups.tab.sign_in_detail': 'Faça login antes de entrar neste grupo.',
  'groups.tab.invite_needed_title': 'Convite necessário',
  'groups.tab.invite_needed_detail':
    'Este grupo não é público. Use um código de quem já está dentro.',
  'groups.tab.joined_title': 'Grupo adicionado',
  'groups.tab.joined_action': 'Abrir grupo',
  'groups.tab.join_unknown_title': 'Entrada não confirmada',
  'groups.tab.join_unknown_detail':
    'Menta não pôde confirmar se você entrou. Verifique Meus grupos antes de tentar novamente.',
  'groups.tab.join_unknown_action': 'Verificar Meus grupos',
  'groups.tab.create_solo': 'Criar promessa individual',
  'groups.tab.enter_code_action': 'Digitar código',
  'groups.tab.sign_in': 'Entrar',
  'groups.tab.my_groups': 'Meus grupos',
  'groups.tab.try_again': 'Tentar novamente',
  'groups.tab.go_today': 'Ir para Hoje',
  'groups.tab.back_groups': 'Voltar para Grupos',
  'groups.tab.create_action': 'Criar grupo',
  'groups.tab.new': 'Novo',
  'groups.tab.joined_detail': '{group} agora está nos seus grupos.',
  'groups.tab.code_saved': 'Código {code} salvo neste telefone.',
  'groups.tab.join_action': 'Digite um código de convite',
  'groups.tab.offline_detail':
    'Estes são os últimos grupos salvos neste telefone. Conecte-se à internet antes de entrar, sair ou alterar um grupo.',
  'groups.tab.loading': 'Carregando seus grupos',
  'groups.tab.empty_title': 'Ainda não há grupos',
  'groups.tab.empty_detail': 'Crie um grupo ou entre com um convite.',
  'groups.tab.discover_empty_title': 'Nenhum grupo público',
  'groups.tab.discover_empty_detail':
    'Grupos públicos aparecerão aqui quando estiverem disponíveis.',
  'groups.tab.list_open_hint': 'Abre o painel do grupo.',
  'groups.tab.discover_open_hint':
    'Mostra os detalhes do grupo. Entrar é uma ação separada.',
  'groups.tab.discover_before_join':
    'Veja a promessa compartilhada e as regras de comprovação antes de entrar.',
  'groups.tab.known_group': 'Grupo conhecido · ações pausadas',
  'groups.list.your_groups': 'Seus grupos',
  'groups.list.public_groups': 'Grupos públicos',
  'groups.list.load_failed_detail':
    'Nada mudou. Tente novamente quando sua conexão estiver estável.',
  'groups.list.ended': 'Grupo encerrado · registro final disponível',
  'groups.list.archived': 'Arquivado · registro final disponível',
  'groups.list.streak': 'Sequência de grupo de {count} dias',
  'groups.list.view_before_joining': 'Ver {group} antes de entrar',
  'groups.archive.description': 'Grupos passados permanecem somente leitura.',
  'groups.archive.stale_detail':
    'Mostrando a última lista salva. Verifique novamente quando sua conexão estiver estável.',
  'groups.archive.stale_title': 'Grupos arquivados não atualizados',
  'groups.archive.groups': 'Grupos',
  'groups.archive.read_only': 'Somente leitura',
  'groups.archive.order': 'Ordem',
  'groups.archive.recent': 'Recentes',
  'groups.archive.newest_first': 'Mais novos primeiro',
  'groups.archive.history': 'Histórico',
  'groups.archive.open_hint': 'Abre este grupo no histórico somente leitura.',
  'groups.archive.open_label': 'Abrir grupo arquivado {group}',
  'groups.archive.check_again': 'Verificar novamente',
  'groups.archive.loading': 'Carregando grupos arquivados',
  'groups.archive.empty_label':
    'Nenhum grupo arquivado. Grupos que você arquivar ou terminar aparecerão aqui.',
  'groups.archive.empty_title': 'Nenhum grupo arquivado',
  'groups.archive.empty_detail':
    'Grupos que você arquivar ou terminar aparecerão aqui.',
  'groups.create.public_label': 'Qualquer um pode encontrá-lo',
  'groups.create.public_note':
    'O grupo está listado em Descobrir. As pessoas podem visualizá-lo e entrar sem precisar pedir a você.',
  'groups.create.private_label': 'Apenas pessoas que você convidar',
  'groups.create.private_note':
    'O grupo está oculto. As pessoas precisam do link de convite, código QR ou código para entrar.',
  'groups.create.missing_id': 'ID do grupo ausente.',
  'groups.create.load_error': 'Não foi possível carregar as configurações.',
  'groups.create.not_created_title': 'Grupo não criado',
  'groups.create.not_created_detail':
    'O grupo não pôde ser criado. Tente novamente.',
  'groups.create.name_prompt': 'Como você chamará este grupo?',
  'groups.create.name_help':
    'Use ao menos três caracteres para que as pessoas saibam o que estão entrando.',
  'groups.create.settings_prompt': 'Quem pode encontrar e entrar?',
  'groups.create.review_prompt': 'Pronto para criar este grupo?',
  'groups.create.choose_join': 'Escolha quem pode entrar',
  'groups.create.review_group': 'Analisar grupo',
  'groups.create.create_group': 'Criar grupo',
  'groups.create.name_heading': 'Nomear o grupo',
  'groups.create.sign_in_title': 'Login obrigatório',
  'groups.create.sign_in_detail':
    'Faça login antes de criar um grupo. Seu rascunho ainda está aqui.',
  'groups.create.promise_unavailable_title': 'Primeira promessa indisponível',
  'groups.create.promise_unavailable_detail':
    'Menta não pode conectar este grupo sem a primeira promessa confirmada. Seu rascunho de grupo ainda está aqui. Volte para Hoje e tente novamente.',
  'groups.create.name_short_detail': 'Use ao menos três caracteres.',
  'groups.create.default_description': 'Um grupo para sua primeira promessa.',
  'groups.create.cost_unknown_title':
    'Não foi possível confirmar o custo do grupo',
  'groups.create.cost_unknown_detail':
    'Menta não criou o grupo nem gastou Momenta. Verifique sua conexão e tente novamente.',
  'groups.create.paused_title': 'Criação de grupo pausada',
  'groups.create.cooldown_detail':
    'Você pode criar outro grupo depois que o período de espera atual terminar.',
  'groups.create.last_group': 'seu último grupo',
  'groups.create.cooldown_active.one':
    '{group} falhou recentemente, então a criação de grupos e entradas são pausadas por mais {hours} hora. Mantenha o ciclo de promessas avançando com uma comprovação individual enquanto o período de espera do grupo termina.',
  'groups.create.cooldown_active.other':
    '{group} falhou recentemente, então a criação de grupos e entradas são pausadas por mais {hours} horas. Mantenha o ciclo de promessas avançando com uma comprovação individual enquanto o período de espera do grupo termina.',
  'groups.create.cooldown_active':
    '{group} falhou recentemente, então a criação de grupos e entradas estão pausadas por {hours}. Mantenha o ciclo de promessas avançando com uma comprovação individual enquanto o período de espera do grupo termina.',
  'groups.create.limit_title': 'Limite gratuito atingido',
  'groups.create.limit_detail':
    'Seu rascunho ainda está aqui. Comece o Pro ou libere espaço antes de criar outro grupo.',
  'groups.create.momenta_title': 'Mais Momenta necessário',
  'groups.create.image': 'Imagem do grupo',
  'groups.create.image_accessibility': 'Imagem do grupo',
  'groups.create.group_name_label': 'Nome do grupo *',
  'groups.create.group_name_accessibility': 'Nome do grupo',
  'groups.create.group_name_placeholder': 'Movimento diário',
  'groups.create.image_help':
    'Escolha a imagem que as pessoas verão ao lado deste grupo.',
  'groups.create.reminders_detail':
    'Permitir lembretes de análise para este grupo. Os membros ainda controlam as notificações nos seus telefones.',
  'groups.create.your_group': 'Seu grupo',
  'groups.create.review_outcome':
    'Criar o grupo faz de você o primeiro membro. Ninguém mais entra até que você envie um convite, e você pode mudar o nome e as configurações depois.',
  'groups.create.back_from_creation': 'Voltar da criação de grupo',
  'groups.create.step': 'Etapa {current} de {total}',
  'groups.create.nothing_created': 'Ainda nada está sendo criado.',
  'groups.create.add_then_invite':
    'Adicione a primeira promessa, depois convide pessoas.',
  'groups.create.creating_detail':
    'Mantenha esta tela aberta enquanto a Menta cria o grupo.',
  'groups.create.entries_saved': 'Suas entradas ainda estão nesta tela.',
  'groups.create.review_reminders': 'Lembretes de análise',
  'groups.create.who_can_join': 'Quem pode entrar',
  'groups.create.on': 'Ativado',
  'groups.create.off': 'Desativado',
  'groups.create.creation_cost': 'Custo de criação',
  'groups.create.checking_cost': 'Verificando custo atual…',
  'groups.create.free': 'Gratuito',
  'groups.create.draft_saved': 'Rascunho salvo neste telefone',
  'groups.create.restoring_draft': 'Restaurando seu rascunho de grupo',
  'groups.create.creating': 'Criando {group}',
  'groups.create.creating_button': 'Criando…',
  'groups.create.try_again': 'Tente novamente',
  'groups.create.invite_people': 'Convidar pessoas',
  'groups.create.add_promise': 'Adicionar primeira promessa',
  'groups.create.open_group': 'Abrir grupo',
  'groups.create.go_today': 'Ir para Hoje',
  'groups.create.back': 'Voltar',
  'groups.create.exit_setup': 'Sair da configuração',
  'groups.create.restoring_button': 'Restaurando rascunho…',
  'groups.create.creating_label': 'Criando grupo',
  'groups.create.review_change': 'Alterar',
  'groups.create.checking_limits': 'Verificando limites do grupo',
  'groups.create.limits_detail':
    'Seu rascunho permanece neste telefone enquanto a verificação termina.',
  'groups.create.created_title': '{group} está pronto.',
  'groups.create.created_detail':
    'O grupo foi salvo. Nenhum convite foi enviado.',
  'groups.create.days': '{count} dias',
  'groups.create.days.one': '{count} dia',
  'groups.create.days.other': '{count} dias',
  'groups.create.group_details': 'Detalhes do grupo',
  'groups.create.membership': 'Associação',
  'groups.create.membership_value': 'Privado até alguém entrar',
  'groups.create.invitations': 'Convites',
  'groups.create.invitations_value': 'Pronto para compartilhar',
  'groups.create.first_promise': 'Primeira promessa',
  'groups.create.first_promise_value': 'Ainda não adicionado',
  'groups.create.starting_point': 'Ponto de partida',
  'groups.create.choose_start': 'Escolha um ponto de partida',
  'groups.create.choose_start_detail':
    'Use um ponto de partida simples ou comece com um grupo em branco.',
  'groups.create.blank_group': 'Começar com um grupo em branco',
  'groups.create.change_start': 'Alterar ponto de partida',
  'groups.create.change': 'Alterar',
  'groups.create.walking': 'Caminhada ou exercício',
  'groups.create.walking_detail':
    'Uma caminhada diária, sessão de exercício, alongamento ou esporte.',
  'groups.create.study': 'Estudo',
  'groups.create.study_detail': 'Uma sessão de estudo focada por dia.',
  'groups.create.creative': 'Trabalho criativo',
  'groups.create.creative_detail':
    'Vinte minutos de escrita, desenho, música ou criação.',
  'groups.create.reset': 'Reiniciar',
  'groups.create.reset_detail': 'Descanso, reflexão e rotinas silenciosas',
  'groups.create.cooldown_detail_group':
    'Você pode criar outro grupo depois que o período de espera de {group} terminar.',
  'groups.create.momenta_detail':
    'Este grupo custa {cost} Momenta e seu saldo é {balance}. Seu rascunho ainda está aqui.',
  'groups.create.spend_question': 'Gastar {cost} Momenta?',
  'groups.create.spend_detail':
    'Criar este grupo gasta {cost} Momenta e deixa {balance} no seu saldo.',
  'groups.create.spend_accessibility':
    'Confirmar gasto de {cost} Momenta. Seu saldo será {balance} Momenta.',
  'groups.create.created_accessibility': 'Grupo criado. {group} está pronto.',
  'groups.create.ready': '{group} está pronto',
  'groups.create.change_label': 'Alterar {label}',
  'groups.create.promise_not_linkable':
    'Sua promessa original não pode se tornar a promessa deste grupo porque já começou ou foi alterada. Seu rascunho ainda está aqui. Você pode voltar depois e criar explicitamente um grupo vazio.',
  'groups.create.group_already_confirmed':
    'Este grupo de introdução já foi confirmado com detalhes diferentes. Abra o grupo confirmado ao invés de criar outro.',
  'groups.create.first_group_unavailable':
    'Este grupo de primeira promessa só está disponível antes de você criar outro grupo. Seu rascunho ainda está aqui. Você pode voltar depois e criar explicitamente um grupo vazio.',
  'groups.create.insufficient_momenta':
    'Você não tem Momenta suficiente para criar este grupo.',
  'groups.create.link_failed':
    'Menta não pôde confirmar o grupo e a primeira promessa juntos. Seu rascunho ainda está aqui. Tente novamente.',
  'groups.create.image_move_label': 'Mover',
  'groups.create.image_focus_label': 'Focar',
  'groups.create.image_reset_label': 'Reiniciar',
  'groups.create.image_create_label': 'Criar',
  'groups.join.promise_title': 'Entrar na promessa',
  'groups.join.back': 'Voltar',
  'groups.join.loading_title': 'Verificando detalhes da entrada',
  'groups.join.loading_detail':
    'Estamos verificando esta promessa e seu saldo atual de Momenta.',
  'groups.join.loading_action': 'Verificando detalhes',
  'groups.join.loading_accessibility':
    'Verificando custo atual da entrada e saldo da carteira',
  'groups.join.review_detail':
    'Analise o custo e seu saldo. Nada muda até que você entre.',
  'groups.join.review_title': 'Entrar em {name}?',
  'groups.join.momenta_value': '{amount} Momenta',
  'groups.join.confirmed_title': 'Você está em {name}.',
  'groups.join.confirmed_detail':
    'Seu saldo de Momenta foi atualizado. Sua primeira comprovação está pronta neste {destination}.',
  'groups.join.debit': '−{amount}',
  'groups.join.confirm': 'Entrar com {cost} Momenta',
  'groups.join.maybe_later': 'Talvez depois',
  'groups.join.cost': 'Custo da entrada',
  'groups.join.available': 'Disponível agora',
  'groups.join.need_more_title': 'Você precisa de mais {shortfall} Momenta',
  'groups.join.need_more_detail': 'Você não foi cobrado, e ainda não entrou.',
  'groups.join.earn': 'Veja como ganhar',
  'groups.join.back_today': 'Voltar para Hoje',
  'groups.join.not_reserved_title': 'Seu lugar ainda não está reservado',
  'groups.join.not_reserved_detail':
    'Ganhe mais Momenta, então volte aqui para entrar.',
  'groups.join.receipt_label': 'Recibo da entrada',
  'groups.join.membership': 'Associação',
  'groups.join.joined': 'Entrou',
  'groups.join.momenta': 'Momenta',
  'groups.join.new_balance': 'Novo saldo · {balance}',
  'groups.join.no_charge': 'Sem cobrança',
  'groups.join.first_proof': 'Primeira comprovação',
  'groups.join.open_group': 'Abrir grupo',
  'groups.join.open_promise': 'Abrir promessa',
  'groups.join.check_status_title': 'Precisamos verificar se você entrou',
  'groups.join.check_status_detail':
    'A última solicitação terminou antes que a Menta recebesse um comprovante. Não faremos outra entrada até que a associação e o saldo sejam verificados.',
  'groups.join.check_status': 'Verificar status da entrada',
  'groups.join.return_today': 'Voltar para Hoje',
  'groups.join.second_paused_title': 'Uma segunda entrada está pausada',
  'groups.join.second_paused_detail':
    'Verificar o resultado existente impede associação ou cobrança duplicada.',
  'groups.join.failed_title': 'A entrada não pôde ser confirmada.',
  'groups.join.failed_detail':
    'Nenhuma associação ou cobrança de Momenta confirmada.',
  'groups.join.no_change': 'Nenhuma mudança confirmada',
  'groups.join.already_title': 'Você já está nesta promessa.',
  'groups.join.back_action': 'Voltar',
  'groups.join.boundary':
    'Sua associação e saldo de Momenta permanecem inalterados até que a Menta confirme a entrada.',
  'groups.join.sign_in_before': 'Faça login antes de entrar.',
  'groups.join.no_debit':
    'Nenhuma associação ou débito de Momenta foi efetuado.',
  'groups.join.incomplete': 'Este link de entrada está incompleto.',
  'groups.join.open_current':
    'Abra uma promessa atual ou peça um novo link de convite.',
  'groups.invite.title': 'Convidar pessoas',
  'groups.invite.back_group': 'Voltar ao grupo',
  'groups.invite.loading': 'Carregando convite ativo',
  'groups.invite.missing_group':
    'Este convite está sem grupo. Volte ao grupo e tente novamente.',
  'groups.invite.load_error':
    'Menta não pôde carregar este convite. Verifique sua conexão e tente novamente.',
  'groups.invite.copy_link': 'Copiar link de convite',
  'groups.invite.copy_code': 'Copiar código de convite',
  'groups.invite.copied': 'Copiado',
  'groups.invite.link_copied': 'Link de convite copiado.',
  'groups.invite.code_copied': 'Código de convite copiado.',
  'groups.invite.copy_error': 'O convite não foi copiado. Tente novamente.',
  'groups.invite.share': 'Compartilhar convite',
  'groups.invite.share_closed':
    'O convite ainda está aqui caso precise enviá-lo ou copiá-lo novamente.',
  'groups.invite.share_error':
    'A opção de compartilhamento não abriu. Tente novamente.',
  'groups.invite.replace': 'Substituir código de convite',
  'groups.invite.replace_loading': 'Substituindo…',
  'groups.invite.keep': 'Manter convite atual',
  'groups.invite.new_share': 'Compartilhar novo convite',
  'groups.invite.replace_question': 'Substituir este convite?',
  'groups.invite.current_code': 'Código atual',
  'groups.invite.stops_working': 'Parará de funcionar',
  'groups.invite.not_replaced': 'Convite não substituído',
  'groups.invite.new_ready': 'Novo convite pronto',
  'groups.invite.active_code': 'Código ativo',
  'groups.invite.active': 'Ativo',
  'groups.invite.show_qr': 'Exibir código QR',
  'groups.invite.hide_qr': 'Ocultar código QR',
  'groups.invite.show_qr_detail':
    'Abrir um código maior para alguém próximo escanear.',
  'groups.invite.replace_detail': 'O convite atual deixará de funcionar.',
  'groups.invite.try_again': 'Tentar novamente',
  'groups.invite.back': 'Voltar',
  'groups.invite.load_failed': 'Convite não carregou',
  'groups.invite.action_failed': 'Ação de convite falhou',
  'groups.invite.invite_to': 'Convidar pessoas para {group}',
  'groups.invite.intro':
    'Permita que alguém escaneie o código QR ou envie o link de convite. Eles podem ver o grupo antes de entrar.',
  'groups.invite.show_qr_full':
    'Exibir QR do convite em tela cheia. Convite {code}',
  'groups.invite.active_detail':
    'Ativo agora. Quem tem este convite pode ver o grupo antes de entrar.',
  'groups.invite.qr_title': 'QR do convite',
  'groups.invite.qr_heading': 'Escaneie para ver o grupo',
  'groups.invite.qr_detail':
    'Escanear abre os detalhes do grupo. Não entra no grupo.',
  'groups.invite.share_qr': 'Compartilhar QR',
  'groups.invite.qr_label': 'Código QR de convite de grupo para convite {code}',
  'groups.invite.no_code': 'Nenhum código de convite fornecido.',
  'groups.invite.group_invite': 'Convite de grupo',
  'groups.invite.share_title': 'Convidar pessoas para {group}',
  'groups.invite.share_returned': 'Convite pronto para compartilhar',
  'groups.invite.replaced_accessibility':
    'Novo convite pronto. O convite anterior não funciona mais.',
  'groups.invite.replace_error':
    'Menta não pôde confirmar um novo convite. Verifique o código atual antes de compartilhá-lo.',
  'groups.invite.replace_warning':
    'O link, código QR e código atuais deixarão de funcionar. Pessoas que já entraram permanecem no grupo.',
  'groups.invite.replaced_detail':
    'O convite anterior não funciona mais. Compartilhe este código a partir de agora.',
  'groups.preview.close': 'Fechar',
  'groups.preview.details_label': 'Detalhes do grupo {group}',
  'groups.preview.public': 'Público',
  'groups.preview.private': 'Somente por convite',
  'groups.preview.group': 'grupo',
  'groups.preview.no_description': 'Nenhuma descrição foi adicionada.',
  'groups.preview.people': 'Pessoas',
  'groups.preview.active_promises': 'Promessas ativas',
  'groups.preview.available_after_joining': 'Disponível após entrar',
  'groups.preview.current_streak': 'Sequência atual',
  'groups.preview.no_streak': 'Ainda não há sequência',
  'groups.preview.joining': 'Entrando...',
  'groups.preview.join': 'Entrar no grupo',
  'groups.preview.join_hint':
    'Entre neste grupo para participar de suas promessas compartilhadas.',
  'groups.preview.view_board': 'Ver painel',
  'groups.preview.view_board_hint':
    'Veja as promessas e membros do grupo antes de entrar.',
  'groups.preview.member': '{count} membros',
  'groups.preview.member.one': '{count} membro',
  'groups.preview.member.other': '{count} membros',
  'groups.preview.promise': '{count} promessas',
  'groups.preview.promise.one': '{count} promessa',
  'groups.preview.promise.other': '{count} promessas',
  'groups.preview.day': '{count} dias',
  'groups.preview.day.one': '{count} dia',
  'groups.preview.day.other': '{count} dias',
  'groups.admin.back': 'Voltar',
  'groups.admin.summary': 'Resumo do grupo',
  'groups.admin.details': 'Detalhes',
  'groups.admin.visibility': 'Visibilidade',
  'groups.admin.discoverable': 'Visível',
  'groups.admin.code_required': 'Código obrigatório',
  'groups.admin.people': 'Pessoas',
  'groups.admin.your_role': 'Seu cargo',
  'groups.admin.guest': 'Convidado',
  'groups.admin.who_join': 'Quem pode entrar',
  'groups.admin.selected': 'Selecionado',
  'groups.admin.review_reminders': 'Lembretes de análise',
  'groups.admin.reminders_detail':
    'Membros devem habilitar notificações no telefone.',
  'groups.admin.reminders_allowed': 'Lembretes de análise permitidos',
  'groups.admin.invitations': 'Convites',
  'groups.admin.manage_invite': 'Gerenciar convite',
  'groups.admin.manage_invite_detail':
    'Compartilhe ou substitua o convite atual.',
  'groups.admin.members': 'Membros',
  'groups.admin.members_detail': 'Veja cargos e acessos dos membros.',
  'groups.admin.people_count': '{count} pessoas',
  'groups.admin.open': 'Abrir',
  'groups.admin.group_missing_detail':
    'Este grupo não está mais disponível na lista atual.',
  'groups.admin.group_not_found': 'Grupo não encontrado',
  'groups.admin.settings_permission_detail':
    'Só proprietários e admins podem gerenciar estas configurações de grupo.',
  'groups.admin.settings_unavailable': 'Configurações indisponíveis',
  'groups.admin.group': 'Grupo',
  'groups.admin.ownership': 'Propriedade do grupo',
  'groups.admin.leave': 'Sair do grupo',
  'groups.admin.remove_account_detail': 'Remover sua conta deste grupo.',
  'groups.admin.transfer_unavailable':
    'Menta ainda não pode transferir a propriedade do grupo.',
  'groups.admin.delete': 'Excluir grupo',
  'groups.admin.delete_detail':
    'Remover este grupo permanentemente após confirmação.',
  'groups.admin.description': 'Gerenciar acesso, convites e membros.',
  'groups.admin.save': 'Salvar alterações',
  'groups.admin.saving': 'Salvando…',
  'groups.admin.settings': 'Configurações do grupo',
  'groups.admin.delete_question': 'Excluir grupo?',
  'groups.admin.delete_warning':
    'Isso exclui permanentemente o grupo, suas promessas compartilhadas, histórico de comprovações e acesso dos membros. Mantenha esta tela aberta até que Menta confirme o resultado.',
  'groups.admin.members_description':
    'Veja quem pertence a este grupo e qual cargo cada pessoa tem.',
  'groups.admin.members_manage_description':
    'Convidar pessoas ou mudar cargos dos membros.',
  'groups.admin.access': 'Acesso',
  'groups.admin.manage': 'Gerenciar',
  'groups.admin.view_only': 'Somente visualização',
  'groups.admin.invite_empty_detail':
    'Envie o convite primeiro. Os cargos dos membros aparecerão aqui quando alguém entrar.',
  'groups.admin.no_members': 'Ainda sem membros',
  'groups.admin.owner': 'Proprietário',
  'groups.admin.admins': 'Administradores',
  'groups.admin.member': 'Membro',
  'groups.admin.report': 'Denunciar membro',
  'groups.admin.make_admin': 'Tornar admin',
  'groups.admin.remove_admin': 'Remover cargo de admin',
  'groups.admin.remove_member': 'Remover membro',
  'groups.admin.manage_member': 'Gerenciar {member}',
  'groups.admin.view_member': 'Ver {member}',
  'groups.admin.member_hint': 'Abre ações do membro.',
  'groups.admin.member_readonly_hint': 'Detalhes do membro em modo leitura.',
  'groups.admin.locked': 'Bloqueado',
  'groups.admin.updating': 'Atualizando',
  'groups.admin.loading_members': 'Carregando membros',
  'groups.admin.loading_settings': 'Carregando configurações do grupo',
  'groups.admin.load_members_error':
    'Não foi possível carregar os membros do grupo.',
  'groups.admin.invite_people': 'Convidar pessoas',
  'groups.admin.member_actions_hint':
    'Abre denúncias. Gestores do grupo também veem ações de cargo e remoção.',
  'groups.admin.open_member_actions': 'Abir ações para {member}',
  'groups.board.you': 'Você',
  'groups.board.member_status_accessibility': '{name}. {status}. {detail}',
  'groups.board.submit_proof': 'Enviar sua comprovação',
  'groups.board.loading': 'Carregando painel do grupo',
  'groups.board.no_review': 'Nenhuma comprovação precisa de análise',
  'groups.board.review_one': '1 comprovação precisa de análise',
  'groups.board.review_many': '{count} comprovações precisam de análise',
  'groups.board.nothing_waiting': 'Não há nada aguardando análise no momento.',
  'groups.board.check_one':
    'Verifique antes que o resultado do grupo de hoje seja final.',
  'groups.board.check_many':
    'Verifique antes que o resultado do grupo de hoje seja final.',
  'groups.board.review_proof': 'Analisar comprovação',
  'groups.board.review_proofs': 'Analisar comprovações',
  'groups.board.proof_due': 'Comprovação devida hoje',
  'groups.board.add_proof_deadline':
    'Adicione sua comprovação antes de {deadline}.',
  'groups.board.daily_deadline': 'o prazo diário',
  'groups.board.add_proof': 'Adicionar comprovação',
  'groups.board.actions': 'Ações do grupo',
  'groups.board.promises': 'Promessas',
  'groups.board.shared_promise': 'Promessa compartilhada',
  'groups.board.open_rule': 'Abrir regra de comprovação de hoje.',
  'groups.board.live': 'Ao vivo',
  'groups.board.today': 'Hoje',
  'groups.board.approved_today': 'Aprovado hoje',
  'groups.board.approved_count': '{completed} de {total} aprovados',
  'groups.board.added_proof_count':
    '{count} de {total} adicionaram uma comprovação',
  'groups.board.today_board': 'Painel de hoje',
  'groups.board.public_group': 'Grupo público',
  'groups.board.member_count': '{count} membros',
  'groups.board.shared_promise_label': 'Promessa compartilhada',
  'groups.board.default_promise': 'Compareça e compartilhe comprovação',
  'groups.board.join_before_detail':
    'Abra o grupo para ver a promessa ativa antes de entrar.',
  'groups.board.join_cost': 'Custo de entrada',
  'groups.board.return_groups': 'Voltar aos grupos',
  'groups.board.read_only': 'Somente leitura',
  'groups.board.final_promise': 'Promessa final',
  'groups.board.final_rule':
    'A regra de comprovação final é preservada para referência.',
  'groups.board.proof_history': 'Histórico de comprovações',
  'groups.board.promise_rules': 'Regras da promessa',
  'groups.board.saved_board': 'Exibindo o painel salvo do grupo',
  'groups.board.saved_status': 'Status salvo',
  'groups.board.saved_approved':
    '{completed} de {total} comprovações foram aprovadas no painel salvo.',
  'groups.board.saved_proof_missing':
    'O status da comprovação de hoje não foi salvo neste telefone.',
  'groups.board.stale_detail':
    'Verifique novamente antes de entrar, sair, enviar comprovação ou analisá‑la.',
  'groups.board.stale_notice':
    '{updated}. Verifique novamente antes de entrar, sair, enviar comprovação ou analisá‑la.',
  'groups.board.stale_footnote':
    'Você ainda pode ler o histórico salvo. Conecte‑se à internet e tente novamente antes de mudar a participação, enviar comprovação, analisar comprovação ou enviar lembrete.',
  'groups.board.permission_title': 'Você não tem acesso a este grupo',
  'groups.board.offline_title': 'Este grupo não está disponível offline',
  'groups.board.unavailable_title': 'Este grupo não está disponível',
  'groups.board.permission_detail':
    'Sua conta não pode ler este grupo. Peça a um proprietário um convite atual.',
  'groups.board.offline_detail':
    'Não há painel salvo para exibir. Reconecte e tente o grupo ao vivo novamente.',
  'groups.board.unavailable_detail':
    'Pode ter sido removido, arquivado ou Tornado privado.',
  'groups.board.go_groups': 'Ir para Grupos',
  'groups.board.enter_code': 'Inserir outro código',
  'groups.detail.opening': 'Abrindo painel do grupo',
  'groups.detail.opening_detail':
    'Verificando membros, promessas compartilhadas e estado da análise de hoje.',
  'groups.detail.promises': 'Promessas',
  'groups.detail.reviews': 'Análises',
  'groups.detail.window': 'Janela',
  'groups.detail.preparing_promises':
    'Preparando a faixa de promessa compartilhada.',
  'groups.detail.checking_members':
    'Verificando quem pode enviar e analisar comprovações.',
  'groups.detail.load_failed': 'Não foi possível carregar o grupo.',
  'groups.detail.unavailable': 'Grupo indisponível',
  'groups.detail.unavailable_detail':
    'Este grupo pode estar arquivado, privado ou indisponível temporariamente.',
  'groups.detail.what_you_can_do': 'O que você pode fazer',
  'groups.detail.what_you_can_do_detail':
    'Tente novamente, volte aos Grupos ou peça ao proprietário do grupo um novo convite.',
  'groups.admin.discard_question': 'Descartar alterações?',
  'groups.admin.discard_detail': 'Suas edições não foram salvas.',
  'groups.admin.keep_editing': 'Continuar editando',
  'groups.admin.discard': 'Descartar alterações',
  'groups.admin.cannot_leave': 'Você ainda não pode sair deste grupo',
  'groups.admin.leave_question': 'Sair do grupo?',
  'groups.admin.transfer_warning':
    'Menta ainda não pode transferir a propriedade do grupo. Você pode manter o grupo ou excluí‑lo permanentemente. Nada muda até que você escolha uma ação.',
  'groups.admin.leave_detail':
    'Sua conta permanece no grupo até que a saída seja confirmada.',
  'groups.admin.close': 'Fechar',
  'groups.admin.cancel': 'Cancelar',
  'groups.admin.check_members': 'Verificar lista de membros novamente',
  'groups.admin.current_role': 'Cargo atual: {role}',
  'groups.admin.promote_question': 'Tornar admin?',
  'groups.admin.demote_question': 'Remover cargo de admin?',
  'groups.admin.promote_detail': '{member} poderá ajudar a gerenciar membros.',
  'groups.admin.demote_detail': '{member} voltará ao acesso de membro normal.',
  'groups.admin.remove_question': 'Remover membro?',
  'groups.admin.remove_warning':
    '{member} perderá acesso ao grupo. Comprovações passadas permanecem no histórico, mas ele não poderá enviar ou analisar novas promessas.',
  'groups.empty.shared_title': 'Ainda não há promessas compartilhadas',
  'groups.empty.shared_detail':
    'Adicione a primeira promessa para que todos saibam o que fazer e quais comprovações contam.',
  'groups.empty.add_promise': 'Adicionar primeira promessa',
  'groups.empty.invite_people': 'Convidar pessoas',
  'groups.empty.shared_note':
    'Nada vence até que a primeira promessa esteja ativa.',
  'groups.join.open_camera': 'Abrir câmera',
  'groups.join.scan_detail': 'Escaneie um código QR de convite de grupo.',
  'groups.join.enter_code_instead': 'Inserir código de convite em vez disso',
  'groups.join.code_required': 'Código de convite *',
  'groups.join.code_accessibility': 'Código de convite',
  'groups.join.code_placeholder': 'WALK-7K2',
  'groups.join.code_placeholder_long': 'ABCD2345',
  'groups.join.link_or_code': 'Link ou código de convite',
  'groups.join.find_invite': 'Encontrar convite',
  'groups.join.paste_clipboard': 'Colar da área de transferência',
  'groups.join.checking_invite': 'Verificando convite de grupo',
  'groups.join.not_now': 'Agora não',
  'groups.join.joining_long': 'Entrando…',
  'groups.join.continue_sign_in': 'Continuar o login',
  'groups.join.retry_preview': 'Repetir pré‑visualização',
  'groups.join.how_it_works': 'Como funciona',
  'groups.join.group_invite': 'Convite de grupo',
  'groups.join.shared_promise': 'Promessa compartilhada',
  'groups.join.close_scanner': 'Fechar scanner de convite',
  'groups.join.code_helper':
    'Cole o código da sua mensagem de convite ou do cartaz do grupo.',
  'groups.join.scan_mode_detail':
    'Abra a câmera somente quando alguém mostrar o QR do convite.',
  'groups.join.scan_prompt':
    'Aponte seu telefone para o cartaz ou QR do convite.',
  'groups.join.preview_intro':
    'Inserir um código apenas pré‑visualiza o grupo.',
  'groups.join.preview_free':
    'Participar pela primeira vez é gratuito, seja em uma promessa ou em um grupo. Qualquer custo é mostrado antes de confirmar.',
  'groups.join.preview_paid':
    'Entrar gasta {cost} Momenta. Seu código só é usado depois que o grupo aceita você.',
  'groups.join.preview_unknown':
    'Seu código só é usado depois que o grupo aceita você. Se a entrada custa Momenta, você verá o valor antes de qualquer gasto.',
  'groups.join.preview_free_membership': 'Esta entrada é gratuita.',
  'groups.join.preview_paid_detail':
    'Entrar gasta {cost} Momenta. A pré‑visualização não cobrará nada.',
  'groups.join.preview_unchanged':
    'Entrar adiciona você a este grupo. A pré‑visualização não alterou nada.',
  'groups.join.scan_qr': 'Escanear QR',
  'groups.join.scan_qr_accessibility': 'Escanear convite QR',
  'groups.join.paste_code': 'Colar código',
  'groups.join.paste_accessibility': 'Colar código de convite',
  'groups.join.sign_in': 'Entrar para participar',
  'groups.join.joining': 'Entrando...',
  'groups.join.screen_subtitle':
    'Cole um link ou insira um código. Você verá o grupo antes de entrar.',
  'groups.join.join_group': 'Entrar no grupo',
  'groups.join.details_toggle_show': 'Mostrar o que acontece após entrar',
  'groups.join.details_toggle_hide': 'Ocultar o que acontece após entrar',
  'groups.join.details_toggle': 'O que acontece quando eu entro?',
  'groups.join.details':
    'Você verá as promessas do grupo, enviará comprovações quando um registro for devido e analisará outras comprovações quando necessário. Um registro conta após um membro aceitar a comprovação. Comprovações, sequências e análises permanecem vinculados ao grupo.',
  'groups.join.receipt.already': 'Já é membro',
  'groups.join.receipt.joined': 'Grupo adicionado',
  'groups.join.receipt.group_fallback': 'o grupo',
  'groups.join.receipt.already_detail':
    'Nenhum Momenta gasto. Abra o quadro do grupo para continuar registrando.',
  'groups.join.receipt.free_detail':
    'Você entrou gratuitamente. Abra o grupo para ver as promessas.',
  'groups.join.receipt.spent_detail':
    'Você gastou {cost} Momenta. Abra o grupo para ver as promessas e o primeiro registro.',
  'groups.join.receipt.spent_label': 'Momenta gasto',
  'groups.join.receipt.zero': '0 Momenta',
  'groups.join.receipt.spent_value': '{cost} Momenta',
  'groups.join.receipt.next_move': 'Sua próxima ação',
  'groups.join.receipt.view_group': 'Ver grupo',
  'groups.join.receipt.view_groups': 'Ver grupos',
  'groups.join.receipt.use_another': 'Usar outro código',
  'groups.join.receipt.join_another': 'Entrar em outro grupo',
  'groups.join.show_momenta': 'Mostrar opções de Momenta',
  'groups.join.see_pro': 'Ver planos Pro',
  'groups.join.sign_in_now': 'Entrar agora',
  'groups.join.try_another': 'Tentar outro código',
  'groups.join.momenta_needed': 'Momenta necessário',
  'groups.join.cost_missing':
    'O custo de entrada não carregou. Volte ao convite e verifique novamente antes de entrar.',
  'groups.join.watch_ad': 'Assista a um anúncio para ganhar Momenta',
  'groups.join.see_pro_options': 'Ver opções Pro',
  'groups.join.cost_needed':
    'Entrar custa {cost} Momenta. Adicione Momenta suficiente e volte a este convite.',
  'groups.join.promise_invite_found': 'Convite de promessa encontrado',
  'groups.join.promise_invite_detail':
    'Este convite é de uma promessa, não de um grupo. Menta salvou‑o para que o app possa abri‑lo após entrar.',
  'groups.join.promise_invite_title': 'Este é um convite de promessa',
  'groups.join.promise_invite_saved':
    'Menta salvou‑o para o fluxo de promessa. Nenhuma entrada em grupo ocorreu.',
  'groups.join.enter_code_title': 'Insira um código de convite',
  'groups.join.invalid_detail':
    'Verifique o código e tente novamente. Nada mudou.',
  'groups.join.enter_code_detail': 'Cole o link ou código do convite do grupo.',
  'groups.join.expired_title': 'Este convite expirou',
  'groups.join.expired_detail': 'Peça ao dono do grupo um convite novo.',
  'groups.join.replaced_title': 'Este convite foi substituído',
  'groups.join.replaced_detail':
    'Peça ao dono do grupo o link ou código mais recente.',
  'groups.join.inactive_title': 'Este grupo não está mais ativo',
  'groups.join.inactive_detail':
    'Nenhuma associação foi alterada e nenhum Momenta foi gasto.',
  'groups.join.invalid_invite_detail':
    'Verifique o código ou solicite um novo convite.',
  'groups.join.sign_in_title': 'Entre para continuar',
  'groups.join.sign_in_detail': 'Volte a este convite após entrar.',
  'groups.join.preview_unavailable_title':
    'Pré‑visualização do convite indisponível',
  'groups.join.preview_unavailable_detail':
    'Menta não conseguiu verificar este convite. Nada mudou, então é seguro tentar novamente quando estiver online.',
  'groups.join.unavailable_title': 'Este convite não está disponível',
  'groups.join.unavailable_detail': 'Peça ao dono do grupo o convite atual.',
  'groups.join.qr_invalid_title': 'QR não continha convite de grupo',
  'groups.join.qr_invalid_detail':
    'Escaneie um QR de convite de grupo Menta ou digite o código manualmente.',
  'groups.join.missing_code_title': 'Código ausente',
  'groups.join.missing_code_detail':
    'Insira um código de convite ou escaneie um QR para continuar.',
  'groups.join.invalid_code_detail':
    'Verifique novamente o código ou escaneie o QR outra vez.',
  'groups.join.preview_first_title': 'Pré‑visualizar este convite primeiro',
  'groups.join.preview_first_detail': 'Menta não entrou nem alterou nada.',
  'groups.join.quota_title': 'Você atingiu o limite de grupos gratuitos',
  'groups.join.quota_detail':
    'Contas gratuitas podem estar em 2 grupos ativos. Saia de um ou faça upgrade para Pro para entrar neste grupo.',
  'groups.join.momenta_detail':
    'Entrar gasta {cost} Momenta e seu saldo é {balance}. Ganhe uma recompensa rápida ou use Pro, depois volte imediatamente a este convite.',
  'groups.join.join_group_title': 'Entrar em um grupo',
  'groups.join.invited_you': '{inviter} convidou você',
  'groups.join.invited_by': 'Convidado por {inviter}',
  'groups.join.how_it_works_detail':
    'Membros postam comprovação. Outro membro elegível analisa.',
  'groups.join.already_member_detail':
    'Você já está neste grupo. Não será feita segunda entrada.',
  'groups.join.inviter_invite': 'Convite de {inviter}',
  'groups.join.outcome_stale_title': 'Este convite não está mais ativo',
  'groups.join.outcome_stale_detail':
    'Peça ao dono do grupo um código novo. Nenhum Momenta foi gasto neste convite.',
  'groups.join.outcome_sign_in_title': 'Entre para continuar',
  'groups.join.outcome_sign_in_detail':
    'Seu convite fica pronto enquanto você entra, então pode tentar novamente.',
  'groups.join.outcome_momenta_title': 'Momenta necessário',
  'groups.join.outcome_momenta_detail':
    'Ganhe uma recompensa rápida ou use Pro, depois volte direto a este convite.',
  'groups.join.outcome_quota_title':
    'Você atingiu o limite de grupos gratuitos',
  'groups.join.outcome_quota_detail':
    'Contas gratuitas podem estar em 2 grupos ativos. Saia de um ou faça upgrade para Pro para entrar neste grupo.',
  'groups.join.outcome_closed_title': 'Grupo encerrado',
  'groups.join.outcome_closed_detail':
    'Este grupo não está mais ativo. Consulte o dono ou veja outros grupos.',
  'groups.join.outcome_retry_title': 'Entrada não confirmada',
  'groups.join.outcome_retry_detail':
    'Menta ainda não pôde confirmar sua presença. Seu código continua aqui, então tente novamente quando a conexão voltar.',
  'groups.referral.title': 'Deixe‑os escanear para entrar',
  'groups.referral.body':
    'Peça que escaneiem este código. Ele abre seu link de indicação.',
  'groups.referral.qr_label':
    'QR de convite de indicação. Escaneie para abrir o link do convite.',
  'groups.referral.qr_unavailable':
    'QR indisponível. Ainda pode usar as opções de compartilhar ou copiar abaixo.',
  'groups.referral.qr_preparing': 'Preparando seu código QR…',
  'groups.redirect.title': 'Entrar',
  'groups.redirect.invite_code': 'Código de convite',
  'groups.redirect.promise_saved': 'Convite de promessa salvo',
  'groups.redirect.promise_subtitle':
    'Verificando o link da promessa e seu estado de login.',
  'groups.redirect.invite_saved': 'Convite salvo',
  'groups.redirect.promise_detail':
    'A próxima tela mostrará o custo de entrada atual antes de qualquer alteração.',
  'groups.redirect.group_opening': 'Abrindo convite de grupo',
  'groups.redirect.group_subtitle':
    'Verificando o convite de grupo e seu login.',
  'groups.redirect.group_found': 'Convite de grupo encontrado',
  'groups.redirect.group_detail':
    'Você pode ver o grupo antes de decidir entrar.',
  'groups.redirect.needs_code': 'Link de convite precisa de código',
  'groups.redirect.needs_code_subtitle':
    'Este link de convite não contém código de grupo ou promessa.',
  'groups.redirect.missing_code': 'Código de convite ausente',
  'groups.redirect.missing_code_detail':
    'Pegue um novo link de convite ou digite o código do grupo manualmente.',
  'groups.redirect.opening': 'Abrindo convite',
  'groups.redirect.opening_subtitle':
    'Verificando o link do convite e seu estado de login.',
  'groups.redirect.one_moment': 'Um momento',
  'groups.redirect.checking': 'Menta está verificando o código do convite.',
  'groups.redirect.enter_group_code': 'Insira o código do grupo',
  'groups.redirect.without_invite': 'Continuar sem convite',
  'groups.redirect.referral_title': 'Convite',
  'groups.redirect.referral_missing_title':
    'Link de indicação precisa de código',
  'groups.redirect.referral_missing_subtitle':
    'Este link de indicação não contém o código que a Menta precisa.',
  'groups.redirect.referral_missing_notice': 'Código de indicação ausente',
  'groups.redirect.referral_missing_detail':
    'Peça ao seu amigo que reenvie o link de convite ou continue no Menta sem indicação.',
  'groups.redirect.without_referral': 'Continuar sem indicação',
  'groups.redirect.referral_existing_title': 'Indicação é para contas novas',
  'groups.redirect.referral_existing_subtitle':
    'Esta conta já está configurada, então a Menta não mudará sua indicação.',
  'groups.redirect.account_ready': 'Conta já configurada',
  'groups.redirect.account_ready_detail':
    'Links de indicação valem ao criar uma nova conta Menta. Sua conta atual permanece inalterada.',
  'groups.redirect.continue_menta': 'Continuar para Menta',
  'groups.redirect.referral_opening': 'Abrindo indicação',
  'groups.redirect.referral_opening_subtitle':
    'Estamos salvando a indicação e retornando ao Menta.',
  'groups.redirect.referral_saved': 'Indicação salva',
  'groups.redirect.referral_saved_detail':
    'A indicação foi salva e ficará visível enquanto você entrar ou criar sua conta.',
  'groups.redirect.referral_checking':
    'Menta está verificando a indicação antes de abrir o app.',
  'groups.detail.archive': 'Arquivar este grupo',
  'groups.detail.archive_detail':
    'Remova da lista ativa e mantenha o histórico.',
  'groups.detail.first_promise': 'Primeira promessa compartilhada',
  'groups.detail.first_promise_detail':
    'Adicione a promessa e a regra de comprovação que todos usarão.',
  'groups.detail.reviews_title': 'Análises',
  'groups.detail.invite': 'Convidar pessoas',
  'groups.detail.add_promise': 'Adicionar primeira promessa',
  'groups.detail.open_board': 'Abrir quadro',
  'groups.detail.review_later': 'Analisar depois',
  'groups.detail.commitments': 'Os compromissos que este grupo acompanha.',
  'groups.detail.add': 'Adicionar',
  'groups.detail.member_detail':
    'Pessoas que podem enviar e analisar comprovação.',
  'groups.detail.manage': 'Gerenciar',
  'groups.detail.no_members': 'Nenhum membro carregado',
  'groups.detail.no_members_detail':
    'Verifique o grupo novamente ou convide alguém.',
  'groups.detail.report': 'Denunciar grupo',
  'groups.detail.report_detail':
    'Denuncie conteúdo inseguro ou inadequado do grupo.',
  'groups.detail.invite_sheet_detail':
    'Copie o código ou abra o menu de compartilhamento.',
  'groups.detail.members_sheet_detail': 'Ver papéis e gerenciar acesso.',
  'groups.detail.settings_sheet_detail':
    'Altere o nome, quem pode entrar, convites e controles do dono.',
  'groups.detail.leave': 'Sair do grupo',
  'groups.detail.delete': 'Excluir grupo',
  'groups.detail.delete_detail': 'Exclui o grupo e seu histórico para todos.',
  'groups.detail.delete_warning':
    'Isto exclui permanentemente o grupo, suas promessas compartilhadas, histórico de comprovação e acesso dos membros para todos.',
  'groups.detail.cancel': 'Cancelar',
  'groups.detail.sign_in_detail': 'Faça login antes de entrar neste grupo.',
  'groups.detail.joined_title': 'Entrou',
  'groups.detail.joined_detail': 'Você está no grupo.',
  'groups.detail.join_failed': 'Falha ao entrar',
  'groups.detail.join_failed_detail': 'Não foi possível entrar neste grupo.',
  'groups.detail.left_title': 'Saiu do grupo',
  'groups.detail.left_detail': 'Você não pertence mais a este grupo.',
  'groups.detail.leave_unknown_title': 'Saída não confirmada',
  'groups.detail.leave_unknown_detail':
    'Menta não pôde confirmar se você saiu. Volte a Grupos e verifique sua associação antes de tentar novamente.',
  'groups.detail.leave_failed_title': 'Saída não concluída',
  'groups.detail.leave_warning':
    'Você deixará de aparecer neste grupo e não poderá enviar ou analisar novas promessas do grupo. Comprovações passadas permanecem no histórico.',
  'groups.detail.deleted_title': 'Grupo excluído',
  'groups.detail.deleted_detail':
    'O grupo, suas promessas compartilhadas e o histórico de comprovação foram removidos para todos.',
  'groups.detail.delete_unknown_title': 'Exclusão não confirmada',
  'groups.detail.delete_unknown_detail':
    'Menta não pôde confirmar se o grupo foi excluído. Volte a Grupos e verifique antes de tentar novamente.',
  'groups.detail.delete_failed_title': 'Grupo não excluído',
  'groups.detail.archive_failed_title': 'Falha ao arquivar',
  'groups.detail.archive_failed_detail':
    'Menta não pôde arquivar este grupo. Seu histórico e posição na lista ativa não foram alterados. Tente novamente.',
  'groups.detail.archived_title': 'Grupo arquivado',
  'groups.detail.archived_detail':
    'Ele está agora em Grupos Arquivados, e seu histórico ainda está disponível.',
  'groups.detail.day_streak': 'Sequência de {count} dias do grupo',
  'groups.detail.open_proof_detail': 'Abra sua comprovação neste grupo.',
  'groups.detail.member_board_detail': '{count} pessoas estão neste quadro.',
  'groups.detail.created_title': 'Grupo criado.',
  'groups.detail.created_detail':
    'Adicione a primeira promessa compartilhada e depois convide pessoas.',
  'groups.detail.privacy_group': 'Grupo {privacy}',
  'groups.detail.joined_count': '{count} entraram',
  'groups.detail.invite_ready': 'Link de convite pronto',
  'groups.detail.nudges_off': 'Lembretes desativados',
  'groups.detail.nudges_on': 'Lembretes ativados',
  'groups.detail.review_prompt_detail':
    'Verifique cada comprovação contra a promessa compartilhada.',
  'groups.detail.review_proof_count': 'Analisar {count} comprovações',
  'groups.detail.glance_title': 'Visão geral do grupo',
  'groups.detail.glance_detail':
    'Mantenha a promessa compartilhada, as pessoas e a próxima ação de responsabilidade visíveis enquanto usa o quadro.',
  'groups.detail.no_fixed_streak': 'Sem meta fixa de sequência',
  'groups.detail.review_against_promise':
    'Analisar contra a promessa compartilhada.',
  'groups.share.back_you': 'De volta a você',
  'groups.share.invite_someone': 'Convidar alguém',
  'groups.share.invite_someone_title': 'Convidar alguém para o Menta',
  'groups.share.preparing': 'Preparando seu convite',
  'groups.share.choose_where': 'Escolha onde compartilhar',
  'groups.share.ready_after_return': 'Pronto para compartilhar novamente',
  'groups.share.reward_confirmed': '{amount} Momenta adicionados',
  'groups.share.link_copied': 'Link copiado',
  'groups.share.unavailable': 'Link de convite indisponível',
  'groups.share.ready_detail':
    'Deixe‑os escanear o código ou compartilhe seu link de indicação.',
  'groups.share.preparing_detail':
    'Seu convite será aberto quando o link estiver pronto.',
  'groups.share.choose_where_detail':
    'Escolha uma pessoa ou aplicativo no menu de compartilhamento do seu telefone.',
  'groups.share.returned_detail':
    'Menta não consegue saber se o link foi enviado. Você pode compartilhá‑lo novamente ou copiá‑lo.',
  'groups.share.copied_detail':
    'Está na área de transferência deste telefone. Ainda não foi enviado.',
  'groups.share.unavailable_detail':
    'O link não foi copiado nem aberto. Tente novamente.',
  'groups.share.share_hint': 'Abre o menu de compartilhamento do seu telefone.',
  'groups.share.share_subtitle': 'Envie por qualquer app',
  'groups.share.share_link': 'Compartilhar link',
  'groups.share.copy_hint': 'Copia o link de convite para este telefone.',
  'groups.share.copy_subtitle': 'Cole onde desejar',
  'groups.share.copy_link': 'Copiar link',
  'groups.share.programme': 'Programa de indicação',
  'groups.share.checking_rewards': 'Verificando recompensas de indicação',
  'groups.share.checking_rewards_detail':
    'Você ainda pode compartilhar seu link ativo enquanto Menta verifica os termos de recompensa atuais.',
  'groups.share.terms_unavailable': 'Termos de recompensa indisponíveis',
  'groups.share.terms_unavailable_detail':
    'Você ainda pode compartilhar seu link. Menta mostrará os termos de recompensa quando puder confirmá‑los.',
  'groups.share.rewards_paused': 'Recompensas pausadas',
  'groups.share.paused_detail':
    'Você ainda pode compartilhar seu link, mas a Menta não adicionará Momenta de indicação enquanto o programa está pausado.',
  'groups.share.annual_limit': 'Limite anual',
  'groups.share.rewards_title': 'Suas recompensas de indicação',
  'groups.share.limit_resets': 'Limite reinicia',
  'groups.share.at_midnight': 'Às 00:00 UTC',
  'groups.share.retry_hint': 'Cria um novo link de convite.',
  'groups.share.preparing_label': 'Preparando convite',
  'groups.share.preparing_action': 'Preparando convite…',
  'groups.share.opening_handoff': 'Abrindo menu de compartilhamento',
  'groups.share.opening_action': 'Abrindo menu de compartilhamento…',
  'groups.share.share_again': 'Compartilhar novamente',
  'groups.share.message':
    'Junte‑se a mim no Menta. Use este link e crie sua primeira promessa para concluir a indicação.\n\n{link}',
  'groups.join.clipboard_empty': 'Área de transferência vazia',
  'groups.join.clipboard_empty_detail':
    'Copie um código de convite, volte e cole aqui.',
  'groups.join.code_pasted': 'Código colado',
  'groups.join.invite_ready': 'Código de convite pronto.',
  'groups.join.check_code': 'Verifique antes de entrar.',
  'groups.join.paste_failed': 'Falha ao colar',
  'groups.join.clipboard_error':
    'Menta não conseguiu ler sua área de transferência. Digite o código de convite.',
  'groups.share.limit_reached': 'Você atingiu seu limite de recompensas',
  'groups.share.both_earn': 'Vocês dois podem ganhar {amount} Momenta',
  'groups.share.limit_detail':
    'Você usou todas as {limit} recompensas de indicação disponíveis este ano. Um novo membro elegível ainda pode ganhar {amount} Momenta ao usar seu link e criar a primeira promessa, enquanto as recompensas estiverem ativas. Você pode ganhar novamente a partir de {date}.',
  'groups.share.eligible_detail':
    'Um novo membro elegível usa seu link e cria a primeira promessa. Se as recompensas ainda estiverem ativas, cada um ganha {amount} Momenta. Você pode ganhar até {limit} recompensas de indicação por ano.',
  'groups.navigation.no_saved_title': 'Nenhum convite salvo',
  'groups.navigation.no_saved_detail':
    'Cole um código ou abra um novo link de convite.',
  'groups.navigation.ready_title': 'Convite pronto para verificação',
  'groups.navigation.promise_ready_detail':
    'Veja a promessa e seus termos de entrada antes de qualquer mudança.',
  'groups.navigation.group_ready_detail':
    'Veja o grupo antes de decidir entrar.',
  'groups.navigation.invalid_title': 'Convite não é mais válido',
  'groups.navigation.invalid_detail':
    'O código salvo não pode ser usado. Peça um novo link de convite.',
  'groups.navigation.cleared_title': 'Convite salvo removido',
  'groups.navigation.cleared_detail': 'Menta aguardará um novo link.',
  'groups.navigation.sign_in_title': 'Login obrigatório',
  'groups.navigation.sign_in_detail': 'Faça login antes de abrir este convite.',
  'groups.funding.terms_mismatch':
    'Menta retornou termos de entrada para outro desafio.',
  'groups.funding.quote_unavailable':
    'Menta não pôde carregar os termos de entrada.',
  'groups.funding.quote_unavailable_detail':
    'Os detalhes da entrada não carregaram. Tente novamente antes de entrar.',
  'groups.funding.already_member':
    'A associação já existe. Nenhum débito ou recibo de entrada foi registrado.',
  'groups.funding.receipt_mismatch':
    'Menta retornou um recibo de entrada que não corresponde a esta solicitação.',
  'groups.funding.status_receipt_mismatch':
    'Menta retornou um recibo de entrada que não corresponde a esta verificação de status.',
  'groups.funding.join_unknown':
    'Menta não pôde confirmar se você entrou. Verifique sua associação antes de tentar novamente.',
  'groups.funding.status_membership_mismatch':
    'Menta retornou um status de associação para outro desafio.',
  'groups.funding.status_unknown':
    'Menta ainda não pôde verificar sua associação. Tente novamente.',
  'groups.funding.status_unavailable':
    'Menta ainda não pôde verificar esta entrada.',
  'groups.funding.member_without_receipt':
    'A associação está confirmada, mas não há recibo de débito de entrada. Nenhuma cobrança de Momenta está sendo feita.',
  'groups.funding.no_receipt':
    'Nenhuma associação ou recibo de entrada encontrado. Você pode reenviar a mesma solicitação com segurança.',
  'groups.source.accountability.saved_group_picker.open_action':
    'Fazer com um grupo',
  'groups.source.accountability.saved_group_picker.title': 'Fazer com um grupo',
  'groups.source.accountability.saved_group_picker.detail':
    'Escolha a qual grupo esta promessa pertence. Nada será compartilhado até você confirmar.',
  'groups.source.accountability.saved_group_picker.loading':
    'Carregando seus grupos',
  'groups.source.accountability.saved_group_picker.load_error_title':
    'Não foi possível carregar seus grupos',
  'groups.source.accountability.saved_group_picker.load_error_detail':
    'Sua promessa continua privada. Tente carregar seus grupos novamente.',
  'groups.source.accountability.saved_group_picker.empty_title':
    'Ainda não há grupos salvos',
  'groups.source.accountability.saved_group_picker.empty_detail':
    'Crie um grupo primeiro e depois volte para adicionar esta promessa.',
  'groups.source.accountability.saved_group_picker.people_unknown':
    'Número de pessoas indisponível',
  'groups.source.accountability.saved_group_picker.public': 'Público',
  'groups.source.accountability.saved_group_picker.private': 'Privado',
  'groups.source.accountability.saved_group_picker.row_hint':
    'Selecionar este grupo',
  'groups.source.accountability.saved_group_picker.row_accessibility':
    '{group}. {people}. {privacy}.',
  'groups.source.accountability.saved_group_picker.meta':
    '{people} · {privacy}',
  'groups.source.accountability.saved_group_picker.unknown_title':
    'Vínculo não confirmado',
  'groups.source.accountability.saved_group_picker.unknown_detail':
    'A Menta pode ter adicionado a promessa. Verifique novamente com a mesma solicitação antes de tentar outra coisa.',
  'groups.source.accountability.saved_group_picker.failed_title':
    'Promessa não adicionada',
  'groups.source.accountability.saved_group_picker.failed_detail':
    'Nada foi compartilhado. Escolha outro grupo ou feche esta janela.',
  'groups.source.accountability.saved_group_picker.confirmed':
    '{group} agora inclui esta promessa.',
  'groups.source.accountability.saved_group_picker.check_again':
    'Verificar novamente',
  'groups.source.accountability.saved_group_picker.close_for_now':
    'Fechar por enquanto',
  'groups.source.accountability.saved_group_picker.choose_another':
    'Escolher outro grupo',
  'groups.source.accountability.saved_group_picker.not_now': 'Agora não',
  'groups.source.accountability.saved_group_picker.continue_with':
    'Continuar com {group}',
  'groups.source.accountability.saved_group_picker.choose_group':
    'Escolher um grupo',
  'groups.source.accountability.saved_group_picker.create_new':
    'Criar um novo grupo',
  'groups.source.accountability.saved_group_picker.create_new_detail':
    'Use a configuração de grupo que você já conhece',
  'groups.source.accountability.saved_group_picker.create_new_accessibility':
    'Criar um novo grupo para esta promessa',
  'groups.source.accountability.saved_group_picker.create_handoff_failed_title':
    'Não foi possível abrir a configuração do grupo',
  'groups.source.accountability.saved_group_picker.create_handoff_failed_detail':
    'Sua promessa continua privada. Tente abrir a configuração do grupo novamente.',
  'groups.create.promise_link.missing_context_title':
    'Vínculo da promessa indisponível',
  'groups.create.promise_link.missing_context_detail':
    'Volte à promessa e abra a configuração do grupo novamente. Nenhum grupo foi criado.',
  'groups.create.promise_link.confirmed_accessibility':
    '{group} foi criado e agora inclui sua promessa.',
  'groups.create.promise_link.linking_title': 'Adicionando sua promessa…',
  'groups.create.promise_link.linking_detail':
    '{group} está pronto. A Menta está confirmando o vínculo da promessa.',
  'groups.create.promise_link.linking_button': 'Adicionando promessa…',
  'groups.create.promise_link.unknown_title':
    'Grupo criado. O vínculo precisa ser verificado.',
  'groups.create.promise_link.unknown_detail':
    '{group} está pronto, mas a Menta não confirmou se a promessa foi adicionada. Verifique novamente com a mesma solicitação.',
  'groups.create.promise_link.failed_title':
    'Grupo criado. Promessa não adicionada.',
  'groups.create.promise_link.failed_detail':
    '{group} está pronto e nada foi compartilhado. Volte à promessa para escolher o próximo passo.',
  'groups.create.promise_link.check_again': 'Verificar vínculo da promessa',
  'groups.create.promise_link.return_to_promise': 'Voltar à promessa',
} as const satisfies Partial<Pick<EnglishCatalogue, FullGroupsKey>>;
