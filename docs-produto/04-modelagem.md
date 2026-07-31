# .docs 04 — Modelagem de Domínio e Dados

## Objetivo

Descrever as entidades centrais do domínio do RevendaClick, seus atributos essenciais e relacionamentos — a base conceitual sobre a qual o modelo de dados real (tabelas, migrações) é construído.

> Validado entidade a entidade com o usuário (sessões de 2026-07-06 e 2026-07-31), a partir da modelagem da versão anterior (~37 migrations em Supabase/Postgres) como ponto de partida. As 11 entidades abaixo são **confirmadas** para o novo repositório.

## Quando Utilizar

- Antes de criar ou alterar uma migração de banco de dados (ver [`11-contexto-tecnico.md`](11-contexto-tecnico.md), seção de banco).
- Ao introduzir um novo conceito de domínio, para verificar se já é coberto por uma entidade existente.
- Ao explicar o sistema para alguém novo no projeto.

## Estrutura

### Entidades centrais

#### Tenant (Revenda)
- **Objetivo**: representar a revenda/concessionária cliente da plataforma e servir como raiz de isolamento multi-tenant de todos os dados de negócio.
- **Campos**: `id` (UUID), `slug` (único, vitrine pública), `nome_fantasia`, `razao_social`, `cnpj`, `telefone`, `whatsapp`, `email`, `cidade`, `uf`, `endereco`, `plano_id`, `status_assinatura`, `trial_start_date`, `trial_end_date`, `subscription_due_date`, `grace_period_end`, `asaas_customer_id`, `asaas_subscription_id`, `blocked_at`, `blocked_reason`, `is_active`, `created_at`, `updated_at`.
- **Regras**: `slug` obrigatório e único, não alterado após publicação da vitrine salvo ação administrativa explícita; CNPJ obrigatório para contratação; `status_assinatura` ∈ {Trial, Ativa, Suspensa, Inadimplente, Cancelada}; Tenant não possui `tenant_id` (é a raiz); usuários comuns só veem o próprio tenant; Super Admin vê e administra todos; bloqueio/desbloqueio controlado pelo Super Admin; nunca há acesso a dados operacionais de outro tenant.
- **Índices**: `slug` único, `cnpj` único, `plano_id`, `status_assinatura`, `is_active`, `created_at`.
- **RLS**: Super Admin lista/administra todos os tenants; Owner/Admin visualizam apenas o próprio; Seller/Viewer não administram tenant; dados sensíveis expostos conforme permissão.
- **Relacionamentos**: possui `Usuários`, `Veículos`, `Leads`, `Assinatura`; raiz de todo dado de negócio.

#### Usuário
- **Objetivo**: membro autenticado da equipe de uma revenda, vinculado a um tenant e controlado por papéis de acesso.
- **Campos**: `id` (UUID), `tenant_id` (FK obrigatório), `auth_user_id` (UUID do Supabase Auth, obrigatório), `nome`, `email`, `telefone`, `papel`, `is_active`, `last_login_at`, `created_by`, `created_at`, `updated_at`.
- **Papéis oficiais**: `owner`, `admin`, `seller`, `viewer`.
- **Regras**: todo usuário pertence a um tenant; `auth_user_id` obrigatório (referencia Supabase Auth); `email` único **globalmente** na plataforma; o mesmo e-mail não pertence a mais de um tenant no MVP; papel `owner` único por tenant; Admin não cria/edita/desativa/remove Owner; Seller e Viewer não administram usuários; usuários inativos não acessam a área autenticada; Super Admin não pertence a esta entidade.
- **Índices**: `tenant_id`, `auth_user_id` único, `email` único, `papel`, `is_active`, `created_at`.
- **RLS**: Owner/Admin visualizam e administram usuários do próprio tenant; Seller/Viewer visualizam apenas dados mínimos do próprio perfil; nenhum usuário acessa usuários de outro tenant; Super Admin tratado fora da hierarquia de tenant.
- **Relacionamentos**: pertence a um `Tenant`; pode ser responsável por `Leads` e `Vendas`; papel `seller` estende-se em `Vendedor` (metas comerciais).

#### Veículo
- **Objetivo**: representar um veículo pertencente a uma revenda (Tenant), disponível para venda, reserva ou negociação.
- **Campos**: `id` (UUID), `tenant_id` (FK obrigatório, imutável), `codigo_interno` (único por Tenant), `placa`, `chassi`, `renavam`, `marca`, `modelo`, `versao`, `ano_fabricacao`, `ano_modelo`, `cor`, `combustivel`, `cambio`, `categoria`, `quilometragem`, `portas`, `motor`, `potencia`, `tracao`, `final_placa`, `preco`, `status`, `destaque`, `descricao`, `observacoes_internas`, `cidade`, `uf`, `data_compra`, `data_venda`, `created_at`, `updated_at`, `deleted_at` (soft delete).
- **Atributos** (não são entidades): `fotos`, `vídeos`, `opcionais`.
- **Regras**: pertence obrigatoriamente a um Tenant; `tenant_id` imutável após criação; `codigo_interno` único por Tenant; `status` ∈ {Publicado, Despublicado, Reservado, Vendido} — editável manualmente pelo usuário e também automaticamente pelo sistema (para "Vendido", ao concluir venda); `placa`/`chassi`/`renavam` podem ficar vazios no cadastro inicial; soft delete obrigatório; `chassi`/`renavam` nunca expostos publicamente.
- **Índices**: `tenant_id`, `codigo_interno` único, `status`, `marca`, `modelo`, `ano_modelo`, `preco`.
- **RLS**: isolamento total por `tenant_id`; Owner/Admin acesso completo; Seller consulta veículos do próprio tenant (não gerencia estoque); Viewer somente leitura; acesso público anônimo restrito a `status = Publicado`, ocultando `chassi`/`renavam`/`observacoes_internas`.
- **Relacionamentos**: pertence a um `Tenant`; aparece na vitrine; pode originar `Leads`. Sem entidades `Fornecedor`/`Responsável` separadas — removidas por decisão explícita.

#### Lead
- **Objetivo**: representar um contato/oportunidade comercial captado pela revenda, acompanhado em um funil de vendas.
- **Campos**: `id` (UUID), `tenant_id` (FK obrigatório), `nome`, `telefone` (contato principal, obrigatório), `email` (opcional), `origem` (vitrine, manual, WhatsApp da Loja, outro), `veiculo_id` (FK opcional), `vendedor_id` (FK para Usuário, opcional até distribuição), `estagio` (Novo, Em atendimento, Negociação, Proposta, Reservado, Vendido, Perdido), `motivo_perda` (obrigatório quando `estagio = Perdido`), `observacoes`, `created_at`, `updated_at`.
- **Histórico de interações**: tabela própria `lead_interactions` (`id`, `tenant_id`, `lead_id`, `tipo`, `descricao`, `autor_id`, `created_at`) — registra cronologicamente atendimentos, observações, mudanças de estágio e redistribuições de vendedor.
- **Regras**: todo lead pertence a um tenant; `veiculo_id`/`vendedor_id` podem ser nulos inicialmente; `motivo_perda` obrigatório quando perdido; redistribuição de vendedor é manual e registrada no histórico.
- **Índices**: `tenant_id`, `estagio`, `veiculo_id`, `vendedor_id`, `origem`, `created_at`.
- **RLS**: Owner/Admin veem todos os leads do tenant; Seller vê apenas os leads atribuídos a ele; **Viewer não tem acesso a leads** (informação comercial sensível).
- **Relacionamentos**: pertence a um `Tenant`; vinculado a um `Veículo` e a um `Usuário` (vendedor); percorre estágios do funil.

#### Vendedor
- **Objetivo**: extensão do papel comercial do Usuário (papel `seller`) com metas comerciais — não é uma entidade independente de identidade/autenticação.
- **Campos**: `tenant_id`, `usuario_id` (FK para Usuário, papel `seller`), `meta_mensal`, `periodo`.
- **Regras**: é um `Usuário` com papel `seller`; não duplica dados de identidade já existentes em Usuário; comissão por venda pertence à entidade `Venda` (fora deste documento, referenciada em `Regra de Comissão`), não a esta.
- **Relacionamentos**: é um `Usuário`; associado a `Regra de Comissão`.

#### Regra de Comissão
- **Objetivo**: configuração de cálculo de comissão por vendedor.
- **Campos**: `id`, `tenant_id`, `vendedor_id` (Usuário, papel `seller`), `tipo` (percentual ou valor fixo), `percentual`, `valor_fixo`, `is_active`.
- **Regras**: no máximo uma regra ativa por par (Tenant, Vendedor); no MVP, a comissão é registrada por venda apenas como valor **previsto** e status **paga/não paga** — o cálculo automático a partir desta regra é pós-MVP; a fórmula exata de cálculo (percentual fixo, por faixa, por vendedor) permanece pendente de detalhamento em [`05-regras-negocio.md`](05-regras-negocio.md).
- **Relacionamentos**: pertence a um `Tenant`/`Vendedor`.

#### Plano
- **Objetivo**: nível de assinatura da plataforma, define limites de uso e recursos habilitados.
- **Campos**: `id`, `name`, `display_name`, `max_vehicles`, `max_users`, `max_leads`, `price_monthly`, `price_yearly`, `features` (estrutura de flags habilitadas), `is_active`.
- **Regras**: o plano de maior nível (`scale`/Enterprise) fica **deliberadamente oculto do grid público** de planos, disponível apenas via contato comercial — decisão confirmada.
- **Relacionamentos**: referenciado pela `Assinatura`; pode habilitar `Add-ons` e `Feature Flags`.

#### Add-on
- **Objetivo**: recurso adicional cobrado à parte da assinatura principal.
- **Campos (catálogo)**: `addon_type`, `display_name`, `description`, `price_monthly`, `unit`, `is_active`.
- **Campos (contratado por tenant)**: `tenant_id`, `subscription_id`, `addon_type`, `quantity`, `price_monthly`, `status` (ativo/cancelado/pausado), `started_at`, `canceled_at`.
- **Regras**: cobrado separadamente da assinatura principal; feature concedida ao tenant quando o add-on está ativo; cancelamento remove a feature.
- **Relacionamentos**: associado a `Assinatura`/`Tenant`; concede `Feature Flags`.

#### Feature Flag
- **Objetivo**: habilitação de funcionalidade específica para um tenant, além do que o plano concede por padrão.
- **Campos**: `tenant_id`, `feature`, `enabled`, `granted_by` (usuário Super Admin que concedeu), `expires_at` (opcional), `note`.
- **Regras**: o conjunto efetivo de features de um tenant é a combinação de (1) features do plano, (2) overrides manuais nesta tabela, (3) features concedidas por add-ons ativos; apenas Super Admin administra overrides manuais.
- **Relacionamentos**: pertence a um `Tenant`.

#### Assinatura / Cobrança
- **Objetivo**: vínculo do tenant a um plano e ciclo de cobrança recorrente (integração Asaas).
- **Campos**: `tenant_id` (uma assinatura ativa por tenant), `plan_id`, `status` (trial/ativa/inadimplente/cancelada/pausada), `billing_cycle` (mensal/anual), `current_period_start`, `current_period_end`, `trial_ends_at`, `canceled_at`, `asaas_customer_id`, `asaas_subscription_id`, `grace_until`.
- **Faturas**: uma linha por cobrança gerada (`billing_invoices`): `value`, `status` (pendente/confirmada/recebida/vencida/reembolsada/cancelada), `billing_type` (boleto/PIX/cartão), `due_date`, `paid_at`, link/QR code de pagamento.
- **Regras confirmadas**:
  - **Trial: 30 dias** a partir da criação do tenant.
  - **Carência (grace period): 7 dias** após a assinatura entrar em inadimplência (`past_due`), antes de bloqueio efetivo de acesso.
  - **E-mail de aviso de vencimento**: cliente recebe e-mail de cobrança **7 dias antes** do vencimento de uma fatura pendente, com valor e link de pagamento.
  - Ambas as mudanças de prazo (trial/carência) aplicam-se a partir da confirmação — não retroagem sobre tenants já em trial ou carência no momento da mudança.
- **Relacionamentos**: pertence a um `Tenant`; referencia um `Plano`.

#### Instância de WhatsApp
- **Objetivo**: conexão da Central de Atendimento (Evolution API) para o tenant, ativa quando o add-on `whatsapp_automation` está contratado.
- **Campos**: `tenant_id`, `instance_name`, `status` (conectado/desconectado), `qr_code`, `session_data`, `last_connection_at`.
- **Regras**: um registro por tenant; depende do add-on `whatsapp_automation` ativo; **nunca aparece na vitrine pública** — distinta do "WhatsApp da Loja" (contato público simples, `wa.me/{telefone}`, sem Evolution API).
- **Relacionamentos**: pertence a um `Tenant`.

### Invariantes de domínio

- Todo registro de negócio pertence a exatamente um `Tenant` e nunca é acessível por outro.
- Um `Lead` sempre tem um `Tenant`; a associação a `Veículo` e `Vendedor` pode ser preenchida ao longo do funil.
- A publicação de um `Veículo` na vitrine depende do seu status de publicação.
- O acesso efetivo a uma funcionalidade de um Tenant é sempre a combinação de plano + overrides de Feature Flag + add-ons ativos — nunca uma fonte isolada.

### O que ainda precisa ser detalhado (não bloqueia PLANEJAMENTO)

- Fórmula exata de cálculo de comissão (percentual fixo, por faixa, por vendedor) — ver [`05-regras-negocio.md`](05-regras-negocio.md).
- Recorte de entidades que entram no MVP (ver [`03-mvp.md`](03-mvp.md)).

## Responsabilidades

- Este documento descreve o domínio conceitual — a implementação física (schema, migrações) vive nas migrações do projeto e no contexto técnico ([`11-contexto-tecnico.md`](11-contexto-tecnico.md)), e deve permanecer consistente com o que está descrito aqui.
- Mudanças estruturais no domínio (nova entidade central, mudança de cardinalidade) são registradas em [`08-decisoes-tecnicas.md`](08-decisoes-tecnicas.md).

## Relacionamento com Outros Documentos

- [11-contexto-tecnico.md](11-contexto-tecnico.md) — implementação física (banco, migrações) deste modelo conceitual.
- [05-regras-negocio.md](05-regras-negocio.md) — regras que operam sobre estas entidades.
- [06-glossario.md](06-glossario.md) — definição precisa dos termos usados para nomear estas entidades.
