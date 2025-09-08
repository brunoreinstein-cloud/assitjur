-- Fix remaining functions without search_path settings
-- Complete the security hardening

CREATE OR REPLACE FUNCTION public.log_user_action(
  action_type text, 
  resource_type text DEFAULT NULL::text, 
  resource_id uuid DEFAULT NULL::uuid, 
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id, email, role, organization_id, action, resource, result, metadata, ip_address, user_agent
  ) VALUES (
    auth.uid(), user_profile.email, user_profile.role, user_profile.organization_id,
    action_type, COALESCE(resource_type, 'system'), 'SUCCESS', metadata,
    inet '127.0.0.1', 'Hubjuria-App'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text, 
  p_record_ids uuid[] DEFAULT NULL::uuid[], 
  p_access_type text DEFAULT 'SELECT'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  IF user_profile IS NOT NULL THEN
    INSERT INTO data_access_logs (
      org_id, user_id, accessed_table, accessed_records, access_type, ip_address, user_agent
    ) VALUES (
      user_profile.organization_id, auth.uid(), p_table_name, p_record_ids, p_access_type,
      inet '127.0.0.1', 'AssistJur-App'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_name text, 
  max_requests integer DEFAULT 60, 
  window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_count integer;
  window_start_time timestamp with time zone;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
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
    user_id, org_id, endpoint, request_count, window_start
  ) VALUES (
    auth.uid(), user_profile.organization_id, endpoint_name, 1, now()
  );
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_critical_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      jsonb_build_object('table', table_name, 'operation', operation_type, 'timestamp', now())
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potential XSS/injection characters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<[^>]*>', '', 'g'),
      '[<>''";]', '', 'g'
    ),
    '\s+', ' ', 'g'
  );
END;
$$;