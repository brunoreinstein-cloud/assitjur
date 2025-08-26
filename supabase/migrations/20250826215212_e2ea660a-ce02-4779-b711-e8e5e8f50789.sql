-- Fix remaining critical security issues

-- Enable RLS on new tables created in the previous migration
ALTER TABLE public.rate_limits_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- Create additional RLS policies for validation_rules
CREATE POLICY "Only admins can manage validation rules" 
ON public.validation_rules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADMIN'
  )
);

-- Create policies for user_sessions
CREATE POLICY "System can insert user sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can delete expired sessions" 
ON public.user_sessions 
FOR DELETE 
USING (expires_at < now() OR NOT is_active);

-- Create policies for rate_limits_enhanced  
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits_enhanced 
FOR ALL 
USING (true);

-- Fix any remaining functions without proper search_path
CREATE OR REPLACE FUNCTION public.can_access_sensitive_data(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = user_uuid 
    AND (role = 'ADMIN' OR data_access_level IN ('FULL', 'MASKED'))
  );
$function$;

-- Create secure function to get user role (avoiding infinite recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $function$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$function$;

-- Create secure function to get user organization
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = 'public'
AS $function$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid();
$function$;

-- Update any policies that might be causing infinite recursion
-- Drop and recreate profiles policies to avoid issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Service can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Create secure logging trigger for critical operations
CREATE OR REPLACE FUNCTION public.audit_critical_operations()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
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

-- Create triggers for audit logging on critical tables
DROP TRIGGER IF EXISTS audit_profiles_operations ON public.profiles;
CREATE TRIGGER audit_profiles_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_critical_operations();

DROP TRIGGER IF EXISTS audit_processos_operations ON public.processos;
CREATE TRIGGER audit_processos_operations  
  AFTER INSERT OR UPDATE OR DELETE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION audit_critical_operations();

DROP TRIGGER IF EXISTS audit_pessoas_operations ON public.pessoas;
CREATE TRIGGER audit_pessoas_operations
  AFTER INSERT OR UPDATE OR DELETE ON public.pessoas
  FOR EACH ROW EXECUTE FUNCTION audit_critical_operations();

-- Create data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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