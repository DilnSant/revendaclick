-- ============================================================
-- Migration 026: rename performance → premium (definitivo)
-- Data: 2026-05-30
-- Motivo:
--   Padronizar plan.name no banco com o nome comercial oficial.
--   'performance' era nome interno; 'premium' é o nome definitivo
--   em toda a plataforma (DB, API, frontend, billing, docs).
-- Impacto:
--   - plans.name: 'performance' → 'premium'
--   - plans.display_name: 'Performance' → 'Premium'
--   - subscriptions usa plan_id (FK, UUID) — plan_name é derivado
--     via JOIN em runtime; nenhum campo denormalizado a atualizar.
-- Rollback: criar migration 027 com UPDATE inverso se necessário
-- ============================================================

UPDATE public.plans
SET
  name         = 'premium',
  display_name = 'Premium'
WHERE name = 'performance';
