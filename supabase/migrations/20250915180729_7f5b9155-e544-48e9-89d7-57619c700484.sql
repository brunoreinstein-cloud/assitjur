-- Phase 1: Critical Security Fixes

-- 1. Fix Financial Data Exposure - Add proper RLS policies for financial tables
CREATE POLICY "Financial data super admin only" 
ON cogs_monthly FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
));

CREATE POLICY "Invoice data super admin only" 
ON invoices FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
));

CREATE POLICY "Opex data super admin only" 
ON opex_monthly FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
));

-- 2. Add missing RLS policies for staging tables
CREATE POLICY "Staging processos org access" 
ON assistjur.por_processo_staging FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_processo_staging.org_id 
    AND p.is_active = true
));

CREATE POLICY "Staging testemunhas org access" 
ON assistjur.por_testemunha_staging FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = por_testemunha_staging.org_id 
    AND p.is_active = true
));

-- 3. Clean up overlapping RLS policies on processos table
-- Drop redundant policies that create conflicts
DROP POLICY IF EXISTS "Processos DELETE tenant user" ON processos;
DROP POLICY IF EXISTS "Processos INSERT tenant user" ON processos;
DROP POLICY IF EXISTS "Processos SELECT tenant user" ON processos;
DROP POLICY IF EXISTS "Processos UPDATE tenant user" ON processos;
DROP POLICY IF EXISTS "processos_delete_authenticated" ON processos;
DROP POLICY IF EXISTS "processos_delete_tenant_user" ON processos;
DROP POLICY IF EXISTS "processos_insert_authenticated" ON processos;
DROP POLICY IF EXISTS "processos_insert_tenant_user" ON processos;
DROP POLICY IF EXISTS "processos_org_delete" ON processos;
DROP POLICY IF EXISTS "processos_org_insert" ON processos;
DROP POLICY IF EXISTS "processos_org_select" ON processos;
DROP POLICY IF EXISTS "processos_org_update" ON processos;
DROP POLICY IF EXISTS "processos_owner_only_delete" ON processos;
DROP POLICY IF EXISTS "processos_owner_only_insert" ON processos;
DROP POLICY IF EXISTS "processos_owner_only_select" ON processos;
DROP POLICY IF EXISTS "processos_owner_only_update" ON processos;
DROP POLICY IF EXISTS "processos_select_authenticated" ON processos;
DROP POLICY IF EXISTS "processos_select_tenant_user" ON processos;
DROP POLICY IF EXISTS "processos_update_authenticated" ON processos;
DROP POLICY IF EXISTS "processos_update_tenant_user" ON processos;
DROP POLICY IF EXISTS "delete own org processos" ON processos;
DROP POLICY IF EXISTS "insert own org processos" ON processos;
DROP POLICY IF EXISTS "read own org processos" ON processos;
DROP POLICY IF EXISTS "update own org processos" ON processos;
DROP POLICY IF EXISTS "modify own org processos delete" ON processos;
DROP POLICY IF EXISTS "modify own org processos insert" ON processos;
DROP POLICY IF EXISTS "modify own org processos update" ON processos;
DROP POLICY IF EXISTS "proc_delete_org_members" ON processos;
DROP POLICY IF EXISTS "proc_insert_org_members" ON processos;
DROP POLICY IF EXISTS "proc_select_org_members" ON processos;
DROP POLICY IF EXISTS "proc_update_org_members" ON processos;

-- Keep only the essential policies for processos
-- processos_admin_full_access and processos_authorized_read_only are sufficient

-- 4. Secure database functions by adding proper search_path
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
      regexp_replace(input_text, '<[^>]*>', '', 'g'),
      '[<>''";]', '', 'g'
    ),
    '\s+', ' ', 'g'
  );
END;
$function$;

-- 5. Restrict audit log access to super admins only
DROP POLICY IF EXISTS "user_read_own" ON audit_logs;

CREATE POLICY "Super admin audit access only" 
ON audit_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN' 
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
));

-- 6. Add security to session and sensitive tables
CREATE POLICY "User sessions own access only" 
ON user_sessions FOR ALL 
USING (user_id = auth.uid());

-- 7. Ensure proper org isolation for all sensitive tables
CREATE POLICY "Cleanup logs admin access" 
ON cleanup_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = cleanup_logs.org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
));

CREATE POLICY "Data access logs admin only" 
ON data_access_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = data_access_logs.org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
));

-- 8. Create helper function for current user org access (prevents recursive policies)
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT ARRAY(
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
      AND is_active = true
  );
$function$;