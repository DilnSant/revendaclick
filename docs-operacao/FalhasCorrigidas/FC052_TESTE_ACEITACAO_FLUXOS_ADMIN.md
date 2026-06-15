# FC052 — Teste de Aceitação dos Fluxos Administrativos

**Data:** 15/06/2026
**Sessão:** 54
**Severidade:** VALIDAÇÃO + HOTFIX
**Área:** Admin / Backend / Audit
**Status:** CONCLUÍDA

---

## Objetivo

Validar em ambiente real o comportamento completo dos status de tenant
(bloqueado, quarentena, exclusão lógica, reversão) implementados em FC049/FC050/FC051.

---

## Infraestrutura de Teste

| Item | Valor |
|---|---|
| Tenant de teste | `teste-fc052` (criado/destruído durante a sessão) |
| Ambiente | Produção — `api.revendaclick.com.br` via VPS localhost:8080 |
| Commits testados | `5ed38aa` (FC051) + `191ad80` (hotfix audit) |
| JWT admin | Gerado com SUPABASE_JWT_SECRET — super_admin real |
| JWT tenant | Gerado com tenant_id do tenant de teste |

---

## Resultados por Fluxo

### Fluxo 1 — Bloqueado ✅ APROVADO

| Critério | Resultado |
|---|---|
| PRE-CHECK: API com tenant ativo | HTTP 200 ✓ |
| `POST /api/admin/tenants/:id/block` | HTTP 200 — `{"blocked":true}` ✓ |
| API `/vehicles` com bloqueado | HTTP 403 ✓ |
| API `/leads` com bloqueado | HTTP 403 ✓ |
| API `/billing/subscription` com bloqueado | HTTP 403 ✓ |
| Evolution WA — santos-car permanece `open` | `open` ✓ (BLOQUEADO não desconecta) |
| `POST /api/admin/tenants/:id/unblock` | HTTP 200 — `{"unblocked":true}` ✓ |
| API após desbloqueio | HTTP 200 ✓ |
| DB: is_active restaurado | `is_active=true, quarantined_at=NULL, deleted_at=NULL` ✓ |

### Fluxo 2 — Quarentena ✅ APROVADO

| Critério | Resultado |
|---|---|
| `POST .../quarantine` com motivo | HTTP 200 — `{"quarantined":true}` ✓ |
| API `/vehicles` em quarentena | HTTP 403 ✓ |
| API `/ai/suggest-reply` em quarentena | HTTP 403 ✓ |
| Evolution disconnect chamado | HTTP 404 da Evolution (instância inexistente) — graceful ✓ |
| Evolution: santos-car não afetado | `open` ✓ |
| `POST .../unquarantine` | HTTP 200 — `{"unquarantined":true}` ✓ |
| DB após saída: `quarantined_at=NULL` | `is_active=true, quarantined_at=NULL` ✓ |

> **Nota Evolution:** O tenant de teste não tinha instância WhatsApp criada em Evolution.
> O disconnect retornou 404 — comportamento graceful confirmado (erro ignorado pelo handler).
> Para tenant com instância real (`santos-car`), o disconnect executaria a desconexão completa.

### Fluxo 3 — Exclusão Lógica ✅ APROVADO

| Critério | Resultado |
|---|---|
| `GET .../delete-summary` | Retornou: name, email, slug, plano, sub_status, contagens ✓ |
| `DELETE /api/admin/tenants/:id` (soft) | HTTP 200 — `{"deleted":true,"mode":"soft"}` ✓ |
| DB: `deleted_at` preenchido | `2026-06-15 13:14:49` ✓ |
| DB: `deleted_reason` gravado | "Teste FC052 — exclusão lógica" ✓ |
| API `/vehicles` com excluído | HTTP 403 ✓ |
| ListTenants oculta o tenant | 6 tenants (não 7) — `teste-fc052` ausente ✓ |
| Evolution disconnect chamado | Graceful (sem instância) ✓ |

### Fluxo 4 — Reversão ✅ APROVADO

| Critério | Resultado |
|---|---|
| Block → API 403 → Unblock → API 200 | HTTP 403 → HTTP 200 ✓ |
| Quarantine → API 403 → Unquarantine → API 200 | HTTP 403 → HTTP 200 ✓ |
| Retorno imediato à operação normal | Confirmado ✓ |

### Frontend `/conta-suspensa` (parcialmente validado)

| Critério | Resultado |
|---|---|
| Rota protegida pelo proxy (sem sessão) | Redireciona para `/login?redirect=/conta-suspensa` ✓ |
| Rendering para usuário autenticado com tenant bloqueado | **Requer validação manual com browser** |
| Billing visível para BLOQUEADO | **Requer validação manual com browser** |

---

## Bug Encontrado e Corrigido Durante o Teste

### FC052-BUG: audit_logs nunca gravados pelo backend Go

**Descoberta:** Nenhuma entrada de audit_log foi gravada pelas operações de teste
(block, quarantine, soft_delete). As únicas entradas eram de writes via Supabase MCP.

**Causa raiz:** pgx v5 com `QueryExecModeSimpleProtocol` codifica `[]byte` como
bytea hex (`\xabcdef...`), não como texto. O PostgreSQL não converte `bytea → jsonb`
implicitamente. A INSERT falhava silenciosamente (`_, _ = pool.Exec(...)`).

**Impacto:** Toda trilha de auditoria do backend estava quebrada desde sempre:
- `audit/repository.go:Write` — audit de operações de tenant (FC039, FC040, etc.)
- `admin/repository.go:WriteAdminAudit` — audit de operações admin (FC046+)

**Severidade:** ALTA — recurso de auditoria completamente inoperante em produção.

**Correção:**

```go
// ANTES (falha silenciosa):
_, _ = r.pool.Exec(ctx,
    `INSERT INTO audit_logs (..., old_data, new_data, ...) VALUES (..., $6, $7, ...)`,
    ..., oldJSON, newJSON, ...   // []byte → bytea hex → falha na cast para jsonb
)

// DEPOIS (correto):
_, _ = r.pool.Exec(ctx,
    `INSERT INTO audit_logs (..., old_data, new_data, ...) VALUES (..., $6::jsonb, $7::jsonb, ...)`,
    ..., string(oldJSON), string(newJSON), ...   // string → text → cast implícita para jsonb ✓
)
```

**Arquivos corrigidos:**
- `backend/internal/admin/repository.go` — `WriteAdminAudit`
- `backend/internal/audit/repository.go` — `Write`

**Commit:** `191ad80`

**Validação pós-fix:** 5 entradas gravadas corretamente:

```
action=block        entity=tenant  new={is_active: false}
action=unblock      entity=tenant  new={is_active: true}
action=quarantine   entity=tenant  new={is_active: false, quarantine_reason: "teste f4"}
action=unquarantine entity=tenant  new={is_active: true, quarantined: false}
action=block        entity=tenant  new={is_active: false}
```

---

## Status Final da Arquitetura Administrativa

| Componente | Status |
|---|---|
| Block / Unblock | ✅ Operacional |
| Quarentena (motivo, badge, sair) | ✅ Operacional |
| Exclusão Lógica (soft delete) | ✅ Operacional |
| Exclusão Física (hard delete + CASCADE) | ✅ Operacional (validado via hard delete no cleanup) |
| ListTenants filtra excluídos | ✅ Operacional |
| Middleware bloqueia APIs para inativos | ✅ Operacional |
| Evolution disconnect em quarentena/exclusão | ✅ Chamado — graceful para sem instância |
| Evolution mantido para BLOQUEADO | ✅ Correto por design |
| Audit logs (backend → Supabase) | ✅ Operacional (corrigido nesta sessão) |
| `/conta-suspensa` redirect from proxy | ✅ Correto |
| `/conta-suspensa` rendering authenticated | ⚠️ Requer validação manual (browser) |

---

## Limpeza

Tenant `teste-fc052` removido via hard delete ao final do teste.
Nenhum dado residual em produção.
