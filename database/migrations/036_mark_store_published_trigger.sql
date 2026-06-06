-- Migration 036: trigger para marcar published_store no onboarding ao salvar contato público
-- Resolve: published_store nunca era setado pois não havia trigger em tenant_public_contacts
-- Análogo a trg_mark_vehicle_added e trg_mark_first_lead_received já existentes

CREATE OR REPLACE FUNCTION public._mark_store_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.onboarding_checklists
  SET published_store = true, updated_at = NOW()
  WHERE tenant_id = NEW.tenant_id
    AND published_store = false;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_store_published
AFTER INSERT OR UPDATE ON public.tenant_public_contacts
FOR EACH ROW EXECUTE FUNCTION public._mark_store_published();
