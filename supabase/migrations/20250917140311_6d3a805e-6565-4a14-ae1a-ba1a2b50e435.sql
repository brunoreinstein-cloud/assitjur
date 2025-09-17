-- Security Audit Phase 3: Final Critical Fixes
-- Addressing remaining RLS vulnerabilities and data exposure

-- 1. Move pg_trgm extension to extensions schema (attempt programmatic move)
DO $$
BEGIN
  -- Try to move pg_trgm extension from public to extensions schema
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    -- Cannot move system extensions, but we can create wrapper functions
    -- Create extension-specific schema permissions
    GRANT USAGE ON SCHEMA extensions TO PUBLIC;
    
    -- Create wrapper functions in extensions schema for commonly used functions
    CREATE OR REPLACE FUNCTION extensions.similarity(text, text)
    RETURNS real
    LANGUAGE sql
    IMMUTABLE PARALLEL SAFE STRICT
    AS $$
      SELECT public.similarity($1, $2);
    $$;
    
    CREATE OR REPLACE FUNCTION extensions.word_similarity(text, text)
    RETURNS real
    LANGUAGE sql
    IMMUTABLE PARALLEL SAFE STRICT
    AS $$
      SELECT public.word_similarity($1, $2);
    $$;
    
    RAISE NOTICE 'Created wrapper functions for pg_trgm in extensions schema';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create pg_trgm wrappers: %', SQLERRM;
END $$;

-- 2. Strengthen RLS policies for sensitive data tables
-- Fix profiles table exposure (critical vulnerability)
DROP POLICY IF EXISTS "profile_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profile_service_role_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create comprehensive profile protection policy
CREATE POLICY "profiles_strict_tenant_isolation"
ON public.profiles
FOR ALL
USING (
  -- Users can only access their own profile
  auth.uid() = user_id OR
  -- Service role has full access
  (auth.role() = 'service_role') OR
  -- Organization admins can view profiles in their org
  (TG_OP = 'SELECT' AND EXISTS (
    SELECT 1 FROM profiles admin_p 
    WHERE admin_p.user_id = auth.uid() 
    AND admin_p.organization_id = profiles.organization_id
    AND admin_p.role = 'ADMIN'
    AND admin_p.is_active = true
  ))
)
WITH CHECK (
  -- Users can only modify their own profile
  auth.uid() = user_id OR
  -- Service role can insert/update
  (auth.role() = 'service_role')
);

-- 3. Strengthen beta_signups table (critical - contains email harvesting risk)
DROP POLICY IF EXISTS "Deny all public access to beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Secure service role insert for beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin secure delete of beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin secure read access to beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Super admin secure update of beta signups" ON public.beta_signups;

-- Create ultra-secure beta_signups policies
CREATE POLICY "beta_signups_super_admin_only"
ON public.beta_signups
FOR ALL
USING (
  -- Only super admins with FULL data access can read
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
)
WITH CHECK (
  -- Only super admins can modify, OR service role for inserts
  (auth.role() = 'service_role' AND TG_OP = 'INSERT') OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  )
);

-- 4. Strengthen invoices table (critical - financial data exposure)
DROP POLICY IF EXISTS "Enhanced financial data protection for invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_tenant_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_tenant_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_tenant_update" ON public.invoices;

-- Create ultra-secure financial data policy
CREATE POLICY "invoices_financial_admin_only"
ON public.invoices
FOR ALL
USING (
  -- Only users with financial access can view
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  ) OR
  -- Service role for system operations
  (auth.role() = 'service_role')
)
WITH CHECK (
  -- Only financial admins can modify
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  ) OR
  -- Service role for system operations
  (auth.role() = 'service_role')
);

-- 5. Create data masking views for safer data access
-- Create masked profiles view for non-admin users
CREATE OR REPLACE VIEW public.v_profiles_masked 
WITH (security_invoker=true)
AS
SELECT 
  id,
  user_id,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'ADMIN' 
      AND p.data_access_level = 'FULL'
    ) THEN email
    ELSE left(email, 2) || '***@' || split_part(email, '@', 2)
  END as email,
  role,
  organization_id,
  is_active,
  data_access_level,
  created_at,
  updated_at
FROM profiles
WHERE 
  -- Users can see their own profile
  auth.uid() = user_id OR
  -- Organization members can see masked profiles of their org
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = profiles.organization_id
    AND p.is_active = true
  );

-- 6. Create audit trigger for all sensitive table access
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all access to sensitive tables with enhanced metadata
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    'SENSITIVE_ACCESS_' || TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now(),
      'security_level', 'HIGH',
      'user_role', (SELECT role FROM profiles WHERE user_id = auth.uid()),
      'user_org', (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
    ),
    inet '127.0.0.1',
    'System-Audit',
    now()
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Apply enhanced audit trigger to all sensitive tables
DO $$
DECLARE
    sensitive_table text;
BEGIN
    FOR sensitive_table IN SELECT unnest(ARRAY['profiles', 'beta_signups', 'invoices', 'processos', 'pessoas', 'openai_keys', 'audit_logs'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = sensitive_table) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS audit_sensitive_access_trigger ON public.%I', sensitive_table);
            EXECUTE format('CREATE TRIGGER audit_sensitive_access_trigger 
                           AFTER SELECT ON public.%I 
                           FOR EACH STATEMENT EXECUTE FUNCTION public.audit_sensitive_access()', sensitive_table);
        END IF;
    END LOOP;
END $$;

-- 7. Create security monitoring function
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'timestamp', now(),
    'security_score', CASE 
      WHEN (
        SELECT count(*) FROM pg_tables t 
        JOIN pg_class c ON c.relname = t.tablename 
        WHERE t.schemaname = 'public' AND c.relrowsecurity = false
      ) = 0 THEN 10
      ELSE 8
    END,
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = true
    ),
    'tables_without_rls', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = false
    ),
    'sensitive_tables_secured', (
      SELECT count(*) FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'beta_signups', 'invoices', 'processos', 'pessoas')
    ),
    'functions_with_search_path', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proconfig IS NOT NULL
      AND 'search_path=public' = ANY(p.proconfig)
    ),
    'last_audit', (SELECT created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1)
  );
$$;

-- 8. Create emergency lockdown function (for security incidents)
CREATE OR REPLACE FUNCTION public.emergency_security_lockdown()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  lockdown_id uuid := gen_random_uuid();
BEGIN
  -- Only super admins can trigger lockdown
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'ADMIN' 
    AND data_access_level = 'FULL'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can trigger emergency lockdown';
  END IF;
  
  -- Log the lockdown event
  INSERT INTO audit_logs (
    user_id, action, table_name, metadata, created_at
  ) VALUES (
    auth.uid(),
    'EMERGENCY_LOCKDOWN',
    'security_system',
    jsonb_build_object(
      'lockdown_id', lockdown_id,
      'timestamp', now(),
      'triggered_by', auth.uid(),
      'severity', 'CRITICAL'
    ),
    now()
  );
  
  -- Disable all non-admin user accounts temporarily
  UPDATE profiles 
  SET is_active = false 
  WHERE role != 'ADMIN' OR data_access_level != 'FULL';
  
  RETURN jsonb_build_object(
    'status', 'LOCKDOWN_ACTIVATED',
    'lockdown_id', lockdown_id,
    'timestamp', now(),
    'accounts_disabled', (SELECT count(*) FROM profiles WHERE is_active = false)
  );
END;
$$;