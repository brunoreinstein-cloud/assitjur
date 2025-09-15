-- Fix function security issues by adding search_path and SECURITY DEFINER

-- Fix setup_default_retention_policies function
CREATE OR REPLACE FUNCTION public.setup_default_retention_policies(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup) VALUES
    (p_org_id, 'processos', 60, false), -- 5 years for legal processes
    (p_org_id, 'audit_logs', 24, true),  -- 2 years for audit logs
    (p_org_id, 'openai_logs', 12, true), -- 1 year for AI logs
    (p_org_id, 'data_access_logs', 24, true), -- 2 years for access logs
    (p_org_id, 'lgpd_requests', 36, false) -- 3 years for LGPD requests
  ON CONFLICT (org_id, table_name) DO NOTHING;
END;
$$;

-- Fix setup_retention_for_new_org function  
CREATE OR REPLACE FUNCTION public.setup_retention_for_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM setup_default_retention_policies(NEW.id);
  RETURN NEW;
END;
$$;

-- Fix log_profile_access function
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = check_user_id 
    AND role = 'ADMIN' 
    AND is_active = true
  );
END;
$$;

-- Fix rpc_get_deletion_impact function
CREATE OR REPLACE FUNCTION public.rpc_get_deletion_impact(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}';
  v_total_processos integer;
  v_total_pessoas integer;
  v_active_processos integer;
  v_soft_deleted integer;
BEGIN
  -- Count total processos
  SELECT COUNT(*) INTO v_total_processos
  FROM processos 
  WHERE org_id = p_org_id;

  -- Count active processos (not soft deleted)
  SELECT COUNT(*) INTO v_active_processos
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL;

  -- Count soft deleted processos
  SELECT COUNT(*) INTO v_soft_deleted
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NOT NULL;

  -- Count people records
  SELECT COUNT(*) INTO v_total_pessoas
  FROM pessoas 
  WHERE org_id = p_org_id;

  -- Build result
  v_result := jsonb_build_object(
    'total_processos', v_total_processos,
    'active_processos', v_active_processos,
    'soft_deleted_processos', v_soft_deleted,
    'total_pessoas', v_total_pessoas,
    'estimated_time_minutes', GREATEST(1, (v_total_processos + v_total_pessoas) / 1000)
  );

  RETURN v_result;
END;
$$;