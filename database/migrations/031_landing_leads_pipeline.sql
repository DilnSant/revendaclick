-- Atualiza valores existentes antes de trocar a constraint
UPDATE public.landing_leads SET status = 'em_negociacao' WHERE status = 'atendido';
UPDATE public.landing_leads SET status = 'perdido'       WHERE status = 'descartado';

-- Substitui a CHECK constraint
ALTER TABLE public.landing_leads DROP CONSTRAINT IF EXISTS landing_leads_status_check;
ALTER TABLE public.landing_leads
  ADD CONSTRAINT landing_leads_status_check
  CHECK (status IN ('novo', 'contatado', 'em_negociacao', 'convertido', 'perdido'));

-- Novos campos operacionais
ALTER TABLE public.landing_leads
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action text
    CHECK (next_action IS NULL OR char_length(next_action) <= 200);
