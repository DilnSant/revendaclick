# RevendaClick — Documentação de Migração para FlutterFlow

> **Objetivo:** Permitir migração gradual do frontend Next.js para FlutterFlow, sem reconstruir o backend Go nem perder funcionalidade. O backend REST API, banco Supabase e todas as integrações continuam intactos.

---

## SUMÁRIO

1. [Telas Existentes](#1-telas-existentes)
2. [Fluxos Completos](#2-fluxos-completos)
3. [APIs Disponíveis](#3-apis-disponíveis)
4. [Estrutura Supabase](#4-estrutura-supabase)
5. [Estrutura Multi-Tenant](#5-estrutura-multi-tenant)
6. [Billing (Asaas)](#6-billing-asaas)
7. [Autenticação](#7-autenticação)
8. [Componentes de Interface](#8-componentes-de-interface)
9. [Dependências e Integrações](#9-dependências-e-integrações)
10. [Ordem de Migração para FlutterFlow](#10-ordem-de-migração-para-flutterflow)

---

## 1. TELAS EXISTENTES

### Telas Públicas (sem login)

| Tela | URL | O que faz |
|------|-----|-----------|
| Landing Page | `/` | Apresentação do produto, call-to-action para registro |
| Login | `/login` | Entrada com e-mail e senha |
| Registro | `/register` | Criação de conta (apenas usuário, sem loja ainda) |
| Recuperar Senha | `/forgot-password` | Envio de e-mail de redefinição |
| Redefinir Senha | `/reset-password` | Formulário com nova senha (link do e-mail) |
| Vitrine Pública | `/:slug` | Página da loja do revendedor (SEO, marketplace) |
| Veículo Público | `/:slug/veículos/:slug-veiculo` | Página individual do veículo com fotos, detalhes e formulário de contato |
| Política de Privacidade | `/privacy` | Texto legal |
| Termos de Uso | `/terms` | Texto legal |

### Telas do Dashboard (requer login)

| Tela | URL | O que faz |
|------|-----|-----------|
| Onboarding | `/onboarding` | Wizard de configuração inicial da loja (nome, slug, WhatsApp) |
| Dashboard | `/dashboard` | Painel com KPIs: receita, leads, veículos, fluxo de caixa |
| Leads / CRM | `/leads` | Lista e kanban de leads com status, follow-ups e atividades |
| CRM | `/crm` | Interface alternativa de relacionamento com leads |
| Veículos | `/vehicles` | Inventário de veículos (listar, criar, editar, excluir) |
| Clientes | `/customers` | Cadastro de clientes da loja |
| Financeiro | `/financial` | Entradas e saídas financeiras + fluxo de caixa mensal |
| Comissões | `/financial/commissions` | Controle de comissões de vendedores |
| Vendas | `/sales` | Pipeline de vendas (pendentes e concluídas) |
| Analytics | `/analytics` | Relatórios e métricas avançadas (plano Premium+) |
| Assinatura | `/billing` | Status da assinatura, plano atual, faturas |
| Histórico de Cobranças | `/billing/history` | Listagem de faturas pagas e pendentes |
| Planos | `/billing/plans` | Comparativo de planos e upgrade |
| Configurações | `/settings` | Dados da loja, tema, redes sociais |
| Equipe | `/vendors` | Gerenciamento de vendedores e permissões |
| WhatsApp | `/whatsapp` | Conexão da instância WhatsApp via QR code |

**Total: 9 telas públicas + 16 telas do dashboard = 25 telas**

---

## 2. FLUXOS COMPLETOS

### Fluxo 1 — Registro e Configuração Inicial

```
Usuário acessa /register
  → Preenche e-mail e senha
  → Supabase cria conta (envia e-mail de confirmação se habilitado)
  → Redireciona para /onboarding
    → Preenche: nome da loja, slug (URL), e-mail comercial, telefone WhatsApp
    → Sistema cria: tenant + assinatura (período de teste de 7 dias)
  → Redireciona para /dashboard
```

**Dados coletados no onboarding:**
- Nome da loja
- Slug (ex: `minha-loja` → vitrine em `/minha-loja`)
- E-mail comercial
- Número de WhatsApp

---

### Fluxo 2 — Login e Acesso

```
Usuário acessa /login
  → Informa e-mail e senha
  → Supabase valida e retorna JWT com tenant_id e user_role
  → Sistema verifica se usuário tem tenant configurado
    → Sim: redireciona para /dashboard
    → Não: redireciona para /onboarding
```

---

### Fluxo 3 — Captura de Lead (Público)

```
Visitante acessa /:slug/veículos/:slug-veiculo
  → Visualiza fotos, detalhes, preço do veículo
  → Clica em "Tenho Interesse" ou "Contatar Vendedor"
  → Preenche: nome, telefone, e-mail, mensagem
  → Sistema registra lead com status "Novo"
  → Lead aparece no dashboard do revendedor em /leads
```

---

### Fluxo 4 — Gestão de Leads (CRM)

```
Revendedor acessa /leads
  → Visualiza kanban com colunas: Novo | Em Andamento | Proposta | Ganho | Perdido
  → Move lead entre colunas (muda status)
  → Clica no lead para ver detalhes:
    → Histórico de atividades (ligações, mensagens, anotações)
    → Próximo follow-up agendado
    → Veículo de interesse
    → Botão de WhatsApp direto
  → Registra nova atividade: ligação, e-mail, nota, WhatsApp
  → Agenda próximo follow-up com data e nota
  → Converte em venda via /sales
```

---

### Fluxo 5 — Cadastro de Veículo

```
Revendedor acessa /vehicles
  → Clica em "Novo Veículo"
  → Preenche: marca, modelo, versão (via FIPE), ano, cor, km, combustível, câmbio
  → Informa preço de venda (+ preço FIPE de referência)
  → Adiciona fotos (upload)
  → Salva → sistema verifica limite do plano
    → Dentro do limite: veículo criado e publicado na vitrine
    → Limite atingido: bloqueado, exibe alerta para upgrade
```

---

### Fluxo 6 — Registro de Venda

```
Revendedor acessa /sales ou lead já em status "Proposta"
  → Cria nova venda com:
    → Veículo vendido
    → Cliente (selecionado do cadastro ou novo)
    → Vendedor responsável
    → Preço de venda, desconto, forma de pagamento
  → Salva como "Pendente"
  → Quando concluída: marca como "Completa"
    → Sistema automaticamente:
      → Muda status do veículo para "Vendido"
      → Cria entrada no financeiro (receita)
      → Cria comissão pendente para o vendedor
```

---

### Fluxo 7 — Gestão Financeira

```
Revendedor acessa /financial
  → Visualiza fluxo de caixa mensal (receitas × despesas)
  → Cria entrada manual: tipo (receita/despesa), categoria, valor, vencimento
  → Acessa /financial/commissions:
    → Visualiza comissões pendentes por vendedor
    → Marca como paga
```

---

### Fluxo 8 — Assinatura e Pagamento

```
Usuário acessa /billing
  → Visualiza plano atual, data de renovação, status
  → Clica em "Fazer Upgrade" → /billing/plans
    → Compara planos (Starter / Pro / Premium / Enterprise)
    → Seleciona plano e periodicidade (mensal/anual)
    → Sistema cria assinatura no Asaas
    → Asaas retorna link de pagamento (Boleto, PIX ou Cartão)
  → Usuário paga
  → Asaas notifica sistema via webhook
  → Assinatura ativada automaticamente
  → Usuário tem acesso liberado às features do plano
```

---

### Fluxo 9 — Conexão WhatsApp

```
Revendedor acessa /whatsapp
  → Sistema verifica se instância existe
    → Não existe: clica em "Conectar"
      → Sistema cria instância no Evolution API
      → Exibe QR code na tela
      → Usuário escaneia com WhatsApp do celular
      → Status muda para "Conectado"
    → Já existe:
      → Exibe status (Conectado / Desconectado / QR Expirado)
      → Opção de desconectar
  → Após conectado: sistema envia mensagens automáticas para novos leads
```

---

### Fluxo 10 — Funcionalidades de IA

```
Revendedor está em um lead
  → Clica em "Sugerir Resposta"
    → Sistema analisa contexto do lead via OpenRouter (GPT-4o-mini)
    → Retorna sugestão de mensagem personalizada
  → Clica em "Classificar Lead"
    → Sistema classifica automaticamente o potencial do lead
    → Atualiza status/prioridade sugerida
```

---

## 3. APIS DISPONÍVEIS

> **Base URL:** `https://api.revendaclick.com.br`
> **Autenticação:** Header `Authorization: Bearer {JWT_TOKEN}` em todas as rotas protegidas
> **Formato:** JSON em todas as requisições e respostas

### Rotas Públicas (sem autenticação)

| Método | Rota | O que retorna |
|--------|------|---------------|
| GET | `/api/plans` | Lista de planos com preços e features |
| GET | `/api/public/:slug/` | Dados da loja pública (nome, logo, descrição) |
| GET | `/api/public/:slug/vehicles` | Lista de veículos disponíveis da loja |
| GET | `/api/public/:slug/vehicles/:vehicleSlug` | Detalhes de um veículo específico |
| POST | `/api/public/:slug/leads` | Registra novo lead vindo da vitrine |
| GET | `/health` | Status de saúde da API |

### Onboarding (primeiro acesso)

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/api/onboarding/setup` | Cria loja e assinatura inicial (trial 7 dias) |
| GET | `/api/onboarding` | Retorna checklist de configuração |
| PUT | `/api/onboarding` | Atualiza progresso do checklist |

### Tenant (loja)

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/tenants/me` | Dados da loja atual |
| PUT | `/api/tenants/me` | Atualiza dados da loja (apenas dono/admin) |
| GET | `/api/usage` | Uso atual do plano (veículos, usuários, leads) |

### Veículos

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/vehicles` | Lista veículos da loja (filtros: status, marca, preço) |
| POST | `/api/vehicles` | Cria novo veículo |
| GET | `/api/vehicles/:id` | Detalhes de um veículo |
| PUT | `/api/vehicles/:id` | Atualiza veículo |
| DELETE | `/api/vehicles/:id` | Remove veículo (apenas dono/admin) |

### Leads / CRM

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/leads` | Lista leads (vendedor vê apenas os seus) |
| POST | `/api/leads` | Cria lead interno |
| GET | `/api/leads/:id` | Detalhes do lead |
| PUT | `/api/leads/:id` | Atualiza status, notas, follow-up |
| DELETE | `/api/leads/:id` | Remove lead (apenas dono/admin) |
| GET | `/api/leads/follow-ups` | Leads com follow-up hoje ou atrasados |
| GET | `/api/leads/:id/activities` | Histórico de atividades do lead |
| POST | `/api/leads/:id/activities` | Registra nova atividade (ligação, nota, etc) |

### Clientes

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/customers` | Lista clientes |
| POST | `/api/customers` | Adiciona cliente |
| GET | `/api/customers/:id` | Detalhes do cliente |
| PUT | `/api/customers/:id` | Atualiza cliente |
| DELETE | `/api/customers/:id` | Remove cliente (apenas dono/admin) |

### Financeiro

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/financial/entries` | Lista entradas e saídas |
| POST | `/api/financial/entries` | Cria entrada financeira |
| GET | `/api/financial/cash-flow` | Fluxo de caixa mensal agrupado |

### Vendas

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/sales` | Lista vendas (pendentes e concluídas) |
| POST | `/api/sales` | Cria registro de venda |
| GET | `/api/sales/:id` | Detalhes da venda |
| POST | `/api/sales/:id/complete` | Conclui venda (apenas dono/admin) |
| POST | `/api/sales/:id/cancel` | Cancela venda (apenas dono/admin) |
| GET | `/api/commissions` | Lista comissões |
| PATCH | `/api/commissions/:id/pay` | Marca comissão como paga (apenas dono/admin) |

### Equipe

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/users` | Lista membros da equipe (apenas dono/admin) |
| GET | `/api/users/sellers` | Lista vendedores ativos |
| POST | `/api/users` | Adiciona membro (apenas dono/admin) |
| GET | `/api/users/:id` | Perfil do usuário |
| PUT | `/api/users/:id` | Atualiza usuário |
| DELETE | `/api/users/:id` | Desativa usuário (apenas dono/admin) |

### Assinatura (Billing)

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/billing/subscription` | Status da assinatura, plano, renovação |
| POST | `/api/billing/subscribe` | Cria assinatura em um plano |
| DELETE | `/api/billing/subscription` | Cancela assinatura (apenas dono/admin) |
| POST | `/api/billing/reactivate` | Reativa assinatura cancelada |
| GET | `/api/billing/invoices` | Lista faturas pagas e pendentes |

### Analytics

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/analytics/summary` | Métricas consolidadas (plano Premium+) |

### WhatsApp (Evolution API)

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/evolution/health` | Status do serviço WhatsApp |
| GET | `/api/evolution/status` | Status da conexão da instância |
| GET | `/api/evolution/qr` | QR code para login no WhatsApp |
| POST | `/api/evolution/connect` | Cria instância e retorna QR code |
| DELETE | `/api/evolution/disconnect` | Desconecta instância |
| POST | `/api/evolution/send` | Envia mensagem WhatsApp |

### Inteligência Artificial

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/api/ai/suggest-reply` | Gera sugestão de mensagem para o lead |
| POST | `/api/ai/classify-lead` | Classifica automaticamente o lead |

### FIPE (tabela de preços de veículos)

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | `/api/fipe/brands` | Lista marcas de veículos |
| GET | `/api/fipe/models?brand=X` | Lista modelos de uma marca |
| GET | `/api/fipe/versions?brand=X&model=Y&year=2024` | Versões e preços FIPE |

### Webhooks (chamados por sistemas externos)

| Método | Rota | Quem chama |
|--------|------|-----------|
| POST | `/api/webhooks/asaas` | Asaas (confirmação de pagamento) |
| POST | `/api/webhooks/evolution` | Evolution API (mensagens WhatsApp recebidas) |

---

## 4. ESTRUTURA SUPABASE

### Tabelas do Banco de Dados

#### PLANS — Planos do SaaS
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| name | Texto | starter / pro / premium / enterprise |
| display_name | Texto | Nome exibido |
| max_vehicles | Número | Limite de veículos (-1 = ilimitado) |
| max_users | Número | Limite de usuários |
| max_leads | Número | Limite de leads por mês |
| price_monthly | Decimal | Preço mensal |
| price_yearly | Decimal | Preço anual |
| features | Lista JSON | Lista de features incluídas |
| is_active | Booleano | Se o plano está disponível |

#### TENANTS — Lojas dos Revendedores
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único da loja |
| slug | Texto | URL da vitrine (ex: `minha-loja`) |
| name | Texto | Nome da loja |
| email | Texto | E-mail comercial |
| phone_whatsapp | Texto | Número WhatsApp |
| logo_url | Texto | URL do logotipo |
| description | Texto | Descrição da loja |
| address | JSON | Endereço completo |
| social_links | JSON | Redes sociais |
| custom_domain | Texto | Domínio personalizado (white-label) |
| seo_title | Texto | Título para SEO |
| seo_description | Texto | Descrição para SEO |
| theme | JSON | Cor primária, fonte |
| is_active | Booleano | Se a loja está ativa |
| asaas_customer_id | Texto | ID do cliente no Asaas |

#### SUBSCRIPTIONS — Assinaturas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| plan_id | UUID | Referência ao plano |
| status | Texto | active / trialing / past_due / canceled / paused |
| billing_cycle | Texto | monthly / yearly |
| current_period_start | Data/Hora | Início do período atual |
| current_period_end | Data/Hora | Fim do período atual |
| trial_ends_at | Data/Hora | Fim do período de teste |
| canceled_at | Data/Hora | Data de cancelamento |
| grace_until | Data/Hora | Período de graça após atraso (3 dias) |
| external_id | Texto | ID da assinatura no Asaas |

#### USERS — Membros da Equipe
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Vinculado ao auth do Supabase |
| tenant_id | UUID | Referência à loja |
| role | Texto | owner / admin / seller / viewer |
| name | Texto | Nome completo |
| email | Texto | E-mail |
| phone | Texto | Telefone |
| avatar_url | Texto | Foto de perfil |
| is_active | Booleano | Se está ativo |
| last_seen_at | Data/Hora | Último acesso |

#### SELLERS — Perfil de Vendedor
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| user_id | UUID | Referência ao usuário |
| display_name | Texto | Nome exibido ao cliente |
| phone_whatsapp | Texto | WhatsApp do vendedor |
| bio | Texto | Apresentação |
| photo_url | Texto | Foto |
| is_active | Booleano | Se está ativo |

#### VEHICLES — Inventário de Veículos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| seller_id | UUID | Vendedor responsável |
| title | Texto | Título do anúncio |
| brand | Texto | Marca |
| model | Texto | Modelo |
| version | Texto | Versão/Trim |
| year_model | Número | Ano do modelo |
| year_manufacture | Número | Ano de fabricação |
| color | Texto | Cor |
| mileage | Número | Quilometragem |
| fuel | Texto | flex / gasoline / diesel / electric / hybrid |
| transmission | Texto | manual / automatic / cvt / automated |
| doors | Número | 2 ou 4 portas |
| engine | Texto | Motor (ex: 1.6 16V) |
| horsepower | Número | Cavalos |
| features | Lista | Opcionais (ar, direção, etc) |
| price | Decimal | Preço de venda |
| price_negotiable | Booleano | Aceita negociação |
| fipe_price | Decimal | Preço tabela FIPE |
| status | Texto | available / reserved / sold / inactive |
| condition | Texto | new / used / certified |
| is_featured | Booleano | Destaque na vitrine |
| images | Lista | URLs das fotos |
| thumbnail_url | Texto | Foto principal |
| slug | Texto | URL amigável do veículo |
| description | Texto | Descrição completa |
| views_count | Número | Total de visualizações |
| leads_count | Número | Total de leads recebidos |

#### LEADS — Clientes em Potencial
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| vehicle_id | UUID | Veículo de interesse |
| seller_id | UUID | Vendedor atribuído |
| name | Texto | Nome do lead |
| phone | Texto | Telefone |
| email | Texto | E-mail |
| message | Texto | Mensagem original |
| status | Texto | new / in_progress / proposal / closed_won / closed_lost |
| source | Texto | marketplace / whatsapp / referral / direct / social |
| notes | Texto | Anotações do vendedor |
| kanban_position | Número | Posição no kanban |
| follow_up_at | Data/Hora | Próximo follow-up |
| follow_up_note | Texto | Nota do follow-up |
| contacted_at | Data/Hora | Primeiro contato |
| closed_at | Data/Hora | Data de fechamento |

#### LEAD_ACTIVITIES — Histórico de Contatos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| lead_id | UUID | Referência ao lead |
| user_id | UUID | Usuário que realizou a ação |
| type | Texto | status_change / note / call / whatsapp / email |
| description | Texto | Descrição da atividade |
| metadata | JSON | Dados adicionais |

#### CUSTOMERS — Cadastro de Clientes
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| name | Texto | Nome completo |
| email | Texto | E-mail |
| phone | Texto | Telefone |
| cpf_cnpj | Texto | CPF ou CNPJ |
| address_city | Texto | Cidade |
| address_state | Texto | Estado (2 letras) |
| notes | Texto | Observações |
| is_active | Booleano | Se está ativo |

#### FINANCIAL_ENTRIES — Entradas Financeiras
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| type | Texto | income (receita) / expense (despesa) |
| category | Texto | vehicle_sale / commission / operational / etc |
| description | Texto | Descrição |
| amount | Decimal | Valor |
| payment_method | Texto | cash / pix / credit_card / financing / etc |
| status | Texto | pending / paid / overdue / canceled |
| due_date | Data | Vencimento |
| paid_at | Data/Hora | Data do pagamento |
| reference_id | UUID | Referência à venda ou comissão |

#### SALES — Registro de Vendas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| vehicle_id | UUID | Veículo vendido |
| lead_id | UUID | Lead que originou a venda |
| seller_id | UUID | Vendedor responsável |
| customer_id | UUID | Cliente comprador |
| sale_price | Decimal | Preço de venda |
| list_price | Decimal | Preço de tabela |
| discount | Decimal | Desconto concedido |
| financing_type | Texto | none / own / bank / consortium |
| payment_method | Texto | Forma de pagamento |
| status | Texto | pending / completed / canceled |
| sold_at | Data/Hora | Data da venda |
| notes | Texto | Observações |

#### COMMISSIONS — Comissões de Vendedores
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| sale_id | UUID | Referência à venda |
| seller_id | UUID | Vendedor |
| type | Texto | percentage / fixed |
| rate | Decimal | Percentual (%) |
| amount | Decimal | Valor em reais |
| status | Texto | pending / approved / paid / canceled |
| paid_at | Data/Hora | Data do pagamento |

#### BILLING_INVOICES — Faturas
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| asaas_payment_id | Texto | ID do pagamento no Asaas |
| value | Decimal | Valor |
| status | Texto | pending / confirmed / received / overdue / canceled |
| billing_type | Texto | BOLETO / PIX / CREDIT_CARD |
| due_date | Data | Vencimento |
| paid_at | Data/Hora | Data do pagamento |
| invoice_url | Texto | Link da fatura |
| pix_copy_paste | Texto | Código PIX para copiar |

#### ONBOARDING_CHECKLISTS — Progresso do Onboarding
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| added_vehicle | Booleano | Adicionou veículo |
| configured_whatsapp | Booleano | Configurou WhatsApp |
| published_store | Booleano | Publicou a vitrine |
| added_seller | Booleano | Adicionou vendedor |
| completed_at | Data/Hora | Quando completou o onboarding |

#### AUDIT_LOGS — Trilha de Auditoria
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador |
| tenant_id | UUID | Referência à loja |
| user_id | UUID | Quem realizou |
| action | Texto | lead.status_changed / vehicle.created / etc |
| entity_type | Texto | lead / vehicle / user |
| entity_id | UUID | ID do registro modificado |
| old_data | JSON | Dados anteriores |
| new_data | JSON | Dados novos |
| ip_address | Texto | IP de origem |

### Visões (Views) Computadas

| View | O que calcula |
|------|---------------|
| `plan_usage` | Contagem de veículos, usuários, leads por loja + status do plano |
| `v_cash_flow_monthly` | Fluxo de caixa mensal agrupado (receitas e despesas) |

### Automações de Banco de Dados (Triggers)

| Trigger | Quando dispara | O que faz |
|---------|----------------|-----------|
| `check_vehicle_limit` | Ao inserir veículo | Bloqueia se loja atingiu o limite do plano |
| `check_user_limit` | Ao inserir usuário | Bloqueia se loja atingiu o limite de usuários |
| `complete_sale` | Ao concluir venda | Muda veículo para "Vendido", cria receita e comissão |

---

## 5. ESTRUTURA MULTI-TENANT

### O que é Multi-Tenant

Cada revendedor é um "tenant" (inquilino) isolado. Todos os dados são separados por loja — nenhuma loja acessa dados de outra.

### Como Funciona

**1. Identificação do Tenant**

Cada usuário logado recebe um token JWT com o `tenant_id` embutido:
```
JWT contém:
- user_id: quem está logado
- tenant_id: qual loja ele pertence
- user_role: owner / admin / seller / viewer
```

**2. Isolamento no Banco de Dados**

Toda tabela de negócio tem uma coluna `tenant_id`. O Supabase aplica RLS (Row Level Security) automaticamente:
- O usuário só vê registros com `tenant_id` igual ao seu
- Não há API, query ou bypass que permita ver dados de outra loja
- O isolamento é garantido no nível do banco de dados

**3. Isolamento no Backend**

O backend Go valida o token JWT em cada requisição e:
- Extrai o `tenant_id` do token
- Usa esse valor em todas as queries
- Nunca confia em valores enviados pelo frontend
- Rejeita qualquer tentativa de acessar outra loja

**4. Isolamento na Vitrine Pública**

A URL `/:slug` identifica a loja pública. O sistema:
- Resolve o slug para o tenant_id correspondente
- Mostra apenas veículos daquela loja
- Registra leads no tenant correto

### Papéis de Usuário

| Papel | O que pode fazer |
|-------|-----------------|
| **owner** | Tudo: configurações, equipe, billing, relatórios |
| **admin** | Tudo exceto billing |
| **seller** | Ver e gerenciar seus próprios leads e veículos |
| **viewer** | Apenas visualizar (sem editar) |

### Limites por Plano (enforcement automático)

| Plano | Veículos | Usuários | Leads/mês |
|-------|----------|----------|-----------|
| Starter | 30 | 4 | 200 |
| Pro | 60 | 8 | 500 |
| Premium | 120 | 20 | 2.000 |
| Enterprise | Ilimitado | Ilimitado | Ilimitado |

> Esses limites são verificados pelo banco de dados e pelo backend. Ao atingir o limite, o sistema bloqueia a operação e exibe alerta de upgrade.

---

## 6. BILLING (ASAAS)

### Visão Geral

O sistema de cobranças usa a plataforma **Asaas** (gateway de pagamentos brasileiro). Toda gestão de assinaturas, cobranças e faturas passa pelo Asaas.

### Formas de Pagamento Suportadas

- Boleto Bancário
- PIX
- Cartão de Crédito

### Ciclo de Vida da Assinatura

```
CRIAÇÃO
  → Usuário seleciona plano em /billing/plans
  → Sistema cria cliente no Asaas (se não existe)
  → Sistema cria assinatura no Asaas
  → Asaas gera link de pagamento
  → Status: "trialing" (7 dias grátis) ou aguardando pagamento

ATIVA
  → Pagamento confirmado pelo Asaas via webhook
  → Status: "active"
  → Acesso a todas as features do plano liberado

ATRASADA
  → Pagamento não realizado até o vencimento
  → Asaas notifica via webhook: PAYMENT_OVERDUE
  → Status: "past_due"
  → Período de graça: 3 dias
  → Após 3 dias: acesso bloqueado, apenas billing acessível

CANCELADA
  → Usuário cancela manualmente em /billing
  → Ou pagamento não regularizado após graça
  → Status: "canceled"
  → Acesso completamente bloqueado

REATIVADA
  → Usuário clica em "Reativar" e paga
  → Status volta para "active"
```

### Eventos do Webhook Asaas

| Evento | O que acontece no sistema |
|--------|--------------------------|
| PAYMENT_RECEIVED | Assinatura ativa, acesso liberado |
| PAYMENT_CONFIRMED | Fatura marcada como paga |
| PAYMENT_OVERDUE | Status = past_due, início da graça |
| SUBSCRIPTION_CREATED | Assinatura registrada |
| SUBSCRIPTION_CANCELED | Status = canceled |
| PAYMENT_REFUNDED | Registro de estorno |

### Proteção contra Cobranças Duplicadas

O sistema usa **idempotência** — cada evento do Asaas é registrado com uma chave única. Se o mesmo webhook chegar duas vezes, o sistema ignora a duplicata.

---

## 7. AUTENTICAÇÃO

### Provedor: Supabase Auth

Toda autenticação é gerenciada pelo Supabase. O frontend não gerencia senhas diretamente.

### Fluxo de Login

```
1. Usuário informa e-mail e senha
2. Supabase valida as credenciais
3. Supabase retorna:
   - access_token (JWT) — válido por 1 hora
   - refresh_token — usado para renovar sem novo login
4. Tokens armazenados em cookies seguros (httpOnly)
5. Cada requisição ao backend usa o access_token
6. Backend valida o token com a chave pública do Supabase
```

### Fluxo de Registro

```
1. Usuário informa e-mail e senha em /register
2. Supabase cria conta
3. Se confirmação de e-mail habilitada: e-mail enviado → usuário confirma → redireciona para /onboarding
4. Se confirmação desabilitada: redireciona direto para /onboarding
5. Em /onboarding: usuário cria a loja
6. Sistema associa o usuário à loja (tenant_id no JWT)
```

### Redefinição de Senha

```
1. Usuário acessa /forgot-password
2. Informa e-mail → Supabase envia link
3. Link redireciona para /reset-password
4. Usuário define nova senha
5. Redireciona para /login
```

### Expiração e Renovação de Sessão

- Access token expira em 1 hora
- Refresh token renova automaticamente em background
- Se refresh token expirar (inatividade longa): usuário é redirecionado para /login

### Dados no JWT (token de autenticação)

```json
{
  "sub": "UUID do usuário",
  "email": "email@exemplo.com",
  "app_metadata": {
    "tenant_id": "UUID da loja",
    "user_role": "owner|admin|seller|viewer"
  },
  "exp": "timestamp de expiração"
}
```

> **Para FlutterFlow:** o Supabase tem SDK oficial para Flutter (`supabase_flutter`). O login, logout e renovação de sessão funcionam nativamente sem necessidade de backend intermediário.

---

## 8. COMPONENTES DE INTERFACE

### Componentes Reutilizáveis Atuais (Next.js)

#### Navegação e Layout
| Componente | O que é |
|------------|---------|
| DashboardShell | Container principal com menu lateral e topbar |
| Sidebar | Menu lateral com links de navegação |
| TopBar | Barra superior com usuário, notificações |
| MobileMenu | Menu adaptativo para tela pequena |

#### CRM e Leads
| Componente | O que é |
|------------|---------|
| LeadKanban | Quadro kanban com arrastar e soltar |
| LeadCard | Card do lead com status, nome, veículo |
| LeadModal | Modal com detalhes completos do lead |
| ActivityFeed | Lista de histórico de atividades |
| FollowUpBadge | Badge visual de follow-up atrasado |

#### Veículos
| Componente | O que é |
|------------|---------|
| VehicleCard | Card do veículo na listagem |
| VehicleForm | Formulário de criação/edição de veículo |
| FipeSelects | Seletores encadeados: marca → modelo → versão |
| ImageUploader | Upload múltiplo de fotos |
| ShareButton | Botão para copiar link do veículo |
| VehicleBadge | Badge de status (disponível, reservado, vendido) |

#### Financeiro
| Componente | O que é |
|------------|---------|
| CashFlowChart | Gráfico de barras receita × despesa por mês |
| EntryModal | Modal de criação de entrada financeira |
| CommissionTable | Tabela de comissões por vendedor |

#### Controle de Plano
| Componente | O que é |
|------------|---------|
| FeatureGate | Oculta features bloqueadas pelo plano |
| PlanAlertBanner | Banner de alerta de uso próximo ao limite |
| SubscriptionBanner | Banner de status da assinatura |
| UsageBar | Barra de progresso do uso do plano |

#### Utilitários
| Componente | O que é |
|------------|---------|
| Toast | Sistema de notificações (sucesso, erro, aviso) |
| LoadingSpinner | Indicador de carregamento |
| EmptyState | Tela vazia com call-to-action |
| ConfirmModal | Modal de confirmação para ações destrutivas |

#### WhatsApp
| Componente | O que é |
|------------|---------|
| WhatsAppManager | Painel completo de conexão WhatsApp |
| QRCodeDisplay | Exibição do QR code |
| ConnectionStatus | Indicador de status da conexão |

### Equivalentes Sugeridos no FlutterFlow

| Componente Atual | Equivalente FlutterFlow |
|-----------------|------------------------|
| LeadKanban | Custom Widget ou DraggableScrollableSheet |
| VehicleCard | Card Component |
| FipeSelects | Chained Dropdowns (3 dropdowns com API calls) |
| ImageUploader | Supabase Storage Upload Widget |
| FeatureGate | Conditional Visibility com condição de plano |
| Toast | Snack Bar |
| CashFlowChart | fl_chart package no Custom Widget |
| UsageBar | Linear Progress Indicator |

---

## 9. DEPENDÊNCIAS E INTEGRAÇÕES

### Backend (Go) — Serviços Externos

| Serviço | Finalidade | Continua no FlutterFlow |
|---------|-----------|------------------------|
| **Supabase** | Banco de dados, Auth, Storage | Sim — nativo no Flutter |
| **Asaas** | Gateway de pagamentos brasileiro | Sim — via API REST do backend |
| **Evolution API** | WhatsApp Business API | Sim — via API REST do backend |
| **OpenRouter / GPT-4o-mini** | IA para sugestões e classificação | Sim — via API REST do backend |
| **FIPE API** | Tabela de preços de veículos | Sim — via API REST do backend |
| **BetterStack** | Logs de produção | Transparente — só no backend |
| **Prometheus** | Métricas de performance | Transparente — só no backend |

> **Nota importante:** Para o FlutterFlow, o FlutterFlow se comunica com o **backend Go** (REST API). Não é necessário integrar Asaas, Evolution, ou OpenRouter diretamente no FlutterFlow. Essas integrações já estão implementadas no backend.

### Configurações de Ambiente Necessárias

Para o FlutterFlow conectar ao backend, você precisará apenas de:

| Variável | Valor | Onde usar |
|----------|-------|-----------|
| `BACKEND_URL` | `https://api.revendaclick.com.br` | Base URL de todas as chamadas à API |
| `SUPABASE_URL` | URL do projeto Supabase | Login/Auth via Supabase SDK |
| `SUPABASE_ANON_KEY` | Chave pública do Supabase | Login/Auth via Supabase SDK |

### Fluxo de Autenticação no FlutterFlow

```
FlutterFlow (Supabase Auth SDK)
  → Login com e-mail e senha
  → Supabase retorna JWT
  → Todas as chamadas à API usam: Authorization: Bearer {JWT}
  → Backend Go valida o JWT e serve os dados corretos
```

---

## 10. ORDEM DE MIGRAÇÃO PARA FLUTTERFLOW

### Princípio da Migração

**O backend Go não muda.** Todo o trabalho é reconstruir o frontend (Next.js) no FlutterFlow. O backend continua servindo os mesmos endpoints REST.

### Fase 0 — Preparação (Pré-requisito)

**Objetivo:** Garantir que o FlutterFlow consiga se comunicar com o backend antes de migrar qualquer tela.

- [ ] Configurar projeto no FlutterFlow
- [ ] Adicionar Supabase como provedor de autenticação
- [ ] Configurar a base URL do backend: `https://api.revendaclick.com.br`
- [ ] Criar um tipo de dado JSON para representar o token JWT
- [ ] Criar interceptor global de autenticação (adicionar header `Authorization: Bearer {token}` em todas as chamadas)
- [ ] Testar chamada básica a `/health` para confirmar comunicação

**Riscos:** Nenhum. Não altera nada no sistema atual.

---

### Fase 1 — Autenticação (Semana 1)

**Objetivo:** Usuário consegue fazer login, registro, recuperação de senha e ser redirecionado corretamente.

**Telas a criar:**
1. `/login` — Formulário de e-mail e senha
2. `/register` — Criação de conta
3. `/forgot-password` — Solicitação de redefinição
4. `/reset-password` — Formulário de nova senha

**APIs usadas:**
- Supabase Auth (nativo no SDK Flutter)

**Lógica de redirecionamento:**
- Login com sucesso → verificar se tem `tenant_id` no JWT
  - Sim: ir para Dashboard
  - Não: ir para Onboarding

**Complexidade:** Baixa — o Supabase SDK do Flutter já implementa todo o fluxo.

---

### Fase 2 — Onboarding (Semana 1-2)

**Objetivo:** Novo usuário consegue configurar sua loja.

**Telas a criar:**
1. `/onboarding` — Wizard de 1 passo com campos: nome da loja, slug, e-mail, WhatsApp

**APIs usadas:**
- `POST /api/onboarding/setup` — cria loja e inicia trial

**Atenção:**
- Após sucesso, o JWT precisa ser atualizado (novo `tenant_id`)
- No Flutter: forçar refresh da sessão Supabase para obter novo token

**Complexidade:** Baixa.

---

### Fase 3 — Dashboard e Layout (Semana 2)

**Objetivo:** Estrutura base de navegação e painel inicial.

**Telas a criar:**
1. `/dashboard` — KPIs (veículos, leads, receita, fluxo de caixa)

**APIs usadas:**
- `GET /api/usage` — contadores do plano
- `GET /api/sales` — resumo de vendas
- `GET /api/financial/cash-flow` — receita do mês

**Estrutura de navegação:**
- Bottom Navigation Bar com: Dashboard, Leads, Veículos, Financeiro, Menu
- Drawer lateral para: Clientes, Analytics, WhatsApp, Configurações, Billing

**Complexidade:** Média — envolve criar o layout padrão reutilizável.

---

### Fase 4 — Veículos (Semana 2-3)

**Objetivo:** Gerenciar inventário de veículos.

**Telas a criar:**
1. `/vehicles` — Listagem com filtros
2. `/vehicles/new` — Formulário de criação
3. `/vehicles/:id` — Edição
4. (público) `/loja/:slug/veiculos/:slug` — Página pública do veículo

**APIs usadas:**
- `GET /api/vehicles`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `GET /api/fipe/brands`, `/models`, `/versions`
- Upload de imagens (Supabase Storage)

**Complexidade:** Média-Alta — envolve upload de imagens e seletores FIPE encadeados.

---

### Fase 5 — Leads e CRM (Semana 3-4)

**Objetivo:** Gerenciar leads e funil de vendas.

**Telas a criar:**
1. `/leads` — Lista de leads (com filtros por status)
2. `/leads/:id` — Detalhes do lead com histórico de atividades
3. Visualização kanban (opcional — pode ser entregue depois)

**APIs usadas:**
- `GET /api/leads`
- `PUT /api/leads/:id`
- `GET /api/leads/:id/activities`
- `POST /api/leads/:id/activities`
- `GET /api/leads/follow-ups`

**Complexidade:** Média-Alta — o kanban drag-and-drop é o ponto mais complexo. Pode ser substituído temporariamente por uma lista com seletor de status.

---

### Fase 6 — Clientes e Vendas (Semana 4)

**Objetivo:** Cadastro de clientes e registro de vendas.

**Telas a criar:**
1. `/customers` — Lista de clientes
2. `/customers/new` e `/customers/:id` — Criar/editar cliente
3. `/sales` — Lista de vendas
4. `/sales/new` — Registrar nova venda

**APIs usadas:**
- CRUD de `/api/customers`
- CRUD de `/api/sales`
- `POST /api/sales/:id/complete`
- `GET /api/commissions`

**Complexidade:** Média.

---

### Fase 7 — Financeiro (Semana 5)

**Objetivo:** Gestão financeira e comissões.

**Telas a criar:**
1. `/financial` — Lançamentos financeiros + gráfico de fluxo de caixa
2. `/financial/commissions` — Comissões de vendedores

**APIs usadas:**
- `GET /api/financial/entries`
- `POST /api/financial/entries`
- `GET /api/financial/cash-flow`
- `GET /api/commissions`
- `PATCH /api/commissions/:id/pay`

**Complexidade:** Média — o gráfico pode ser implementado via Custom Widget com `fl_chart`.

---

### Fase 8 — Equipe e Configurações (Semana 5-6)

**Objetivo:** Gerenciar membros da equipe e configurações da loja.

**Telas a criar:**
1. `/vendors` — Lista de vendedores
2. `/vendors/new` e `/vendors/:id` — Criar/editar vendedor
3. `/settings` — Dados da loja, tema, redes sociais

**APIs usadas:**
- CRUD de `/api/users`
- `GET /api/users/sellers`
- `GET /api/tenants/me`
- `PUT /api/tenants/me`

**Complexidade:** Baixa-Média.

---

### Fase 9 — Billing e Planos (Semana 6)

**Objetivo:** Gerenciar assinatura e upgrades.

**Telas a criar:**
1. `/billing` — Status da assinatura, próxima renovação
2. `/billing/plans` — Comparativo de planos
3. `/billing/history` — Histórico de faturas

**APIs usadas:**
- `GET /api/billing/subscription`
- `GET /api/billing/invoices`
- `POST /api/billing/subscribe`
- `DELETE /api/billing/subscription`

**Complexidade:** Média — a abertura do link de pagamento (Boleto/PIX) pode ser feita via `url_launcher`.

---

### Fase 10 — WhatsApp (Semana 7)

**Objetivo:** Conexão e gerenciamento da instância WhatsApp.

**Telas a criar:**
1. `/whatsapp` — Painel de conexão com QR code

**APIs usadas:**
- `GET /api/evolution/status`
- `POST /api/evolution/connect`
- `DELETE /api/evolution/disconnect`
- `GET /api/evolution/qr`
- `POST /api/evolution/send`

**Complexidade:** Média — o QR code pode ser exibido com o pacote `qr_flutter`.

---

### Fase 11 — Vitrine Pública (Semana 7-8)

**Objetivo:** Marketplace público do revendedor.

**Telas a criar:**
1. `/loja/:slug` — Homepage da loja com veículos
2. `/loja/:slug/veiculos/:slug-veiculo` — Página do veículo com formulário de lead

**APIs usadas:**
- `GET /api/public/:slug/`
- `GET /api/public/:slug/vehicles`
- `GET /api/public/:slug/vehicles/:vehicleSlug`
- `POST /api/public/:slug/leads`

**Atenção:** Estas são rotas **sem autenticação**. No FlutterFlow, não enviar header de Authorization.

**Complexidade:** Média — é SEO-crítico no Next.js, mas no FlutterFlow é apenas UI.

---

### Fase 12 — Analytics e IA (Semana 8)

**Objetivo:** Relatórios avançados e funcionalidades de IA.

**Telas a criar:**
1. `/analytics` — Métricas avançadas (apenas plano Premium+)

**APIs usadas:**
- `GET /api/analytics/summary`
- `POST /api/ai/suggest-reply`
- `POST /api/ai/classify-lead`

**Controle de acesso:**
- Verificar plano antes de exibir o menu
- Exibir tela de upgrade se plano não suportar

**Complexidade:** Baixa (dados simples) — o gráfico é o ponto mais complexo.

---

### Cronograma Resumido

| Semana | Fases | Telas entregues |
|--------|-------|----------------|
| 1 | Auth + Onboarding | Login, Registro, Forgot Password, Onboarding |
| 2 | Dashboard + Veículos (início) | Dashboard, Layout base, Listagem de Veículos |
| 3 | Veículos + Leads (início) | Form Veículo, Upload Fotos, Lista de Leads |
| 4 | Leads + Clientes + Vendas | Detalhes Lead, Atividades, Clientes, Vendas |
| 5 | Financeiro + Equipe | Financeiro, Comissões, Vendors |
| 6 | Settings + Billing | Configurações da Loja, Assinatura, Planos, Faturas |
| 7 | WhatsApp + Vitrine (início) | Conexão WhatsApp, Vitrine Pública |
| 8 | Vitrine + Analytics + IA | Página do Veículo, Analytics, Sugestões IA |

**Total estimado: 8 semanas para migração completa.**

---

### Pontos de Atenção para o FlutterFlow

#### O que funciona nativamente:
- Autenticação via Supabase Auth SDK
- Leitura/escrita no Supabase (tabelas com RLS)
- Upload de imagens para Supabase Storage
- Chamadas REST para o backend Go
- Deep links e navegação

#### O que precisa de Custom Widget:
- Kanban com drag-and-drop
- Gráficos de barras/linha (usar `fl_chart`)
- QR Code do WhatsApp (usar `qr_flutter`)
- Seletores FIPE encadeados com 3 níveis

#### O que NÃO precisa ser reconstruído:
- Backend Go (continua igual)
- Banco Supabase (continua igual)
- Integrações: Asaas, Evolution, OpenRouter
- Nginx, Docker, CI/CD
- Webhooks

#### Estratégia de transição gradual:
1. Publicar o app FlutterFlow em paralelo com o Next.js
2. Migrar uma tela de cada vez
3. Usar o mesmo backend para ambos simultaneamente
4. Quando 100% das telas estiverem prontas no FlutterFlow, deprecar o Next.js

---

*Documento gerado em 22/05/2026 — RevendaClick v1.0*
