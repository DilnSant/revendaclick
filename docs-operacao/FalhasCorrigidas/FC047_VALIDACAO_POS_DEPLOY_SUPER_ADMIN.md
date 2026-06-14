# FC047 — Validação Pós-Deploy Super Admin CRUD (FC046)

**Data:** 14/06/2026
**Sessão:** 52
**Severidade:** CRÍTICA (bugs de compilação) + MÉDIA (audit_logs constraint)
**Área:** Admin / Backend / Banco
**Status:** RESOLVIDO

---

## Bugs Encontrados e Corrigidos

### BUG-1: Compile error — `evoSvcInst` use before declaration (CRÍTICA)

**Arquivo:** `backend/internal/server/server.go`

**Sintoma:**
`evolutionH` usava `evoSvcInst` na linha 73, mas `evoSvcInst` era declarado na linha 80.
Go não compila variável usada antes de sua declaração. CI/CD `go vet ./...` falhou.
Backend nunca recebeu o deploy do FC046.

**Correção:**
Movida declaração `evoSvcInst := evolution.NewService(...)` para antes de `evolutionH`.

**Commit:** `4b27afb`

---

### BUG-2: audit_logs.tenant_id NOT NULL — INSERT falha para ops globais (MÉDIA)

**Arquivo:** `backend/internal/admin/repository.go`, Supabase `audit_logs`

**Sintoma:**
`WriteAdminAudit` passava `NULL` para `tenant_id` em operações globais (UpdatePlan,
WADisconnect, WARestart). A coluna `audit_logs.tenant_id` era NOT NULL → INSERT
falhava silenciosamente (fire-and-forget). Ops de plano e WhatsApp não eram auditadas.

**Correção:**
```sql
ALTER TABLE audit_logs ALTER COLUMN tenant_id DROP NOT NULL;
```
Aplicado via Supabase MCP. RLS existente não é afetado: linhas com tenant_id=NULL
são invisíveis para tenants (a policy filtra por JWT tenant_id). Apenas service_role
do backend (que bypassa RLS) pode lê-las.

---

### BUG-3: entity_id não-UUID em WhatsApp audit (MÉDIA)

**Arquivo:** `backend/internal/admin/handler.go`

**Sintoma:**
`WADisconnect` e `WARestart` passavam o nome da instância Evolution (ex: "santos-car-wa")
como `entity_id`. A coluna `entity_id` é do tipo `uuid`. PostgreSQL rejeitava o cast
text → uuid. INSERT falhava silenciosamente.

**Correção:**
Alterado para passar `""` (→ NULL) como `entityID`. O nome da instância fica registrado
em `new_data.name`.

**Commit:** `e094b85`

---

## Validação Executada

### Build
- `npm run build` → LIMPO ✓ (13 rotas admin compiladas)
- `npm run lint` → 0 erros, 2 warnings pré-existentes (não relacionados) ✓
- `npx tsc --noEmit` → LIMPO ✓

### Segurança (3 camadas confirmadas)
- **Layout SSR** (`(admin)/layout.tsx`): redirect para /dashboard se `user_role != super_admin` ✓
- **Proxy API** (`/api/admin/[...path]/route.ts`): 403 se `role != super_admin` ✓
- **Backend middleware** (`RequireRole("super_admin")`): 401 sem auth, 403 se role errado ✓
- Todos os endpoints admin retornam 401 sem autenticação (confirmado em produção) ✓

### Banco de Dados (queries validadas via Supabase MCP)
- `ListSubscriptions` → 5 rows, todos os campos mapeados corretamente ✓
- `ListUsersAdmin` → super_admin com tenant_id=NULL corretamente retornado ✓
- `ListPlansAdmin` → 4 planos com features como array ✓
- `UpdateSubscription` (ROLLBACK) → CASE/COALESCE funciona; clear_grace_until=true → NULL ✓
- `UpdatePlan` (ROLLBACK) → display_name alterado; COALESCE protege campos não enviados ✓
- `UpdateTenantAdmin` (ROLLBACK) → nome alterado corretamente ✓
- `UpdateUserAdmin` (ROLLBACK) → role alterado; tenant_id NULL scaneado como *string ✓
- `audit_logs INSERT` com tenant_id → registra user_id, action, entity_type, old_data, new_data, ip ✓
- `audit_logs INSERT` com tenant_id=NULL → funciona após ALTER TABLE ✓

### Deploy CI/CD
- Commit `1b9599c` (FC046): CI/CD falhou em `go vet` (BUG-1)
- Commit `4b27afb` (fix BUG-1): deployed com sucesso → `rc_backend` image `4b27afb...` ✓
- Commit `e094b85` (fix BUG-3): deployed com sucesso → `rc_backend` image `e094b85...` ✓
- Backend healthy: `{"db":"ok","status":"ok"}` ✓

---

## Funcionalidades Aprovadas (pós-correção)

| Módulo | Listagem | Edição | Segurança | Audit |
|---|---|---|---|---|
| Tenants | ✓ | ✓ | ✓ 3 camadas | ✓ com tenant_id |
| Assinaturas | ✓ | ✓ | ✓ 3 camadas | ✓ com tenant_id |
| Usuários | ✓ | ✓ (role, is_active, name) | ✓ 3 camadas | ✓ com tenant_id |
| Planos | ✓ | ✓ (display_name, preços, features) | ✓ 3 camadas | ✓ tenant_id=NULL |
| WhatsApp | ✓ (QR, disconnect, restart) | — | ✓ 3 camadas | ✓ tenant_id=NULL |

---

## Funcionalidades Reprovadas / Limitações

- Nenhuma funcionalidade reprovada.
- WhatsApp QR/disconnect/restart: `entity_id` em audit_log é NULL (nome da instância não é UUID). Nome registrado em `new_data.name` como workaround.

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `backend/internal/server/server.go` | Reordenar `evoSvcInst` antes de `evolutionH` |
| `backend/internal/admin/handler.go` | entity_id `""` em WADisconnect e WARestart |
| Supabase `audit_logs` | `ALTER COLUMN tenant_id DROP NOT NULL` |

---

## Status Final FC046

**APROVADO** — Todas as funcionalidades do Super Admin CRUD estão operacionais em produção.
