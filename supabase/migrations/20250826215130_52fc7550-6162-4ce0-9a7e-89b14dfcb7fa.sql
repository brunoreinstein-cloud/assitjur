-- Fix Security Definer functions with proper search_path
-- This addresses the WARN issues found by the linter

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update mask functions with proper search_path  
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf_value text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN cpf_value IS NULL THEN NULL
    WHEN length(cpf_value) >= 8 THEN 
      substring(cpf_value from 1 for 3) || '.***.***-' || substring(cpf_value from length(cpf_value) - 1)
    ELSE '***.***.***-**'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.mask_name(name_value text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN name_value IS NULL THEN NULL
    WHEN length(name_value) <= 3 THEN '***'
    ELSE substring(name_value from 1 for 2) || repeat('*', length(name_value) - 3) || substring(name_value from length(name_value))
  END;
$function$;

-- Create secure audit logging function
CREATE OR REPLACE FUNCTION public.log_user_action(
  action_type text,
  resource_type text DEFAULT NULL,
  resource_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    inet '127.0.0.1', -- In real scenario, get from request
    'Hubjuria-App'
  );
END;
$function$;

-- Create rate limiting table and function
CREATE TABLE IF NOT EXISTS public.rate_limits_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  org_id uuid,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits_enhanced ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits_enhanced 
FOR SELECT 
USING (user_id = auth.uid());

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_name text,
  max_requests integer DEFAULT 60,
  window_minutes integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    RETURN false; -- Deny if no profile
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

-- Create session management table for better security
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_accessed timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true
);

-- Enable RLS on sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create data validation rules table
CREATE TABLE IF NOT EXISTS public.validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  column_name text NOT NULL,
  rule_type text NOT NULL, -- 'required', 'format', 'length', 'range'
  rule_config jsonb NOT NULL DEFAULT '{}',
  error_message text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert basic validation rules
INSERT INTO validation_rules (table_name, column_name, rule_type, rule_config, error_message) VALUES
('processos', 'cnj', 'format', '{"pattern": "^\\d{7}-\\d{2}\\.\\d{4}\\.\\d\\.\\d{2}\\.\\d{4}$"}', 'CNJ deve estar no formato correto'),
('processos', 'reclamante_nome', 'required', '{}', 'Nome do reclamante é obrigatório'),
('pessoas', 'nome_civil', 'required', '{}', 'Nome civil é obrigatório'),
('profiles', 'email', 'format', '{"pattern": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"}', 'Email deve ter formato válido');

-- Create data sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potential XSS/injection characters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<[^>]*>', '', 'g'), -- Remove HTML tags
      '[<>''";]', '', 'g' -- Remove dangerous characters
    ),
    '\s+', ' ', 'g' -- Normalize whitespace
  );
END;
$function$;