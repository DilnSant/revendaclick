# FC046 — Super Admin: CRUD Completo e Gerenciamento Global

**Data:** 14/06/2026
**Sessão:** 52
**Severidade:** FEATURE
**Área:** Admin / Full Stack
**Status:** RESOLVIDO

---

## Sintoma

Painel admin (`/admin/*`) era majoritariamente read-only. Operações críticas de gerenciamento global (editar tenant, editar assinatura, editar usuário, editar plano, gerenciar WhatsApp) exigiam acesso direto ao banco de dados ou não estavam disponíveis.

---

## Causa Raiz

Implementação original do painel admin (sessão 45) focou em observabilidade e leitura de dados. CRUD real não foi incluído no escopo inicial.

---

## Arquivos Afetados

### Backend
- `backend/internal/admin/model.go` — novos tipos para todas as operações de escrita
- `backend/internal/admin/repository.go` — métodos UpdateTenantAdmin, ListSubscriptions, UpdateSubscription, ListUsersAdmin, UpdateUserAdmin, ListPlansAdmin, UpdatePlan, WriteAdminAudit
- `backend/internal/admin/handler.go` — novos handlers + interface whatsappSvc + audit logging em todas mutações existentes
- `backend/internal/server/server.go` — evolutionWAAdapter + 10 novas rotas admin

### Frontend
- `frontend/app/(admin)/admin/subscriptions/_components/SubscriptionsTable.tsx` — NOVO
- `frontend/app/(admin)/admin/subscriptions/page.tsx` — atualizado com tenant_id + grace_until
- `frontend/app/(admin)/admin/users/_components/UsersTable.tsx` — NOVO
- `frontend/app/(admin)/admin/users/page.tsx` — SSR fetch do backend
- `frontend/app/(admin)/admin/plans/_components/PlansTable.tsx` — NOVO
- `frontend/app/(admin)/admin/plans/page.tsx` — NOVO
- `frontend/app/(admin)/admin/whatsapps/_components/WhatsAppActions.tsx` — NOVO
- `frontend/app/(admin)/admin/whatsapps/page.tsx` — atualizado com actions + revalidate=0
- `frontend/app/(admin)/admin/_components/AdminTenantsTable.tsx` — modal de edição adicionado
- `frontend/app/(admin)/_components/AdminShell.tsx` — nav item Planos adicionado

---

## Correção Aplicada

### Backend — Novos endpoints

```
PUT  /api/admin/tenants/:id           → editar nome, email, slug
GET  /api/admin/subscriptions         → listar todas as assinaturas
PUT  /api/admin/subscriptions/:id     → editar plano, status, datas, clear_trial, clear_grace
GET  /api/admin/users                 → listar todos os usuários globalmente
PUT  /api/admin/users/:id             → editar nome, role, is_active
GET  /api/admin/plans                 → listar planos com features
PUT  /api/admin/plans/:id             → editar display_name, preços, limites, features, is_active
GET  /api/admin/whatsapp/:name/qr     → retornar QR Code base64
POST /api/admin/whatsapp/:name/disconnect → desconectar instância
POST /api/admin/whatsapp/:name/restart    → reiniciar instância
```

### Backend — Detalhes técnicos

- `whatsappSvc` interface no `admin` package evita import circular com `evolution`
- `evolutionWAAdapter` em `server.go` adapta `evolution.Service` para a interface
- `WriteAdminAudit()` na admin repository aceita `tenantID=""` → NULL para operações globais (planos)
- UPDATE de plano usa `*string` para features (não `*[]byte`) para evitar bug de cast pgx → jsonb
- `UpdateSubscription` usa CASE/COALESCE com flags `clear_trial_end` e `clear_grace_until` para nullable dates

### Frontend

- Todos os modais de edição usam `useTransition` + `router.refresh()` para invalidar SSR
- `<Fragment key={...}>` usado em todos os `.map()` com múltiplas linhas (evita key prop warning)
- `revalidate = 0` em todas as pages admin para dados sempre frescos

### Segurança

- Todas as rotas protegidas por `jwtAuth + superAdmin` middleware no backend
- Frontend layout `(admin)/layout.tsx` já bloqueava não-super_admin antes desta FC
- Audit logging adicionado a: ActivateTenant, ExtendTrial, BlockTenant, UnblockTenant, GrantFeature, RevokeFeature + todas as novas operações de escrita

---

## Commit

`1b9599c` — feat(fc046): super admin CRUD completo — assinaturas, tenants, usuários, planos, whatsapp

---

## Como Validar

1. Acessar `/admin` como super_admin
2. **Assinaturas:** `/admin/subscriptions` → clicar Editar → alterar plano/status → salvar → row atualiza
3. **Tenants:** `/admin` → clicar Editar → alterar nome/email/slug → salvar
4. **Usuários:** `/admin/users` → clicar Desativar/Ativar → status muda; Editar → alterar role
5. **Planos:** `/admin/plans` → clicar Editar → alterar preço → salvar → tabela atualiza
6. **WhatsApp:** `/admin/whatsapps` → instância disconnected → "Ver QR" → QR modal abre
7. Verificar entradas em `audit_logs` após cada operação

---

## Resultado Final

Super Admin panel transformado em sistema completo de gerenciamento global:
- Assinaturas: edição total + cancelamento inline
- Tenants: edição de nome/email/slug com aviso de mudança de URL
- Usuários: listagem global + ativar/desativar + edição de role
- Planos: edição de preços/limites/features com aviso de impacto global
- WhatsApp: QR Code, desconectar, reiniciar direto do painel

---

## Risco de Regressão

BAIXO. Backend usa middleware `superAdmin` em todas as rotas. Sem impacto em rotas de tenant.

## Prevenção Futura

Ao adicionar novas ações admin: sempre incluir `WriteAdminAudit()` no handler e verificar `superAdmin` middleware na rota.
