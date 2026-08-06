-- 040 — Reset dos IDs Asaas após troca de conta (sessão 64)
--
-- CONTEXTO
-- A conta Asaas anterior foi encerrada. Todos os `customer` e `subscription` IDs
-- gravados no banco pertencem a ela e são inválidos na conta nova: a API responde
-- HTTP 400 `invalid_customer` (não 404), então o fallback de recuperação em
-- backend/internal/billing/service.go:101 — que testa strings.Contains(err, "404") —
-- NÃO dispara. Sem esta limpeza o billing fica quebrado silenciosamente.
--
-- POR QUE ISSO DESBLOQUEIA A RE-ASSINATURA
-- O guard de service.go:66-71 retorna a assinatura existente sem chamar o Asaas
-- quando asaas_subscription_id != '' E status IN ('active','trialing').
-- Zerando o ID, o guard deixa de bloquear e o fluxo normal de Subscribe roda.
-- Zerando tenants.asaas_customer_id, service.go:82-91 recria o customer sozinho.
--
-- HISTÓRICO PRESERVADO
-- billing_invoices (asaas_payment_id, asaas_subscription) e billing_events
-- (payloads brutos) NÃO são tocados — mantêm o rastro contábil e de auditoria da
-- conta antiga. Nenhum dos dois é usado para chamar a API do Asaas.
--
-- IRREVERSÍVEL NA PRÁTICA: a conta antiga está encerrada, os IDs não voltam.
-- Tirar o snapshot abaixo antes de aplicar.
--
-- Snapshot pré-aplicação (salvar a saída antes de rodar):
--   SELECT t.slug, t.asaas_customer_id, s.asaas_subscription_id, s.asaas_payment_link
--     FROM tenants t LEFT JOIN subscriptions s ON s.tenant_id = t.id
--    WHERE t.asaas_customer_id IS NOT NULL OR s.asaas_subscription_id IS NOT NULL;
--   SELECT * FROM billing_customers;

BEGIN;

-- 1. Assinaturas principais (4 registros com ID na data da escrita)
UPDATE public.subscriptions
   SET asaas_subscription_id = NULL,
       asaas_payment_link    = NULL
 WHERE asaas_subscription_id IS NOT NULL
    OR asaas_payment_link IS NOT NULL;

-- 2. Customer ID no tenant — é o que faz o Subscribe recriar o customer (service.go:82-91)
UPDATE public.tenants
   SET asaas_customer_id = NULL
 WHERE asaas_customer_id IS NOT NULL;

-- 3. Add-ons (3 registros, todos já com status='canceled')
UPDATE public.subscription_addons
   SET asaas_addon_id     = NULL,
       asaas_payment_link = NULL
 WHERE asaas_addon_id IS NOT NULL
    OR asaas_payment_link IS NOT NULL;

-- 4. billing_customers: asaas_id é NOT NULL, então não há como anular.
--    Tabela é write-only (único uso: INSERT ... ON CONFLICT em billing/repository.go:71;
--    nenhum SELECT no backend ou frontend). Todas as linhas pertencem à conta encerrada.
--    UpsertBillingCustomer recria no próximo Subscribe.
DELETE FROM public.billing_customers;

COMMIT;

-- VERIFICAÇÃO PÓS-APLICAÇÃO — todas as contagens devem ser 0:
--   SELECT
--     (SELECT count(*) FROM subscriptions       WHERE asaas_subscription_id IS NOT NULL) AS subs,
--     (SELECT count(*) FROM subscriptions       WHERE asaas_payment_link    IS NOT NULL) AS links,
--     (SELECT count(*) FROM tenants             WHERE asaas_customer_id     IS NOT NULL) AS custs,
--     (SELECT count(*) FROM subscription_addons WHERE asaas_addon_id        IS NOT NULL) AS addons,
--     (SELECT count(*) FROM billing_customers)                                          AS bcust;
--
-- E o histórico deve continuar intacto:
--   SELECT count(*) FROM billing_invoices;  -- esperado: 31
--   SELECT count(*) FROM billing_events;    -- esperado: 128
