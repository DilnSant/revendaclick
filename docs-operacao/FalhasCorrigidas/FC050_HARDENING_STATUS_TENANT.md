# FC050 — Hardening dos Status de Tenant

**Data:** 15/06/2026
**Sessão:** 53
**Severidade:** FEATURE + HARDENING
**Área:** Auth / Frontend / Backend
**Status:** IMPLEMENTADO — aguarda deploy CI/CD

---

## Objetivo

Padronizar o comportamento de todos os status de tenant (bloqueado, quarentena, excluído)
para garantir que a experiência seja centralizada e explícita — sem 403s espalhados pelo sistema.

---

## Auditoria — Comportamento Anterior

| Status | Login | Painel | APIs | WhatsApp | Billing | CRM | Automações | Redirecionamento |
|---|---|---|---|---|---|---|---|---|
| **ativo** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (has_crm) | ✓ (has_automation) | — |
| **trialing** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| **bloqueado** | ✓ Supabase | ✗ | ✗ 403 | ✗ | ✗ | ✗ | ✗ | `/onboarding` ← ERRADO |
| **quarentena** | ✓ Supabase | ✗ | ✗ 403 | ✗ | ✗ | ✗ | ✗ | `/onboarding` ← ERRADO |
| **excluído** | ✓ Supabase | ✗ | ✗ 403 | ✗ | ✗ | ✗ | ✗ | `/onboarding` ← ERRADO |

**Bug principal:** `getTenantForUser` filtrava `is_active=TRUE` → retornava null para qualquer
tenant inativo → dashboard layout redirecionava para `/onboarding` como se o usuário
não tivesse tenant, causando loop ou confusão.

---

## Comportamento Implementado

### BLOQUEADO (`is_active=false`, sem quarantined_at, sem deleted_at)

| Critério | Comportamento |
|---|---|
| Login Supabase | **PERMITIDO** — auth não é afetada |
| Acesso ao painel | **BLOQUEADO** → redireciona para `/conta-suspensa?motivo=bloqueado` |
| APIs backend | **BLOQUEADAS** — middleware verifica `is_active=TRUE` |
| WhatsApp Evolution | **CONTINUA** — Evolution não verifica is_active |
| CRM / Veículos / Leads | **BLOQUEADOS** — via redirecionamento no dashboard layout |
| Automações | **BLOQUEADAS** |
| Tela de status | `/conta-suspensa` — mostra status da assinatura + contato suporte |

### QUARENTENA (`is_active=false`, `quarantined_at IS NOT NULL`)

| Critério | Comportamento |
|---|---|
| Login Supabase | **PERMITIDO** (Supabase Auth não diferencia) |
| Acesso ao painel | **BLOQUEADO** → `/conta-suspensa?motivo=quarentena` |
| APIs backend | **BLOQUEADAS** — is_active=FALSE |
| WhatsApp Evolution | **CONTINUA** (Evolution independente) |
| Tela de status | Mostra motivo + data da quarentena |
| Billing na tela | **NÃO exibido** — somente contato suporte |

### EXCLUÍDO (`deleted_at IS NOT NULL`)

| Critério | Comportamento |
|---|---|
| Login Supabase | **PERMITIDO** (auth persiste) |
| Acesso ao painel | **BLOQUEADO** → `/conta-suspensa?motivo=excluido` |
| APIs backend | **BLOQUEADAS** — deleted_at IS NULL nas 3 queries do middleware |
| Tela de status | Mostra data de encerramento |
| Billing na tela | **NÃO exibido** |

---

## Tela `/conta-suspensa`

Página autônoma (fora do route group `(dashboard)`) com:
- Badge colorido por status: vermelho (bloqueado), âmbar (quarentena), cinza (excluído)
- Descrição clara do status
- Motivo e data (quando disponível — quarentena/exclusão)
- Informações da assinatura (apenas para BLOQUEADO — via service_role Supabase, sem backend)
- Botão "Contato com suporte" → `mailto:suporte@revendaclick.com.br`
- Botão "Sair da conta" → POST `/api/auth/logout`
- Auto-redirect para `/dashboard` se tenant foi reativado (detectado via `getTenantStatusForUser`)

---

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `frontend/lib/database.types.ts` | Regenerado — inclui novos campos de tenant (migration 037) |
| `frontend/lib/tenant.ts` | +`TenantStatusResult` type; +`getTenantStatusForUser()` (sem filtro is_active) |
| `frontend/app/(dashboard)/layout.tsx` | Usa `getTenantStatusForUser` em vez de `getTenantForUser`; redireciona para `/conta-suspensa` por status |
| `frontend/app/conta-suspensa/page.tsx` | Nova página de status centralizada |
| `frontend/app/api/auth/logout/route.ts` | Nova rota POST de logout |
| `frontend/proxy.ts` | +`/conta-suspensa` em `PROTECTED_PREFIXES` |

---

## Função `getTenantStatusForUser`

```typescript
// Queries tenant sem filtro is_active — retorna estado completo
export const getTenantStatusForUser = cache(async (userId: string): Promise<TenantStatusResult | null>)
```

- Usa `createServiceClient()` (service_role) — bypassa RLS
- Filtra apenas `users.is_active=TRUE` (usuário deve estar ativo)
- NÃO filtra `tenants.is_active` — por design, para detectar tenants inativos
- Retorna `is_active`, `quarantined_at`, `quarantine_reason`, `deleted_at`

## Rota de Logout

```
POST /api/auth/logout
```

- `supabase.auth.signOut()` + redirect para `/login`
- Usada pelo botão "Sair da conta" na página `/conta-suspensa`

---

## Decisão de Arquitetura

> **Por que não bloquear o login no Supabase Auth?**
> Supabase Auth não diferencia entre bloqueado/quarantena/excluído administrativamente.
> O bloqueio é implementado no nível da aplicação — o usuário pode fazer login mas
> não consegue acessar nada útil. Esta é a abordagem padrão em SaaS.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Loop de redirect | `/conta-suspensa` está FORA do (dashboard) route group — sem loop |
| Tenant desbloqueado não vê dashboard | Auto-redirect: page verifica estado atual e redireciona se ativo |
| WhatsApp Evolution continua para quarentena | Aceito — Evolution é independente do backend Go |
| Dados de assinatura via service_role | Apenas leitura via Supabase SDK — sem bypass de RLS para escrita |
