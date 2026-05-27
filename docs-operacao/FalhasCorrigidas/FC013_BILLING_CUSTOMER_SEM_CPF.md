# FC013 — Billing customer Asaas sem CPF — subscription rejeitada

## Data

2026-05-27

## Severidade

ALTA

## Sintoma

`POST /api/billing/subscribe` retornava erro da Asaas:
```
"Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente."
```

O cliente (`asaas_customer_id`) havia sido criado anteriormente sem CPF. A Asaas aceita criar o customer sem CPF, mas rejeita criar subscription/cobrança para esse customer.

## Contexto

Tenant `santos-car` tinha `asaas_customer_id = cus_000178475241` criado em uma sessão anterior de teste, sem CPF. Ao tentar assinar um plano, a Asaas rejeitava a criação da subscription por falta de CPF/CNPJ no customer.

## Causa Raiz

O fluxo de subscribe verificava se já havia `asaas_customer_id` no banco e reutilizava o customer existente. Se o customer foi criado sem CPF (em teste ou fluxo incompleto), qualquer subscribe futuro falhava. O backend não validava se o customer Asaas tinha CPF antes de criar a subscription.

## Arquivos Afetados

- Banco de dados — campo `asaas_customer_id` em `tenants`
- (Futuro) `backend/internal/billing/service.go` — validar CPF no customer antes de criar subscription

## Banco/Migrations

**Fix manual para o tenant afetado:**

```sql
-- Limpar asaas_customer_id para forçar criação de novo customer com CPF
UPDATE tenants
SET asaas_customer_id = NULL
WHERE slug = 'santos-car';
-- Na próxima chamada de subscribe, o backend cria novo customer com CPF
```

## Correção Aplicada

**Fix imediato:** Limpar `asaas_customer_id` do tenant afetado. O backend cria um novo customer com CPF na próxima chamada de subscribe.

**Resultado:** Novo customer criado: `cus_000178518508` (com CPF). Subscription criada com sucesso.

**Fix preventivo (backend — a implementar):** Antes de criar subscription, verificar se o customer já tem CPF/CNPJ via `GET /api/v3/customers/:id`. Se não tiver, atualizar com `PUT /api/v3/customers/:id` antes de criar a subscription.

## Commit(s)

Fix aplicado diretamente no banco via Supabase MCP (sem commit de código). O subscribe end-to-end foi confirmado na sessão 9.

## Como Validar

```sql
-- Verificar se tenant tem customer com CPF
SELECT slug, asaas_customer_id FROM tenants WHERE slug = 'santos-car';
-- asaas_customer_id deve ser cus_000178518508 (com CPF)

-- Para verificar no painel Asaas:
-- www.asaas.com → Clientes → buscar cus_000178518508 → confirmar CPF preenchido
```

## Resultado Final

`santos-car` tem `asaas_customer_id = cus_000178518508` com CPF. Subscribe funciona. Subscription `sub_nrprg7wb1iyf0szo` criada → `PAYMENT_CONFIRMED` → `status=active`.

## Risco de Regressão

**MÉDIO.** Se um novo tenant chegar ao subscribe sem CPF no formulário, o customer será criado sem CPF e a subscription falhará com o mesmo erro.

**Procedimento de recuperação:**
```sql
-- Para qualquer tenant com esse problema:
UPDATE tenants SET asaas_customer_id = NULL WHERE slug = '<slug>';
-- Depois: instruir o usuário a tentar novamente com CPF preenchido
```

## Prevenção Futura

1. O formulário de subscribe deve exigir CPF/CNPJ antes de chamar a API (validação no frontend).
2. O backend deve verificar se o customer Asaas tem CPF antes de criar subscription e, se não tiver, atualizá-lo.
3. Ao detectar customer sem CPF no banco (via queries periódicas), limpar o `asaas_customer_id` para forçar recriação com CPF.
4. Documentar: `UPDATE tenants SET asaas_customer_id = NULL WHERE slug = '...'` é o procedimento padrão para "resetar" customer Asaas.
