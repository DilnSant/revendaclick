# FC051 — Validação de Serviços Externos por Status do Tenant

**Data:** 15/06/2026
**Sessão:** 54
**Severidade:** HARDENING
**Área:** WhatsApp / Evolution / Backend / Admin
**Status:** IMPLEMENTADO — aguarda deploy CI/CD

---

## Objetivo

Auditar e corrigir o comportamento de todos os serviços externos (Evolution WhatsApp,
CRM, IA, Webhooks, Automações, Billing) para cada status de tenant
(ativo, trialing, bloqueado, quarentena, excluído).

---

## Matriz de Auditoria — Estado Antes da Correção

| Serviço | ATIVO/TRIALING | BLOQUEADO | QUARENTENA | EXCLUÍDO |
|---|---|---|---|---|
| Login (Supabase) | ✓ | Permitido → /conta-suspensa | Permitido → /conta-suspensa | Permitido → /conta-suspensa |
| Todas as APIs de negócio | ✓ | BLOQUEADO (resolveTenant: is_active=FALSE) | BLOQUEADO | BLOQUEADO (resolveTenant: deleted_at IS NULL) |
| Billing APIs (grupo `free`) | ✓ | BLOQUEADO (resolveTenant) | BLOQUEADO | BLOQUEADO |
| Billing webhook Asaas | ✓ | **ATIVO** (rota pública, token-validated) | **ATIVO** | **ATIVO** |
| WA connection (Evolution) | ✓ | **PERSISTE** | **PERSISTE** ← DIVERGÊNCIA | **PERSISTE** ← DIVERGÊNCIA |
| Evolution webhook → lead | ✓ | DROP silencioso (is_active check) | DROP silencioso | DROP silencioso |
| IA (OpenRouter) | ✓ | BLOQUEADO (gated) | BLOQUEADO | BLOQUEADO |
| CRM / Leads / Veículos | ✓ | BLOQUEADO (gated) | BLOQUEADO | BLOQUEADO |
| Automações / Campanhas | N/A (não implementado) | N/A | N/A | N/A |

---

## Regras Esperadas

| Status | WA connection | Auto-send WA | IA | CRM | Billing webhook | APIs |
|---|---|---|---|---|---|---|
| **ATIVO** | ✓ conectado | ✓ | ✓ | ✓ | ✓ | ✓ |
| **TRIALING** | ✓ conectado | ✓ | ✓ | ✓ | ✓ | ✓ |
| **BLOQUEADO** | ✓ **mantido** | ✗ (APIs bloqueadas) | ✗ | ✗ | ✓ | ✗ |
| **QUARENTENA** | ✗ **desconectar** | ✗ | ✗ | ✗ | ✓ | ✗ |
| **EXCLUÍDO** | ✗ **desconectar** | ✗ | ✗ | ✗ | ✓ | ✗ |

---

## Divergências Encontradas

### 1. WA connection persiste para QUARENTENA (divergência)

**O que acontece:** Ao quarentenar um tenant, o backend seta `is_active=false`.
A Evolution API é um serviço independente — ela não consulta nossa DB para manter
a conexão WhatsApp ativa. A instância permanece conectada mesmo com o tenant quarentenado.

**Impacto:** Tenant quarentenado continua aparecendo como "conectado" no Evolution,
pode receber mensagens (mas webhooks serão ignorados pelo backend — drop silencioso).

**Correção:** `QuarantineTenant` handler chama `DisconnectInstance` após o DB update.

### 2. WA connection persiste para EXCLUÍDO (divergência)

**O que acontece:** Mesma causa raiz. Soft delete e hard delete não notificavam Evolution.

**Impacto:** Instância permanece conectada no Evolution após exclusão do tenant.

**Correção:** `DeleteTenant` handler chama `DisconnectInstance` após o DB update (soft e hard).

---

## O que estava correto (sem divergência)

- **BLOQUEADO**: WA fica conectado ✓ — tenant pode reativar assinatura e retomar operação sem reconectar
- **Billing webhook (Asaas)**: público, processa para todos os status ✓ — subscription pode ser atualizada mesmo com tenant bloqueado
- **Evolution webhook → lead**: `tenantIDByInstance()` verifica `is_active=TRUE`, dropar silenciosamente ✓
- **IA, CRM, APIs**: todos bloqueados via middleware para qualquer status inativo ✓
- **Automações/Campanhas**: não implementadas — sem divergência

---

## Correção Implementada

**Arquivo:** `backend/internal/admin/handler.go`

### QuarantineTenant (antes)

```go
func (h *Handler) QuarantineTenant(c *gin.Context) {
    // ...
    if err := h.repo.QuarantineTenant(c.Request.Context(), tenantID, req.Reason); err != nil { ... }
    // (sem disconnect)
}
```

### QuarantineTenant (depois)

```go
func (h *Handler) QuarantineTenant(c *gin.Context) {
    // ...
    summary, _ := h.repo.GetTenantDeleteSummary(c.Request.Context(), tenantID)
    if err := h.repo.QuarantineTenant(c.Request.Context(), tenantID, req.Reason); err != nil { ... }
    // Disconnect WhatsApp — quarantined tenants must not stay connected
    if slug, ok := summary["slug"].(string); ok && slug != "" {
        _ = h.waSvc.DisconnectInstance(c.Request.Context(), slug)
    }
}
```

### DeleteTenant (antes)

```go
if hard {
    summary, _ := h.repo.GetTenantDeleteSummary(...) // só para audit
    h.repo.HardDeleteTenant(...)
    // (sem disconnect)
}
h.repo.SoftDeleteTenant(...)
// (sem disconnect)
```

### DeleteTenant (depois)

```go
// Fetch slug before deletion (hard delete removes the row)
summary, _ := h.repo.GetTenantDeleteSummary(c.Request.Context(), tenantID)
slug, _ := summary["slug"].(string)

if hard {
    h.repo.HardDeleteTenant(...)
    if slug != "" { _ = h.waSvc.DisconnectInstance(c.Request.Context(), slug) }
}
// soft
h.repo.SoftDeleteTenant(...)
if slug != "" { _ = h.waSvc.DisconnectInstance(c.Request.Context(), slug) }
```

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `backend/internal/admin/handler.go` | `QuarantineTenant` + `DeleteTenant` (soft e hard): chamam `DisconnectInstance` após DB update |

---

## Comportamento do Disconnect (não-fatal)

- `DisconnectInstance(ctx, slug)` faz `DELETE /instance/logout/{slug}` na Evolution API
- Erro é ignorado (`_ =`) — se o tenant não tinha instância criada, a chamada falha com 4xx mas o fluxo continua
- Log não emitido — Evolution retorna 404 para instâncias inexistentes (normal)

---

## Decisão de Arquitetura

> **Por que BLOQUEADO mantém a conexão WA?**
> Tenant bloqueado pode estar em atraso de pagamento ou em verificação manual.
> A reativação deve ser imediata — sem precisar reconectar o WhatsApp.
> APIs do backend bloqueiam envios via `resolveTenant`, então não há risco de envio não autorizado.

> **Por que QUARENTENA/EXCLUÍDO desconectam?**
> Nesses casos a intenção é isolamento completo — o tenant não deve mais ter presença ativa
> em nenhum serviço externo. Evolution manter a conexão sem backend funcional é um estado inconsistente.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Disconnect falha (Evolution offline) | Ignorado (`_ =`) — DB operation já committed, estado consistente no lado backend |
| Tenant sem instância Evolution (nunca usou WhatsApp) | Evolution retorna 404 → ignorado silenciosamente |
| Hard delete remove row antes do disconnect | Slug obtido via `GetTenantDeleteSummary` ANTES do `HardDeleteTenant` |
