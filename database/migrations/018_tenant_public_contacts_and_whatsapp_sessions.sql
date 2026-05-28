-- Migration 018: tenant_public_contacts + tenant_whatsapp_sessions
-- Separa contato público da loja (vitrine) de sessão operacional da Central de Atendimento

-- ────────────────────────────────────────────────────────────────────────────────
-- TABELA 1: tenant_public_contacts
-- Dados de contato público que aparecem na vitrine da loja
-- NUNCA inclui dados operacionais da Central de Atendimento (Evolution/QR)
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_public_contacts (
  id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  public_whatsapp TEXT,
  public_phone    TEXT,
  public_email    TEXT,
  instagram       TEXT,
  groups_link     TEXT,
  location        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Um registro por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_public_contacts_tenant_id
  ON public.tenant_public_contacts(tenant_id);

-- RLS
ALTER TABLE public.tenant_public_contacts ENABLE ROW LEVEL SECURITY;

-- Tenant autenticado lê apenas os seus
CREATE POLICY tenant_public_contacts_select_own ON public.tenant_public_contacts
  FOR SELECT TO authenticated
  USING (tenant_id = auth_tenant_id());

-- Visitantes anônimos podem ler (dados públicos da vitrine)
CREATE POLICY tenant_public_contacts_public_read ON public.tenant_public_contacts
  FOR SELECT TO anon
  USING (true);

-- Apenas o próprio tenant escreve
CREATE POLICY tenant_public_contacts_write_own ON public.tenant_public_contacts
  FOR ALL TO authenticated
  USING (tenant_id = auth_tenant_id())
  WITH CHECK (tenant_id = auth_tenant_id());

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_tenant_public_contacts
  BEFORE UPDATE ON public.tenant_public_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────────
-- TABELA 2: tenant_whatsapp_sessions
-- Estado da sessão da Central de Atendimento (Evolution API)
-- NUNCA aparece na vitrine pública
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_whatsapp_sessions (
  id                 UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id          UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instance_name      TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'disconnected',
  qr_code            TEXT,
  session_data       JSONB,
  last_connection_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Um registro por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_whatsapp_sessions_tenant_id
  ON public.tenant_whatsapp_sessions(tenant_id);

-- RLS — sessões são privadas por tenant
ALTER TABLE public.tenant_whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_whatsapp_sessions_select_own ON public.tenant_whatsapp_sessions
  FOR SELECT TO authenticated
  USING (tenant_id = auth_tenant_id());

CREATE POLICY tenant_whatsapp_sessions_write_own ON public.tenant_whatsapp_sessions
  FOR ALL TO authenticated
  USING (tenant_id = auth_tenant_id())
  WITH CHECK (tenant_id = auth_tenant_id());

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_tenant_whatsapp_sessions
  BEFORE UPDATE ON public.tenant_whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
