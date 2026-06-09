# FC040 — Supabase: search_path mutable + REVOKE FROM PUBLIC

**Sessão:** 47 (continuação)  
**Data:** 09/06/2026  
**Severidade:** WARN (segurança — nenhum dado exposto, sem impacto operacional)  
**Status:** CONCLUÍDA

---

## Problema 1 — `function_search_path_mutable` (8 funções)

### Descrição

O Supabase Advisor reportava `function_search_path_mutable` (WARN) para 8 funções no schema `public`. Quando `search_path` não está fixado, uma função pode ser vulnerável a ataques de "search path injection" — um objeto malicioso em outro schema pode interceptar chamadas a funções/tabelas sem qualificação de schema.

### Funções afetadas

| Função | Tipo | SECURITY DEFINER |
|---|---|---|
| `_mark_first_lead_received()` | trigger | sim |
| `_mark_store_published()` | trigger | sim |
| `_mark_vehicle_added()` | trigger | sim |
| `_set_tenant_features_updated_at()` | trigger | não |
| `_update_onboarding_completed()` | trigger | sim |
| `auto_assign_trial_subscription()` | trigger | sim |
| `auto_create_onboarding_checklist()` | trigger | sim |
| `get_tenant_usage(uuid)` | utility | sim |

### Correção

```sql
ALTER FUNCTION public._mark_first_lead_received()         SET search_path = public;
ALTER FUNCTION public._mark_store_published()             SET search_path = public;
ALTER FUNCTION public._mark_vehicle_added()               SET search_path = public;
ALTER FUNCTION public._set_tenant_features_updated_at()   SET search_path = public;
ALTER FUNCTION public._update_onboarding_completed()      SET search_path = public;
ALTER FUNCTION public.auto_assign_trial_subscription()    SET search_path = public;
ALTER FUNCTION public.auto_create_onboarding_checklist()  SET search_path = public;
ALTER FUNCTION public.get_tenant_usage(uuid)              SET search_path = public;
```

`ALTER FUNCTION ... SET search_path` é não-destrutivo — preserva lógica, permissões e triggers vinculadas. Não reescreve o corpo da função.

---

## Problema 2 — `anon_security_definer_function_executable` (REVOKE incompleto de FC039)

### Descrição

FC039 aplicou `REVOKE EXECUTE FROM anon, authenticated` nas 6 funções de trigger. Porém, em PostgreSQL, `EXECUTE` é concedido à pseudo-role `PUBLIC` por padrão ao criar qualquer função. `anon` e `authenticated` herdam de `PUBLIC`, por isso `has_function_privilege('anon', ..., 'EXECUTE')` continuava retornando `true` mesmo após o REVOKE explícito.

O Supabase Advisor detecta o acesso real via `has_function_privilege`, não apenas grants explícitos na tabela `information_schema.routine_privileges`.

### Causa raiz

```
CREATE FUNCTION → EXECUTE granted to PUBLIC (default PostgreSQL)
anon inherits from PUBLIC → anon can execute
authenticated inherits from PUBLIC → authenticated can execute
REVOKE FROM anon, authenticated → remove explicit grants, but PUBLIC grant remains
has_function_privilege('anon', ..., 'EXECUTE') → still true (via PUBLIC)
```

### Correção

```sql
REVOKE EXECUTE ON FUNCTION public._mark_first_lead_received()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._mark_store_published()            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._mark_vehicle_added()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._update_onboarding_completed()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_trial_subscription()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_onboarding_checklist() FROM PUBLIC;
```

### Por que as triggers continuam funcionando?

Funções de trigger com `SECURITY DEFINER` são invocadas pelo mecanismo de trigger do PostgreSQL com os privilégios do **dono da função** (function owner), não do role que disparou o DML. O PostgreSQL não verifica `EXECUTE` do role chamador para funções executadas por triggers — apenas para chamadas explícitas via SQL/RPC. Portanto, `REVOKE FROM PUBLIC` não afeta o funcionamento dos triggers.

---

## Validação pós-correção

```
has_function_privilege('anon', '_mark_first_lead_received', 'EXECUTE')        → false ✅
has_function_privilege('anon', '_mark_store_published', 'EXECUTE')            → false ✅
has_function_privilege('anon', '_mark_vehicle_added', 'EXECUTE')              → false ✅
has_function_privilege('anon', '_update_onboarding_completed', 'EXECUTE')     → false ✅
has_function_privilege('anon', 'auto_assign_trial_subscription', 'EXECUTE')   → false ✅
has_function_privilege('anon', 'auto_create_onboarding_checklist', 'EXECUTE') → false ✅
```

Todas as 8 funções com `search_path=public` confirmado via `pg_proc.proconfig`.

---

## Estado do Advisor após FC040

| Tipo | Nível | Contagem | Status |
|---|---|---|---|
| `function_search_path_mutable` | WARN | **0** | ✅ Eliminado |
| `anon_security_definer_function_executable` | WARN | **0** | ✅ Eliminado |
| `authenticated_security_definer_function_executable` | WARN | **0** | ✅ Eliminado |
| `rls_enabled_no_policy` | INFO | 36 | INTENCIONAL — tabelas Evolution deny-all |
| `security_definer_view` | ERROR | 1 | `plan_usage` — legacy view pré-existente |
| `auth_leaked_password_protection` | WARN | 1 | BLOQUEADO — Supabase Free plan |

---

## SQL aplicado (tudo via execute_sql, sem migration)

```sql
-- search_path
ALTER FUNCTION public._mark_first_lead_received()         SET search_path = public;
ALTER FUNCTION public._mark_store_published()             SET search_path = public;
ALTER FUNCTION public._mark_vehicle_added()               SET search_path = public;
ALTER FUNCTION public._set_tenant_features_updated_at()   SET search_path = public;
ALTER FUNCTION public._update_onboarding_completed()      SET search_path = public;
ALTER FUNCTION public.auto_assign_trial_subscription()    SET search_path = public;
ALTER FUNCTION public.auto_create_onboarding_checklist()  SET search_path = public;
ALTER FUNCTION public.get_tenant_usage(uuid)              SET search_path = public;

-- REVOKE FROM PUBLIC (completa o REVOKE parcial de FC039)
REVOKE EXECUTE ON FUNCTION public._mark_first_lead_received()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._mark_store_published()            FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._mark_vehicle_added()              FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._update_onboarding_completed()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_assign_trial_subscription()   FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_onboarding_checklist() FROM PUBLIC;
```

---

## Prevenção

- Ao criar qualquer função no schema `public` que não deve ser chamada via REST API: aplicar imediatamente `ALTER FUNCTION ... SET search_path = public` + `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC`
- Para funções de trigger: sempre REVOKE FROM PUBLIC (triggers não dependem de EXECUTE do role chamador)
- Para funções utilitárias chamadas pelo frontend autenticado (ex: `get_tenant_usage`): manter EXECUTE para `authenticated`, não revogar de PUBLIC — ou conceder explicitamente para `authenticated` após o REVOKE de PUBLIC
