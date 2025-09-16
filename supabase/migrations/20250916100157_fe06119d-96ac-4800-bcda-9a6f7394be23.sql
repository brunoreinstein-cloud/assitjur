-- CORREÇÃO CRÍTICA: Corrigir erro de sintaxe e completar correções emergenciais

-- Primeiro, remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "service_role_rate_limit_counters_access" ON public.rate_limit_counters;
DROP POLICY IF EXISTS "service_role_rate_limit_hits_access" ON public.rate_limit_hits;

-- Recriar políticas sem IF NOT EXISTS
CREATE POLICY "service_role_rate_limit_counters_access"
ON public.rate_limit_counters
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_rate_limit_hits_access"
ON public.rate_limit_hits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar e corrigir função check_rate_limit caso já exista
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_limit integer DEFAULT 20,
  p_window_ms integer DEFAULT 60000
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := now() - (p_window_ms || ' milliseconds')::interval;
  
  -- Count recent requests
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_hits
  WHERE subject_id = p_key
    AND created_at > v_window_start;
  
  -- Insert current request  
  INSERT INTO rate_limit_hits (subject_id, route)
  VALUES (p_key, 'api')
  ON CONFLICT DO NOTHING;
  
  -- Return true if under limit
  RETURN v_count < p_limit;
END;
$$;

-- Função para monitorar status de segurança
CREATE OR REPLACE FUNCTION public.get_security_monitoring_status()
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
    'functions_with_security_definer', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.prosecdef = true
    ),
    'policies_count', (
      SELECT count(*) FROM pg_policies 
      WHERE schemaname = 'public'
    ),
    'status', 'active',
    'timestamp', now()
  );
$$;