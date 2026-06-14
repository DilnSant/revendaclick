# FC049 — Tenants: Quarentena e Exclusão Controlada

**Data:** 14/06/2026
**Sessão:** 53
**Severidade:** FEATURE
**Área:** Admin / Frontend / Backend / Banco
**Status:** IMPLEMENTADO — aguarda deploy CI/CD

---

## ETAPA 1 — Auditoria das Ações Existentes

### Editar
- **Endpoint:** `PUT /api/admin/tenants/:id`
- **Tabela afetada:** `tenants` — campos `name`, `email`, `slug`
- **O que NÃO altera:** subscription, billing, features, is_active, auth
- **Efeito do slug:** muda URL pública da loja (`/:slug`) — sem impacto em backend API (usa UUID internamente)

### Ativar Pro
- **Endpoint:** `POST /api/admin/tenants/:id/activate` `{plan_name: "pro"}`
- **Tabela afetada:** `subscriptions`
- **Campos alterados:** `plan_id`, `status='active'`, `asaas_subscription_id=COALESCE(existente, 'admin_activated_'+id)`, `current_period_start=NOW()`, `current_period_end=NOW()+30d`, `trial_ends_at=NULL`, `grace_until=NULL`, `canceled_at=NULL`
- **Billing Asaas:** NÃO criado — prefixo `admin_activated_` indica ativação manual sem cobrança
- **Duração:** 30 dias a partir da ativação

### +7 dias trial
- **Endpoint:** `POST /api/admin/tenants/:id/extend-trial` `{days: 7}`
- **Tabela afetada:** `subscriptions`
- **Campos alterados:** `status='trialing'`, `trial_ends_at=GREATEST(trial_ends_at, NOW())+7d`, `current_period_end=GREATEST(current_period_end, NOW())+7d`, `canceled_at=NULL`
- **Comportamento acumulativo:** usa `GREATEST(atual, NOW())` — nunca regride a data
- **Billing:** sem impacto

### + Atendimento
- **Endpoint:** `POST /api/admin/tenants/:id/features` `{feature: 'central_atendimento', note: 'Admin grant'}`
- **Tabela afetada:** `tenant_features` (UPSERT)
- **Efeito:** `ComputeFeatureFlags()` passa a retornar `has_central_atendimento=true` na próxima requisição
- **Add-on Asaas:** NÃO criado — concessão manual sem cobrança

### Bloquear
- **Endpoint:** `POST /api/admin/tenants/:id/block`
- **Tabela afetada:** `tenants.is_active = false`
- **Login Supabase:** NÃO impedido (auth continua válido)
- **APIs backend:** BLOQUEADAS — middleware verifica `is_active = TRUE`
- **Billing Asaas:** CONTINUA — Asaas não verifica is_active
- **WhatsApp Evolution:** CONTINUA — Evolution não verifica is_active
- **Dados:** PRESERVADOS
- **Vitrine pública:** BLOQUEADA — `SlugTenantResolver` retorna 404

---

## ETAPA 2 — Tooltips

Adicionados via componente `<Tip>` com popup CSS puro em todas as ações:

| Ação | Tooltip |
|---|---|
| Editar | "Editar nome, e-mail e slug do tenant" |
| Ativar Pro | "Converte imediatamente para o plano Pro (30 dias, sem cobrança Asaas)" |
| +7 dias trial | "Adiciona 7 dias ao período de avaliação (acumulativo)" |
| + Atendimento | "Ativa o módulo Central de Atendimento (WhatsApp CRM) sem cobrança" |
| Quarentena | "Suspende todo acesso (API, painel, WhatsApp) com registro de motivo. Dados preservados." |
| Sair Quarentena | "Remove da quarentena e restaura acesso ao sistema" |
| Bloquear | "Impede acesso ao sistema sem excluir dados. Billing continua normalmente." |
| Desbloquear | "Restaura acesso completo ao sistema" |
| Excluir (ícone) | "Excluir tenant (lógico ou físico). Requer confirmação." |

---

## ETAPA 3 — Quarentena

### Novo status
- Campo `tenants.quarantined_at TIMESTAMPTZ` (migration 037)
- Campo `tenants.quarantine_reason TEXT` (migration 037)
- Diferença de **Bloquear**: quarentena tem motivo registrado, data/hora e badge distinto

### Comportamento
- `POST /api/admin/tenants/:id/quarantine` `{reason: "..."}` → `is_active=false, quarantined_at=NOW(), quarantine_reason`
- `POST /api/admin/tenants/:id/unquarantine` → `is_active=true, quarantined_at=NULL, quarantine_reason=NULL`
- Middleware: acesso bloqueado via `is_active=FALSE` (mesmo mecanismo de block)
- Badge na UI: âmbar "quarentena" — hover mostra o motivo registrado

### Modal de Quarentena
- Campo obrigatório: motivo
- Lista clara de efeitos: bloqueia API, painel, WhatsApp; preserva dados e billing
- Audit log registra quarentena com old/new data

---

## ETAPA 4+5 — Exclusão Controlada

### Exclusão Lógica (padrão)
- `DELETE /api/admin/tenants/:id` `{reason: "..."}`
- Altera: `tenants.deleted_at=NOW(), deleted_reason, is_active=false`
- Resultado: tenant oculto do `ListTenants` (`WHERE deleted_at IS NULL`)
- Middleware: bloqueia acesso (`AND deleted_at IS NULL` nas 3 queries)
- Dados: PRESERVADOS — reversível via SQL direto

### Exclusão Física
- `DELETE /api/admin/tenants/:id?hard=true` `{reason: "..."}`
- Executa `DELETE FROM tenants WHERE id=$1`
- FKs CASCADE: 22 tabelas filhas deletadas automaticamente
- Irreversível

### Modal de Exclusão
- Busca resumo via `GET /api/admin/tenants/:id/delete-summary` (nome, plano, status, usuários, veículos, leads, clientes)
- Seletor: Exclusão Lógica (laranja) vs Física (vermelho)
- Campo motivo (opcional)
- Confirmação primária: digitar `EXCLUIR`
- Confirmação dupla (apenas exclusão física): digitar `SIM, EXCLUIR TUDO`
- Audit log registra summary completo em old_data antes de deletar

---

## ETAPA 6 — Segurança

| Camada | Validação |
|---|---|
| Frontend layout SSR | redirect para /dashboard se `user_role != super_admin` |
| Proxy `/api/admin/[...path]/route.ts` | 403 se `role != super_admin` |
| Backend middleware | `RequireRole("super_admin")` em todos os endpoints admin |
| DELETE físico | Requer dois campos confirmados no frontend |

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `database/migrations/037_tenant_quarantine_soft_delete.sql` | 4 novas colunas em tenants + índice |
| `backend/internal/admin/model.go` | `TenantSummary` +2 campos; `QuarantineTenantRequest`, `DeleteTenantRequest` |
| `backend/internal/admin/repository.go` | `ListTenants` +quarantine fields +`WHERE deleted_at IS NULL`; +5 novos métodos |
| `backend/internal/admin/handler.go` | +4 handlers: Quarantine, Unquarantine, GetDeleteSummary, DeleteTenant |
| `backend/internal/server/server.go` | +5 rotas: quarantine, unquarantine, delete-summary, DELETE /:id |
| `backend/internal/middleware/tenant.go` | +`AND deleted_at IS NULL` nas 3 queries de resolução de tenant |
| `frontend/app/(admin)/admin/_components/AdminTenantsTable.tsx` | Reescrita completa — tooltips, badge quarentena, modal quarentena, modal exclusão |

## Endpoints Criados

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/admin/tenants/:id/quarantine` | Quarentenar |
| `POST` | `/api/admin/tenants/:id/unquarantine` | Retirar da quarentena |
| `GET` | `/api/admin/tenants/:id/delete-summary` | Resumo antes de excluir |
| `DELETE` | `/api/admin/tenants/:id` | Exclusão lógica |
| `DELETE` | `/api/admin/tenants/:id?hard=true` | Exclusão física |

## Tabelas Alteradas

| Tabela | Alteração |
|---|---|
| `tenants` | +`quarantined_at`, `quarantine_reason`, `deleted_at`, `deleted_reason` |

## Novo Status

| Status | Campo | Comportamento |
|---|---|---|
| `quarantined` | `quarantined_at IS NOT NULL` | is_active=false + motivo registrado + badge âmbar |
| `deleted` (lógico) | `deleted_at IS NOT NULL` | Oculto da listagem + middleware bloqueia |

---

## Riscos

| Risco | Mitigação |
|---|---|
| Hard delete acidental | Dupla confirmação: `EXCLUIR` + `SIM, EXCLUIR TUDO` |
| Quarentena sem motivo | Campo obrigatório no modal |
| Middleware não bloqueia deletado | `AND deleted_at IS NULL` adicionado nas 3 queries |
| FKs sem CASCADE | Verificado: 21 tabelas CASCADE, 1 SET NULL — hard delete seguro |

---

## Resultado da Auditoria Etapa 1 — Bloquear (detalhe)

> Pergunta do usuário: "login é impedido? APIs bloqueadas? billing continua? WhatsApp continua? dados permanecem?"

| Pergunta | Resposta |
|---|---|
| Login Supabase Auth impedido? | **NÃO** — token Supabase continua válido |
| APIs backend bloqueadas? | **SIM** — middleware rejeita `is_active=FALSE` com 403 |
| Vitrine pública (`/:slug`) bloqueada? | **SIM** — `SlugTenantResolver` retorna 404 |
| Billing Asaas continua? | **SIM** — Asaas não verifica is_active |
| WhatsApp Evolution continua? | **SIM** — Evolution não verifica is_active |
| Dados preservados? | **SIM** — apenas flag boolean alterada |
