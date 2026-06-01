ALTER TABLE public.landing_leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'contatado', 'atendido', 'convertido', 'descartado')),
  ADD COLUMN IF NOT EXISTS notes text
    CHECK (notes IS NULL OR char_length(notes) <= 500),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_landing_leads_status
  ON public.landing_leads (status);
