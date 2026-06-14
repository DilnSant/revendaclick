# FC048 — Validação de Propagação Global de Planos

**Data:** 14/06/2026
**Sessão:** 53
**Severidade:** VALIDAÇÃO (sem bugs encontrados)
**Área:** Backend / Banco / Billing
**Status:** CONCLUÍDA — sem correções necessárias

---

## Objetivo

Validar que alterações em parâmetros de planos propagam corretamente para todos os tenants vinculados,
sem afetar billing, cache, RLS ou segurança.

---

## Plano Testado

| Campo | Valor |
|---|---|
| Plano | `pro` (display_name: Pro) |
| Plan ID | `95f83414-c4a7-40f9-9b10-1beb5a223650` |
| Tenants vinculados (active) | `santos-car` (`fd1172f6-...`), `sandbox-revendaclick` (`e72eb104-...`) |
| Parâmetro alterado | `max_leads`: 500 → 499 (temporário) |

---

## Validações Executadas

### 1. Propagação para tenants vinculados ✓

Após `UPDATE plans SET max_leads = 499 WHERE name = 'pro'`, a query equivalente ao `GetUsage()` do
backend retornou `max_leads=499` para ambos os tenants Pro:

```
sandbox-revendaclick → max_leads=499 ✓
santos-car           → max_leads=499 ✓
```

A propagação é **imediata** — sem delay ou TTL. Toda requisição lê o plano diretamente do banco.

---

### 2. GetUsage() — sem cache de limites de plano ✓

`backend/internal/plans/repository.go` — `GetUsage()` executa JOIN `subscriptions → plans` diretamente
no PostgreSQL a cada requisição. Não há in-memory cache, Redis cache, ou TTL para limites de plano.

---

### 3. ComputeFeatureFlags() — sem cache ✓

`backend/internal/plans/model.go` — `ComputeFeatureFlags()` é chamado após `GetUsage()` e deriva
feature gates dos valores retornados. Nenhum cache envolvido.

---

### 4. Billing inalterado ✓

Tabela `subscriptions` não foi afetada:
- `plan_id` permanece `95f83414-c4a7-40f9-9b10-1beb5a223650` para todos os tenants
- `asaas_subscription_id` preservado (`sub_b3y3xwo9s18g50xc` para santos-car)
- Nenhum campo de billing foi alterado pelo `UPDATE plans`

---

### 5. Cache invalidado corretamente ✓

`backend/internal/analytics/cache.go` tem TTL de 60s, mas é **exclusivo de sumários de analytics**.
Não armazena limites de plano, feature flags ou dados de billing. Redis não é usado pelo backend Go.

---

### 6. RLS inalterado ✓

Policy `plans_public_read` (SELECT = true) permanece intacta. Nenhuma policy afeta o UPDATE
via service_role do backend. Isolation de tenants por `tenant_id` em todas as tabelas de negócio
não é alterada por mudanças na tabela `plans`.

---

### 7. audit_logs registra a alteração ✓

INSERT com `tenant_id=NULL` funciona corretamente (após fix FC047 — `DROP NOT NULL`):

```
id: 97b0149c-6eb0-4e97-9042-68716742f315
action: fc048_test_update
entity_type: plan
entity_id: 95f83414-c4a7-40f9-9b10-1beb5a223650
old_data: {"max_leads": 500}
new_data: {"max_leads": 499}
```

---

### 8. Frontend — sem cache de planos ✓

Páginas admin usam `export const revalidate = 0` (no SSR cache). Chamadas a `/api/admin/plans`
retornam dados frescos. Páginas de billing do tenant usam SSR sem cache de plano.

---

## Resultado

| Critério | Resultado |
|---|---|
| Tenants vinculados recebem alteração | ✓ Imediato — próxima requisição |
| Backend reflete novos limites | ✓ GetUsage() sem cache |
| Frontend reflete novos limites | ✓ revalidate=0 + SSR fresco |
| Feature gates usam novos valores | ✓ ComputeFeatureFlags() direto da DB |
| Billing inalterado | ✓ plan_id + asaas_subscription_id preservados |
| Cache invalidado corretamente | ✓ Não há cache de planos |
| Middleware usa novos valores | ✓ PlanGate() chama GetUsage() fresh |
| RLS inalterado | ✓ plans_public_read intacta |
| audit_logs registra alteração | ✓ tenant_id=NULL aceito |

**Nenhum bug encontrado. Nenhuma correção necessária.**

---

## Restauração

Após validação, `max_leads` restaurado para 500:

```sql
UPDATE plans SET max_leads = 500 WHERE name = 'pro';
-- Confirmado: max_leads=500, max_vehicles=50, max_users=5, price_monthly=197.00
```

Audit_log de restauração registrado:
```
id: 28ef9724-5c83-44cf-97a9-15f82b86ef20
action: fc048_test_restore
old_data: {"max_leads": 499}
new_data: {"max_leads": 500}
```

---

## Arquivos Alterados

Nenhum arquivo de código alterado. Apenas validação via Supabase MCP com restauração completa.
