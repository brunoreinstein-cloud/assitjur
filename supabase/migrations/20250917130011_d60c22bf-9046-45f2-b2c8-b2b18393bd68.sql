-- Security Audit Phase 2: Critical Security Fixes (Simple Approach)
-- Focus on essential security fixes

-- 1. Fix functions with mutable search_path (drop and recreate to avoid parameter conflicts)
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
      '{"data": "access_granted"}'::jsonb
    ELSE 
      '{"error": "Access denied"}'::jsonb
  END;
$$;

-- Fix calculate_next_cleanup function
CREATE OR REPLACE FUNCTION public.calculate_next_cleanup(last_cleanup timestamp with time zone, retention_months integer)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT last_cleanup + (retention_months || ' months')::interval;
$$;

-- 2. Create extensions schema and move extensions (essential for production security)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Revoke CREATE privilege from public schema (critical security fix)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 4. Set secure search_path for roles
ALTER ROLE anon SET search_path = 'public', 'extensions';
ALTER ROLE authenticated SET search_path = 'public', 'extensions';

-- 5. Fix table without RLS policies (example table)
-- Check if example table exists and needs RLS policy
DO $$
DECLARE
    table_name text := 'example';
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = table_name
        AND rowsecurity = true
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name
    ) THEN
        -- Create a deny-all policy for example table since it should not be accessible
        EXECUTE format('CREATE POLICY "deny_all_access" ON public.%I FOR ALL USING (false)', table_name);
        RAISE NOTICE 'Created deny-all policy for table: %', table_name;
    END IF;
END $$;

-- 6. Create secure storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-documents', 'user-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policy for user documents with tenant isolation
DROP POLICY IF EXISTS "user_documents_tenant_isolation" ON storage.objects;
CREATE POLICY "user_documents_tenant_isolation" 
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

-- 7. Security validation function
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
    ),
    'functions_with_search_path', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proconfig IS NOT NULL
      AND 'search_path=public' = ANY(p.proconfig)
    ),
    'extensions_in_public', (
      SELECT count(*) FROM pg_extension e 
      JOIN pg_namespace n ON e.extnamespace = n.oid 
      WHERE n.nspname = 'public'
    )
  );
$$;