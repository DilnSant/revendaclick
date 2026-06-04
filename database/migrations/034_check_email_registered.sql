-- Migration 034: Função para verificar existência de e-mail no fluxo de recuperação de senha
-- Consultado diretamente em auth.users (SECURITY DEFINER).
-- Apenas service_role pode chamar esta função — anon/authenticated não têm acesso.

CREATE OR REPLACE FUNCTION public.check_email_registered(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(p_email)
      AND deleted_at IS NULL
  );
END;
$$;

-- Restringir execução: somente service_role
REVOKE EXECUTE ON FUNCTION public.check_email_registered(text) FROM public, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_email_registered(text) TO service_role;
