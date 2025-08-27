-- Fix remaining function security warnings and auth settings

-- Fix remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER 
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
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