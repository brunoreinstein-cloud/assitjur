-- CORREÇÕES CRÍTICAS DE SEGURANÇA - Fase 1
-- Fix RLS policies e search_path nas funções críticas

-- 1. Corrigir funções sem search_path (crítico para segurança)
CREATE OR REPLACE FUNCTION public.has_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  );
$$;

-- 2. Corrigir função calculate_next_cleanup sem search_path
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(last_cleanup timestamp with time zone, retention_months integer)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- 3. Adicionar RLS policies ausentes para profiles (CRÍTICO)
DROP POLICY IF EXISTS "profiles_org_members_read" ON public.profiles;
CREATE POLICY "profiles_org_members_read" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- User can see their own profile
  auth.uid() = user_id
  OR 
  -- Admin can see org members
  (
    EXISTS (
      SELECT 1 FROM profiles p2 
      WHERE p2.user_id = auth.uid() 
      AND p2.organization_id = profiles.organization_id 
      AND p2.role = 'ADMIN'
      AND p2.is_active = true
    )
  )
);

-- 4. Melhorar RLS para beta_signups (estava muito permissiva)
DROP POLICY IF EXISTS "Super admin manage beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin view beta signups" ON public.beta_signups;

CREATE POLICY "Admin can view beta signups" 
ON public.beta_signups 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

CREATE POLICY "Admin can manage beta signups" 
ON public.beta_signups 
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- 5. Corrigir função setup_default_retention_policies
CREATE OR REPLACE FUNCTION public.setup_default_retention_policies(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup) VALUES
    (p_org_id, 'processos', 60, false), -- 5 years for legal processes
    (p_org_id, 'audit_logs', 24, true),  -- 2 years for audit logs
    (p_org_id, 'openai_logs', 12, true), -- 1 year for AI logs
    (p_org_id, 'data_access_logs', 24, true), -- 2 years for access logs
    (p_org_id, 'lgpd_requests', 36, false) -- 3 years for LGPD requests
  ON CONFLICT (org_id, table_name) DO NOTHING;
END;
$function$;

-- 6. Comentários de segurança para auditoria
COMMENT ON FUNCTION public.has_financial_access() IS 'SECURITY: Controls access to financial data - only ADMIN with FULL access';
COMMENT ON POLICY "profiles_org_members_read" ON public.profiles IS 'SECURITY: Users see own profile + admins see org members';
COMMENT ON POLICY "Admin can view beta signups" ON public.beta_signups IS 'SECURITY: Only super admins can access beta signup data';

-- 7. Índices de segurança para performance
CREATE INDEX IF NOT EXISTS idx_profiles_security_lookup ON profiles(user_id, organization_id, role, is_active) 
WHERE role = 'ADMIN' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_audit_logs_security ON audit_logs(user_id, organization_id, created_at) 
WHERE organization_id IS NOT NULL;