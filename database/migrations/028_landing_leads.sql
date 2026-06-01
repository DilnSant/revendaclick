-- landing_leads: captura de leads da landing page (pré-signup, sem tenant_id)
-- Esta tabela é de marketing — não é uma tabela de negócio do SaaS.
-- Anon pode INSERT (formulário público). SELECT restrito ao service_role.

CREATE TABLE IF NOT EXISTS public.landing_leads (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL CHECK (char_length(name)  BETWEEN 2 AND 120),
  phone        text        NOT NULL CHECK (char_length(phone) BETWEEN 10 AND 20),
  email        text                 CHECK (email IS NULL OR char_length(email) <= 200),
  store_name   text                 CHECK (store_name IS NULL OR char_length(store_name) <= 200),
  source       text        NOT NULL DEFAULT 'organic',
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_content  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode inserir (formulário público da landing page)
CREATE POLICY "landing_leads_public_insert"
  ON public.landing_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT restrito: apenas service_role (admin lê via backend)
-- Nenhuma policy SELECT → authenticated/anon não conseguem ler.

CREATE INDEX IF NOT EXISTS idx_landing_leads_created_at
  ON public.landing_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_landing_leads_source
  ON public.landing_leads (source, utm_source, utm_medium);
