-- CORREÇÕES CRÍTICAS - Fase 2
-- Resolver warnings restantes de search_path e RLS

-- 1. Identificar e corrigir todas as funções sem search_path
-- Estas são as funções críticas que ainda precisam de correção:

-- Corrigir handle_new_user (trigger de profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir setup_retention_for_new_org  
CREATE OR REPLACE FUNCTION public.setup_retention_for_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM setup_default_retention_policies(NEW.id);
  RETURN NEW;
END;
$$;

-- Corrigir check_beta_signup_rate_limit
CREATE OR REPLACE FUNCTION public.check_beta_signup_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if this email has signed up recently (within 24 hours)
  IF EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
    AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: Email already signed up recently';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Corrigir log_profile_access
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log profile access attempts for security monitoring
  PERFORM log_user_action(
    'ACCESS_PROFILE',
    'profiles', 
    NEW.id,
    jsonb_build_object(
      'accessed_user_id', NEW.user_id,
      'organization_id', NEW.organization_id
    )
  );
  RETURN NEW;
END;
$$;

-- 2. Verificar tabelas com RLS sem policies (resolver WARNING INFO 1)
-- Adicionar policies para cleanup_logs se necessário
CREATE POLICY "System can update cleanup logs" 
ON public.cleanup_logs 
FOR UPDATE 
TO service_role
USING (true);

-- Adicionar policy para data_access_logs update se necessário  
CREATE POLICY "System can update data access logs"
ON public.data_access_logs
FOR UPDATE 
TO service_role  
USING (true);

-- 3. Comentários de segurança adicionais
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY: Trigger for user creation - search_path secured';
COMMENT ON FUNCTION public.setup_retention_for_new_org() IS 'SECURITY: Auto-setup retention policies - search_path secured';
COMMENT ON FUNCTION public.check_beta_signup_rate_limit() IS 'SECURITY: Rate limiting for beta signups - search_path secured';

-- 4. Função para verificar status de segurança geral
CREATE OR REPLACE FUNCTION public.get_security_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' 
      AND c.relrowsecurity = true
    ),
    'functions_with_search_path', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proconfig IS NOT NULL
      AND 'search_path=public' = ANY(p.proconfig)
    ),
    'timestamp', now()
  );
$$;