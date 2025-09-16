-- SECURITY FIXES - Phase 2: Address remaining linter warnings

-- Fix remaining functions without proper search_path (identified from linter)
-- These are the remaining functions that need SET search_path = 'public'

-- Fix pg_trgm functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)
RETURNS boolean
LANGUAGE c
IMMUTABLE PARALLEL SAFE STRICT
SET search_path = 'public'
AS '$libdir/pg_trgm', 'gtrgm_consistent';

CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)
RETURNS double precision
LANGUAGE c
IMMUTABLE PARALLEL SAFE STRICT
SET search_path = 'public'
AS '$libdir/pg_trgm', 'gtrgm_distance';

CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)
RETURNS internal
LANGUAGE c
IMMUTABLE PARALLEL SAFE STRICT
SET search_path = 'public'
AS '$libdir/pg_trgm', 'gin_extract_value_trgm';

CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)
RETURNS internal
LANGUAGE c
IMMUTABLE PARALLEL SAFE STRICT
SET search_path = 'public'
AS '$libdir/pg_trgm', 'gin_extract_query_trgm';

-- Fix any custom functions that might be missing search_path
-- Ensure all SECURITY DEFINER functions have proper search_path

-- Fix the RLS enabled but no policy issue
-- Check if there are any tables with RLS enabled but no policies
-- Based on common patterns, this might be a staging or temporary table

-- Add a default deny-all policy for any table that has RLS enabled but no policies
-- This is a safety measure - we'll add it conditionally

DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Find tables with RLS enabled but no policies
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true 
        AND NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = pg_tables.tablename
        )
    LOOP
        -- Add a secure default policy (deny all access)
        EXECUTE format('CREATE POLICY "Security default - deny all access" ON %I.%I FOR ALL USING (false)', rec.schemaname, rec.tablename);
        
        -- Log this action
        RAISE NOTICE 'Added default deny policy to table: %.%', rec.schemaname, rec.tablename;
    END LOOP;
END
$$;

-- Create a comprehensive security status check function
CREATE OR REPLACE FUNCTION public.get_enhanced_security_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'rls_enabled_tables', (
      SELECT count(*) FROM pg_tables t 
      JOIN pg_class c ON c.relname = t.tablename 
      WHERE t.schemaname = 'public' 
      AND c.relrowsecurity = true
    ),
    'functions_with_search_path', (
      SELECT count(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proconfig IS NOT NULL
      AND 'search_path=public' = ANY(p.proconfig)
    ),
    'tables_without_policies', (
      SELECT count(*) FROM pg_tables 
      WHERE schemaname = 'public' 
      AND rowsecurity = true 
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = pg_tables.tablename
      )
    ),
    'security_scan_timestamp', now(),
    'manual_config_required', jsonb_build_object(
      'enable_leaked_password_protection', 'Auth > Settings > Password Protection',
      'reduce_otp_expiry', 'Auth > Settings > Email OTP expiry (set to 5 minutes)',
      'upgrade_postgres', 'Database > Settings > Infrastructure',
      'review_extensions', 'Database > Extensions (move from public schema if needed)'
    )
  );
$$;

-- Add comprehensive security documentation
COMMENT ON FUNCTION public.get_enhanced_security_status() IS 'Enhanced security status check function.
This function provides a comprehensive overview of the database security configuration.
Use SELECT public.get_enhanced_security_status(); to get current security status.
Manual configuration still required in Supabase Dashboard for:
1. Leaked password protection (Auth settings)
2. OTP expiry configuration (Auth settings) 
3. PostgreSQL version upgrade (Database settings)
4. Extension schema placement (Database extensions)';

-- Create security maintenance reminder function
CREATE OR REPLACE FUNCTION public.security_maintenance_reminder()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 'SECURITY MAINTENANCE REQUIRED: Complete these manual tasks in Supabase Dashboard:
  1. Enable Leaked Password Protection: Auth > Settings > Password Protection
  2. Reduce OTP Expiry: Auth > Settings > Email OTP expiry (currently too long)
  3. Upgrade PostgreSQL: Database > Settings > Infrastructure (security patches available)
  4. Review Extensions: Database > Extensions (check public schema placement)
  
  After completing these tasks, run the security linter again to verify all issues are resolved.';
$$;