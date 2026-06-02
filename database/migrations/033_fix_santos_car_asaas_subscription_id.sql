-- Migration 033: Corrigir asaas_subscription_id do tenant santos-car
--
-- Contexto: O campo asaas_subscription_id do tenant santos-car continha o valor
-- legado 'dev_test_fd1172f6-11e7-4555-8fe3-082fd1849587' (fictício, criado em
-- ambiente de desenvolvimento).
--
-- Auditoria (sessão 35 — 02/06/2026):
--   - customer Asaas: cus_000178518508 (real, produção)
--   - subscriptions no Asaas: 3 add-ons ativos + 1 plano principal encontrado
--   - sub_gqu4uiro0sisshxt: Plano Pro R$197/mês — deleted:true, INACTIVE
--     (criado em sessão 27, cancelado posteriormente)
--   - Nenhuma assinatura ativa do plano principal existe no Asaas atualmente
--
-- Ação: substituir o ID fictício pelo ID histórico real para rastreabilidade.
-- NOTA: a assinatura sub_gqu4uiro0sisshxt está DELETADA no Asaas.
--       Para upgrade/downgrade funcionar, será necessário criar uma nova
--       assinatura Asaas via fluxo de subscribe (sem forçar criação automática).

UPDATE public.subscriptions
SET
  asaas_subscription_id = 'sub_gqu4uiro0sisshxt',
  updated_at = now()
WHERE tenant_id = 'fd1172f6-11e7-4555-8fe3-082fd1849587'
  AND asaas_subscription_id = 'dev_test_fd1172f6-11e7-4555-8fe3-082fd1849587';
