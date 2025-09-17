-- Security Audit Phase 2: Critical Security Fixes (Corrected)
-- Fixing RLS policies, search_path, and extensions placement

-- 1. Fix functions with mutable search_path
-- Update calculate_next_cleanup function
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

-- Update ensure_user_profile function
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

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role::text FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Update get_current_user_org function
CREATE OR REPLACE FUNCTION public.get_current_user_org()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 2. Create extensions schema and move extensions
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension if it's in public schema
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
EXCEPTION WHEN OTHERS THEN
  -- Extension might not exist or might be system-managed
  RAISE NOTICE 'Could not move pg_trgm extension: %', SQLERRM;
END $$;

-- 3. Revoke CREATE privilege from public schema for security
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 4. Set default search_path for roles
ALTER ROLE anon SET search_path = 'public', 'extensions';
ALTER ROLE authenticated SET search_path = 'public', 'extensions';

-- 5. Check for table without RLS policies and fix
-- Find the table with RLS enabled but no policies
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
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
        WHERE p.tablename IS NULL
    LOOP
        -- Create appropriate RLS policy for the table without policies
        IF table_record.tablename = 'example' THEN
            EXECUTE format('
                DROP POLICY IF EXISTS "example_table_tenant_isolation" ON public.%I;
                CREATE POLICY "example_table_tenant_isolation" 
                ON public.%I 
                FOR ALL 
                USING (
                  EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE p.user_id = auth.uid() 
                    AND p.organization_id = %I.org_id
                    AND p.is_active = true
                  )
                )', table_record.tablename, table_record.tablename, table_record.tablename);
        END IF;
        
        RAISE NOTICE 'Found table without RLS policies: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END $$;

-- 6. Strengthen existing RLS policies for better tenant isolation
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

-- 7. Create secure storage bucket for user documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-documents', 'user-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User documents storage policy - users can only access their own organization files
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

-- 8. Enhanced audit logging for sensitive operations
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

-- Create trigger function for sensitive data access logging
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

-- Apply the trigger to sensitive tables
DO $$
DECLARE
    sensitive_table text;
BEGIN
    FOR sensitive_table IN SELECT unnest(ARRAY['invoices', 'profiles', 'beta_signups', 'processos', 'pessoas'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = sensitive_table) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS log_sensitive_access_trigger ON public.%I', sensitive_table);
            EXECUTE format('CREATE TRIGGER log_sensitive_access_trigger 
                           AFTER INSERT OR UPDATE OR DELETE ON public.%I 
                           FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access()', sensitive_table);
        END IF;
    END LOOP;
END $$;

-- 9. Security validation function
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
    )
  );
$$;