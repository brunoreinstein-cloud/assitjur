-- CRITICAL SECURITY FIXES - Phase 2: Fix Remaining Security Warnings

-- Fix all remaining security definer functions that don't have proper search_path
CREATE OR REPLACE FUNCTION public.log_user_action(action_type text, resource_type text DEFAULT NULL, resource_id uuid DEFAULT NULL, metadata jsonb DEFAULT '{}')
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    email,
    role,
    organization_id,
    action,
    resource,
    result,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    user_profile.email,
    user_profile.role,
    user_profile.organization_id,
    action_type,
    COALESCE(resource_type, 'system'),
    'SUCCESS',
    metadata,
    inet '127.0.0.1',
    'Hubjuria-App'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(endpoint_name text, max_requests integer DEFAULT 60, window_minutes integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile IS NULL THEN
    RETURN false;
  END IF;
  
  window_start_time := now() - (window_minutes || ' minutes')::interval;
  
  -- Get current request count in window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM rate_limits_enhanced
  WHERE user_id = auth.uid()
    AND org_id = user_profile.organization_id
    AND endpoint = endpoint_name
    AND window_start > window_start_time;
  
  -- If over limit, return false
  IF current_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Record this request
  INSERT INTO rate_limits_enhanced (
    user_id,
    org_id,
    endpoint,
    request_count,
    window_start
  ) VALUES (
    auth.uid(),
    user_profile.organization_id,
    endpoint_name,
    1,
    now()
  );
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_critical_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  operation_type text;
  table_name text;
BEGIN
  table_name := TG_TABLE_NAME;
  operation_type := TG_OP;
  
  -- Log critical operations
  IF table_name IN ('profiles', 'processos', 'pessoas', 'org_settings') THEN
    PERFORM log_user_action(
      operation_type || '_' || table_name,
      table_name,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      jsonb_build_object(
        'table', table_name,
        'operation', operation_type,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Cleanup old audit logs (older than 2 years)
  DELETE FROM audit_logs 
  WHERE created_at < now() - interval '2 years';
  
  -- Cleanup old rate limit records (older than 7 days) 
  DELETE FROM rate_limits_enhanced
  WHERE created_at < now() - interval '7 days';
  
  -- Cleanup expired user sessions
  DELETE FROM user_sessions
  WHERE expires_at < now() OR NOT is_active;
  
  -- Cleanup old OpenAI logs (older than 1 year)
  DELETE FROM openai_logs
  WHERE created_at < now() - interval '1 year';
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_data_access(p_table_name text, p_record_ids uuid[] DEFAULT NULL, p_access_type text DEFAULT 'SELECT')
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile IS NOT NULL THEN
    INSERT INTO data_access_logs (
      org_id,
      user_id,
      accessed_table,
      accessed_records,
      access_type,
      ip_address,
      user_agent
    ) VALUES (
      user_profile.organization_id,
      auth.uid(),
      p_table_name,
      p_record_ids,
      p_access_type,
      inet '127.0.0.1',
      'AssistJur-App'
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(last_cleanup timestamp with time zone, retention_months integer)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN last_cleanup IS NULL THEN now() + interval '1 day'
    ELSE last_cleanup + interval '1 month'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.execute_retention_cleanup(p_policy_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  policy_record retention_policies%ROWTYPE;
  records_count integer := 0;
  cleanup_log_id uuid;
  cutoff_date timestamp with time zone;
  sql_query text;
BEGIN
  -- Get policy details
  SELECT * INTO policy_record 
  FROM retention_policies 
  WHERE id = p_policy_id AND auto_cleanup = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Policy not found or auto cleanup disabled'
    );
  END IF;
  
  -- Calculate cutoff date
  cutoff_date := now() - (policy_record.retention_months || ' months')::interval;
  
  -- Start cleanup log
  INSERT INTO cleanup_logs (
    org_id, policy_id, table_name, status
  ) VALUES (
    policy_record.org_id, p_policy_id, policy_record.table_name, 'STARTED'
  ) RETURNING id INTO cleanup_log_id;
  
  BEGIN
    -- Build and execute cleanup query based on table
    CASE policy_record.table_name
      WHEN 'processos' THEN
        -- Soft delete old processos
        UPDATE processos 
        SET deleted_at = now(), deleted_by = '00000000-0000-0000-0000-000000000000'
        WHERE org_id = policy_record.org_id 
          AND deleted_at IS NULL
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'audit_logs' THEN
        -- Hard delete old audit logs
        DELETE FROM audit_logs 
        WHERE organization_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'openai_logs' THEN
        -- Hard delete old OpenAI logs
        DELETE FROM openai_logs 
        WHERE org_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      WHEN 'data_access_logs' THEN
        -- Hard delete old access logs
        DELETE FROM data_access_logs 
        WHERE org_id = policy_record.org_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;
        
      ELSE
        -- Skip unknown tables
        records_count := 0;
    END CASE;
    
    -- Update policy last cleanup
    UPDATE retention_policies 
    SET 
      last_cleanup_at = now(),
      next_cleanup_at = calculate_next_cleanup(now(), retention_months),
      updated_at = now()
    WHERE id = p_policy_id;
    
    -- Complete cleanup log
    UPDATE cleanup_logs 
    SET 
      status = 'COMPLETED',
      records_affected = records_count,
      completed_at = now(),
      metadata = jsonb_build_object(
        'cutoff_date', cutoff_date,
        'retention_months', policy_record.retention_months
      )
    WHERE id = cleanup_log_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'records_affected', records_count,
      'cutoff_date', cutoff_date,
      'message', 'Cleanup completed successfully'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error
    UPDATE cleanup_logs 
    SET 
      status = 'FAILED',
      error_message = SQLERRM,
      completed_at = now()
    WHERE id = cleanup_log_id;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cleanup failed: ' || SQLERRM
    );
  END;
END;
$function$;