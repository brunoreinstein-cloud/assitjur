-- Fix function search path security warnings
-- Update functions to have immutable search_path

-- Fix log_user_action function
CREATE OR REPLACE FUNCTION public.log_user_action(action_type text, resource_type text DEFAULT NULL::text, resource_id uuid DEFAULT NULL::uuid, metadata jsonb DEFAULT '{}'::jsonb)
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

-- Fix check_rate_limit function  
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

-- Fix sanitize_input function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;