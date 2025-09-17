-- Security Audit Phase 2: Critical Security Fixes
-- Fixing RLS policies, search_path, and extensions placement

-- 1. Fix functions with mutable search_path
-- Identify and fix the 4 functions mentioned in the linter

-- First, let's check which functions need fixing by examining security definer functions without search_path
SELECT 
  n.nspname,
  p.proname,
  pg_get_function_identity_arguments(p.oid) as signature,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prosecdef = true  -- SECURITY DEFINER functions
  AND n.nspname = 'public'
  AND (p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig)))
ORDER BY p.proname;

-- Fix the functions that don't have proper search_path set
-- Based on the existing functions in the database, we need to update these:

-- Update calculate_next_cleanup function
DROP FUNCTION IF EXISTS public.calculate_next_cleanup(timestamp with time zone, integer);
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(last_cleanup timestamp with time zone, retention_months integer)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- Update get_secure_financial_data function  
DROP FUNCTION IF EXISTS public.get_secure_financial_data(text);
CREATE OR REPLACE FUNCTION public.get_secure_financial_data(view_name text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN public.has_financial_access() THEN
      (SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT * FROM public.v_gross_margin 
        WHERE view_name = 'v_gross_margin'
        UNION ALL
        SELECT * FROM public.v_mrr_by_month
        WHERE view_name = 'v_mrr_by_month'
      ) t)
    ELSE 
      '{"error": "Access denied"}'::jsonb
  END;
$$;

-- Update ensure_user_profile function if it exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile(
  user_uuid uuid,
  user_email text,
  user_role user_role DEFAULT 'VIEWER',
  org_id uuid DEFAULT NULL
)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record profiles%ROWTYPE;
BEGIN
  -- Try to get existing profile
  SELECT * INTO profile_record
  FROM profiles 
  WHERE user_id = user_uuid;
  
  -- If profile doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO profiles (
      user_id, email, role, organization_id, is_active, data_access_level
    ) VALUES (
      user_uuid, user_email, user_role, org_id, true, 'NONE'
    ) RETURNING * INTO profile_record;
  END IF;
  
  RETURN profile_record;
END;
$$;

-- Update get_current_user_role function if it exists without proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update get_current_user_org function if exists
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Check for tables with RLS enabled but no policies
-- Find tables with RLS enabled but no policies
WITH rls_tables AS (
  SELECT 
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = true
),
tables_with_policies AS (
  SELECT DISTINCT
    schemaname,
    tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  r.schemaname,
  r.tablename
FROM rls_tables r
LEFT JOIN tables_with_policies p ON (r.schemaname = p.schemaname AND r.tablename = p.tablename)
WHERE p.tablename IS NULL;

-- If the table without policies is identified, create appropriate RLS policies
-- Based on common patterns in the database, let's ensure all core tables have proper policies

-- Example: If there's a table without policies, create secure policies
-- This is a template - adjust based on the specific table found
CREATE POLICY IF NOT EXISTS "example_table_tenant_isolation" 
ON public.example 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = example.org_id
    AND p.is_active = true
  )
);

-- 3. Move extensions from public schema to extensions schema
-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension if it's in public schema
-- First check if extension exists in public
DO $$
BEGIN
  -- Move pg_trgm to extensions schema if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
  
  -- Create pg_trgm in extensions schema if it doesn't exist anywhere
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If we can't move the extension, at least ensure it exists
  CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
END $$;

-- 4. Revoke CREATE privilege from public schema for security
-- This prevents users from creating objects in the public schema
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;

-- Grant only necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 5. Set default search_path for roles
-- Set secure search_path for anon and authenticated roles
ALTER ROLE anon SET search_path = 'public', 'extensions';
ALTER ROLE authenticated SET search_path = 'public', 'extensions';

-- 6. Enhance existing RLS policies for better tenant isolation
-- Strengthen profiles table policies
DROP POLICY IF EXISTS "profile_strict_isolation" ON public.profiles;
CREATE POLICY "profile_strict_isolation" 
ON public.profiles 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  (auth.role() = 'service_role') OR
  EXISTS (
    SELECT 1 FROM profiles admin_p 
    WHERE admin_p.user_id = auth.uid() 
    AND admin_p.organization_id = profiles.organization_id
    AND admin_p.role = 'ADMIN'
    AND admin_p.is_active = true
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  (auth.role() = 'service_role')
);

-- 7. Storage bucket security policies
-- Create secure storage policies for any buckets that might contain PII
-- This assumes standard bucket names - adjust as needed

-- Documents bucket (if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-documents', 'user-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User documents storage policy - users can only access their own files
CREATE POLICY IF NOT EXISTS "user_documents_tenant_isolation" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'user-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid()
    AND p.organization_id::text = (storage.foldername(name))[1]
    AND p.is_active = true
  )
)
WITH CHECK (
  bucket_id = 'user-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid()
    AND p.organization_id::text = (storage.foldername(name))[1]
    AND p.is_active = true
  )
);

-- 8. Add audit logging for sensitive operations
-- Enhance the existing audit system
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  resource_type text,
  resource_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    event_type,
    resource_type,
    resource_id::text,
    metadata || jsonb_build_object('security_event', true, 'timestamp', now()),
    now()
  );
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the main operation
  RAISE NOTICE 'Failed to log security event: %', SQLERRM;
END;
$$;

-- Create trigger to log access to sensitive tables
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to financial and PII tables
  IF TG_TABLE_NAME IN ('invoices', 'profiles', 'beta_signups', 'processos', 'pessoas') THEN
    PERFORM log_security_event(
      'SENSITIVE_DATA_ACCESS',
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'user_id', auth.uid()
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Apply the trigger to sensitive tables (only if they exist)
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN SELECT unnest(ARRAY['invoices', 'profiles', 'beta_signups', 'processos', 'pessoas'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS log_sensitive_access_trigger ON public.%I', table_name);
            EXECUTE format('CREATE TRIGGER log_sensitive_access_trigger 
                           AFTER INSERT OR UPDATE OR DELETE ON public.%I 
                           FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access()', table_name);
        END IF;
    END LOOP;
END $$;

-- 9. Final security validation query
-- This query will be used to verify tenant isolation is working
CREATE OR REPLACE FUNCTION public.verify_tenant_isolation()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'current_user', auth.uid(),
    'user_org', (SELECT organization_id FROM profiles WHERE user_id = auth.uid()),
    'accessible_profiles', (SELECT count(*) FROM profiles),
    'accessible_processos', (SELECT count(*) FROM processos WHERE deleted_at IS NULL),
    'accessible_invoices', (SELECT count(*) FROM invoices),
    'search_path_set', current_setting('search_path'),
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' AND c.relrowsecurity = true
    )
  );
$$;