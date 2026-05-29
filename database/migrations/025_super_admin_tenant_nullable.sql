-- Migration 025: super_admin architecture
-- users.tenant_id → nullable (super_admin não pertence a tenant)
-- Aplicada em: 2026-05-29

-- 1. Remover NOT NULL de users.tenant_id
ALTER TABLE public.users ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Atualizar super_admin em public.users (executado inline via MCP)
-- UPDATE public.users SET role='super_admin', tenant_id=NULL, updated_at=now()
-- WHERE id = '9e3af7eb-412b-4259-a457-727c287185e7';
