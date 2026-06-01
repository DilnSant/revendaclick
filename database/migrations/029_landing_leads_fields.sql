-- 029: adiciona campos de qualificação ao landing_leads
-- vehicles_count, city, state permitem segmentação e personalização do follow-up

ALTER TABLE public.landing_leads
  ADD COLUMN IF NOT EXISTS vehicles_count text
    CHECK (vehicles_count IS NULL OR char_length(vehicles_count) <= 50),
  ADD COLUMN IF NOT EXISTS city text
    CHECK (city IS NULL OR char_length(city) <= 100),
  ADD COLUMN IF NOT EXISTS state text
    CHECK (state IS NULL OR (char_length(state) = 2 AND state = upper(state)));

CREATE INDEX IF NOT EXISTS idx_landing_leads_state
  ON public.landing_leads (state)
  WHERE state IS NOT NULL;
