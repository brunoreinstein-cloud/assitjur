-- ============================================
-- FASE 2: CORRIGIR 3 FUNÇÕES PRINCIPAIS
-- ============================================

-- 1. log_user_action - Função crítica de auditoria
DROP FUNCTION IF EXISTS public.log_user_action(text, text, uuid, jsonb);
CREATE FUNCTION public.log_user_action(
  action_type text, 
  resource_type text DEFAULT NULL, 
  resource_id uuid DEFAULT NULL, 
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF action_type NOT LIKE '%PROFILE%' AND current_user_id IS NOT NULL THEN
    SELECT * INTO user_profile FROM profiles WHERE user_id = current_user_id;
  END IF;
  
  INSERT INTO audit_logs (
    user_id, email, role, organization_id, action, resource, 
    table_name, result, metadata, ip_address, user_agent
  ) VALUES (
    current_user_id, 
    COALESCE(user_profile.email, 'system'), 
    COALESCE(user_profile.role::text, 'unknown'), 
    user_profile.organization_id,
    action_type, 
    COALESCE(resource_type, 'system'), 
    COALESCE(resource_type, 'system'),
    'SUCCESS', 
    metadata,
    inet '127.0.0.1', 
    'AssistJur-App'
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
$$;

-- 2. log_data_access - Rastreamento de acesso a dados sensíveis
DROP FUNCTION IF EXISTS public.log_data_access(text, uuid[], text);
CREATE FUNCTION public.log_data_access(
  p_table_name text,
  p_record_ids uuid[] DEFAULT NULL,
  p_access_type text DEFAULT 'SELECT'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  IF user_profile IS NOT NULL THEN
    INSERT INTO data_access_logs (
      org_id, user_id, accessed_table, accessed_records, access_type, 
      ip_address, user_agent
    ) VALUES (
      user_profile.organization_id, auth.uid(), p_table_name, p_record_ids, p_access_type,
      inet '127.0.0.1', 'AssistJur-App'
    );
  END IF;
END;
$$;

-- 3. setup_default_retention_policies - LGPD compliance
DROP FUNCTION IF EXISTS public.setup_default_retention_policies(uuid);
CREATE FUNCTION public.setup_default_retention_policies(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup) VALUES
    (p_org_id, 'processos', 60, false),
    (p_org_id, 'audit_logs', 24, true),
    (p_org_id, 'openai_logs', 12, true),
    (p_org_id, 'data_access_logs', 24, true),
    (p_org_id, 'lgpd_requests', 36, false)
  ON CONFLICT (org_id, table_name) DO NOTHING;
END;
$$;

-- Documentação de segurança
COMMENT ON FUNCTION public.log_user_action IS 
  'SECURITY HARDENED: Auditoria com search_path fixo - previne path injection';

COMMENT ON FUNCTION public.log_data_access IS 
  'SECURITY HARDENED: Rastreamento de acesso com search_path fixo - compliance LGPD';

COMMENT ON FUNCTION public.setup_default_retention_policies IS 
  'SECURITY HARDENED: Retenção LGPD com search_path fixo - evita manipulação de dados';