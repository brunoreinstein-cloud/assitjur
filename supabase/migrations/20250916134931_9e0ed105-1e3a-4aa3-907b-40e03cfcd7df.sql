-- CRITICAL SECURITY FIXES - Phase 1: Database-level protections
-- Fix remaining database functions without proper search_path

-- 1. Fix calculate_next_cleanup function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(last_cleanup timestamp with time zone, retention_months integer)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- 2. Strengthen financial tables with enhanced RLS policies
-- Apply strict policies to existing financial tables: cogs_monthly, opex_monthly, invoices

-- Enhanced policy for cogs_monthly
DROP POLICY IF EXISTS "Financial data super admin only" ON cogs_monthly;
DROP POLICY IF EXISTS "cogs_monthly_service_role_only" ON cogs_monthly;
CREATE POLICY "Enhanced financial data protection for cogs"
ON cogs_monthly
FOR ALL
USING (
  -- Allow service role OR super admin with full access
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Enhanced policy for opex_monthly  
DROP POLICY IF EXISTS "Opex data super admin only" ON opex_monthly;
DROP POLICY IF EXISTS "opex_monthly_service_role_only" ON opex_monthly;
CREATE POLICY "Enhanced financial data protection for opex"
ON opex_monthly
FOR ALL
USING (
  -- Allow service role OR super admin with full access
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- Enhanced policy for invoices
DROP POLICY IF EXISTS "Invoice data super admin only" ON invoices;
DROP POLICY IF EXISTS "invoices_service_role_only" ON invoices;
CREATE POLICY "Enhanced financial data protection for invoices"
ON invoices
FOR ALL
USING (
  -- Allow service role OR super admin with full access
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- 3. Enhanced audit logging function for financial data access
CREATE OR REPLACE FUNCTION public.log_financial_data_access(
  p_table_name text,
  p_action text DEFAULT 'SELECT'
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
  
  -- Log financial data access
  IF user_profile IS NOT NULL THEN
    PERFORM log_user_action(
      'FINANCIAL_DATA_ACCESS',
      p_table_name,
      NULL,
      jsonb_build_object(
        'table_accessed', p_table_name,
        'action', p_action,
        'user_role', user_profile.role,
        'data_access_level', user_profile.data_access_level,
        'org_id', user_profile.organization_id,
        'timestamp', now(),
        'security_context', 'FINANCIAL_AUDIT'
      )
    );
  END IF;
END;
$$;

-- 4. Strengthen beta_signups security with additional constraints
CREATE OR REPLACE FUNCTION public.enhanced_beta_signup_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Block obvious spam patterns
  IF NEW.email ~* '\+[0-9]+@' OR NEW.nome ~* '^(test|admin|root)' THEN
    RAISE EXCEPTION 'Invalid signup data detected';
  END IF;
  
  -- Log signup attempt for monitoring
  PERFORM log_user_action(
    'BETA_SIGNUP_ATTEMPT',
    'beta_signups',
    NEW.id,
    jsonb_build_object(
      'email_domain', split_part(NEW.email, '@', 2),
      'organization', NEW.organizacao,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Apply enhanced security trigger to beta_signups
DROP TRIGGER IF EXISTS enhanced_beta_signup_security_trigger ON beta_signups;
CREATE TRIGGER enhanced_beta_signup_security_trigger
  BEFORE INSERT ON beta_signups
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_beta_signup_security();

-- 5. Enhanced profile access logging
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Enhanced profile access logging with security context
  PERFORM log_user_action(
    'PROFILE_ACCESS_ENHANCED',
    'profiles', 
    NEW.id,
    jsonb_build_object(
      'accessed_user_id', NEW.user_id,
      'organization_id', NEW.organization_id,
      'role', NEW.role,
      'data_access_level', NEW.data_access_level,
      'security_context', 'PROFILE_AUDIT',
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$;

-- 6. Create comprehensive audit policy for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
DECLARE
  operation_type text;
  sensitive_tables text[] := ARRAY['processos', 'pessoas', 'profiles', 'organizations', 'openai_keys'];
BEGIN
  operation_type := TG_OP;
  
  -- Only audit sensitive tables
  IF TG_TABLE_NAME = ANY(sensitive_tables) THEN
    PERFORM log_user_action(
      'SENSITIVE_' || operation_type,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', operation_type,
        'timestamp', now(),
        'security_level', 'SENSITIVE_DATA_AUDIT'
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Apply comprehensive audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_sensitive_processos ON processos;
CREATE TRIGGER audit_sensitive_processos
  AFTER INSERT OR UPDATE OR DELETE ON processos
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_operations();

DROP TRIGGER IF EXISTS audit_sensitive_pessoas ON pessoas;  
CREATE TRIGGER audit_sensitive_pessoas
  AFTER INSERT OR UPDATE OR DELETE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_operations();

-- 7. Add security headers function for financial data access
CREATE OR REPLACE FUNCTION public.secure_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  );
$$;

-- Add comment for manual dashboard configuration tasks
COMMENT ON FUNCTION public.secure_financial_access() IS 'Manual Supabase Dashboard Configuration Required:
1. Auth > Settings > Password Protection: Enable leaked password protection
2. Auth > Settings > Email OTP expiry: Set to 5 minutes (currently too long)
3. Database > Settings > Infrastructure: Schedule PostgreSQL upgrade
4. Database > Extensions: Review extensions placement in public schema
These settings must be configured manually in the Supabase dashboard.';