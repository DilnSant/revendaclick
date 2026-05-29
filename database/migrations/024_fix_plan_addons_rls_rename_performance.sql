-- ============================================================
-- Migration 024: RLS em plan_addons + rename premium→performance
-- Data: 2026-05-29
-- Motivo:
--   1. plan_addons não tinha RLS habilitado (risco R4)
--   2. Plano 3 deve chamar 'performance' conforme estratégia comercial
-- ============================================================

-- ── 1. Habilitar RLS em plan_addons ─────────────────────────
ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;

-- Leitura pública para autenticados (é catálogo de produtos)
CREATE POLICY plan_addons_read
  ON public.plan_addons
  FOR SELECT
  TO authenticated
  USING (true);

-- Leitura pública para anon (frontend precisa listar add-ons)
CREATE POLICY plan_addons_read_anon
  ON public.plan_addons
  FOR SELECT
  TO anon
  USING (true);

-- Escrita apenas para service_role (não criar policy — service_role bypassa RLS)

-- ── 2. Renomear plano premium → performance ──────────────────
UPDATE public.plans
SET
  name         = 'performance',
  display_name = 'Performance',
  tagline      = 'Automatize sua operação'
WHERE name = 'premium';
