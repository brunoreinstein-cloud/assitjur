-- ============================================
-- FASE 1B: Correções Finais de Segurança (Corrigido)
-- ============================================

-- 1. Corrigir view v_profile_role_usage_audit para SECURITY INVOKER
DROP VIEW IF EXISTS public.v_profile_role_usage_audit CASCADE;

CREATE VIEW public.v_profile_role_usage_audit
WITH (security_invoker=true) AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.role,
  p.organization_id,
  o.name as org_name,
  p.created_at,
  p.last_login_at,
  p.is_active
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.is_active = true;

-- 2. Corrigir função safe_fn com search_path correto
CREATE OR REPLACE FUNCTION public.safe_fn(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  -- function body: example simple operation
  perform 1; -- replace with real logic
end;
$$;