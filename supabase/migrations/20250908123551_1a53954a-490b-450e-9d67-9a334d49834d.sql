-- CRITICAL SECURITY FIX: Simplify and secure RLS policies for sensitive legal data
-- Remove complex overlapping policies that could allow unauthorized access

-- === PROCESSOS TABLE SECURITY ===
-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Only admins can manage processos data" ON public.processos;
DROP POLICY IF EXISTS "Restricted access to processos data" ON public.processos;
DROP POLICY IF EXISTS "org_read_processos" ON public.processos;
DROP POLICY IF EXISTS "processos_select_policy" ON public.processos;

-- Create simplified, secure policies
-- 1. Admin users can do everything (INSERT/UPDATE/DELETE/SELECT)
CREATE POLICY "processos_admin_full_access" 
ON public.processos 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  )
);

-- 2. Users with proper data access can SELECT only (no write operations)
CREATE POLICY "processos_authorized_read_only" 
ON public.processos 
FOR SELECT 
TO authenticated
USING (
  -- Must be in same organization
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos.org_id 
    AND p.is_active = true
    -- Must have appropriate data access level
    AND (p.data_access_level IN ('FULL', 'MASKED') OR p.role IN ('ADMIN', 'ANALYST'))
  )
  -- Additional security: only show non-deleted records
  AND processos.deleted_at IS NULL
);

-- === PESSOAS TABLE SECURITY ===
-- Drop all existing policies to start clean  
DROP POLICY IF EXISTS "Only admins can manage pessoas data" ON public.pessoas;
DROP POLICY IF EXISTS "Restricted access to pessoas data" ON public.pessoas;
DROP POLICY IF EXISTS "org_read_pessoas" ON public.pessoas;

-- Create simplified, secure policies
-- 1. Admin users can do everything (INSERT/UPDATE/DELETE/SELECT)
CREATE POLICY "pessoas_admin_full_access" 
ON public.pessoas 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  )
);

-- 2. Users with proper data access can SELECT only (no write operations)
CREATE POLICY "pessoas_authorized_read_only" 
ON public.pessoas 
FOR SELECT 
TO authenticated
USING (
  -- Must be in same organization
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = pessoas.org_id 
    AND p.is_active = true
    -- Must have appropriate data access level
    AND (p.data_access_level IN ('FULL', 'MASKED') OR p.role IN ('ADMIN', 'ANALYST'))
  )
);

-- === AUDIT LOG FOR SECURITY CHANGES ===
-- Log this critical security update (using valid ADMIN role)
INSERT INTO audit_logs (
  user_id, email, role, organization_id, action, resource, result, metadata, ip_address, user_agent
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'system@assistjur.ia', 
  'ADMIN', 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'SECURITY_POLICY_SIMPLIFICATION',
  'processos,pessoas',
  'SUCCESS',
  jsonb_build_object(
    'description', 'Simplified RLS policies to remove security complexity',
    'tables_affected', ARRAY['processos', 'pessoas'],
    'policy_changes', 'Removed overlapping permissive policies, implemented clear access control',
    'security_improvement', 'Eliminated potential data exposure from complex policy overlap'
  ),
  inet '127.0.0.1',
  'Supabase-Security-Migration'
);

/*
SECURITY IMPROVEMENT SUMMARY:
===========================================
BEFORE: 4 overlapping policies per table creating potential security gaps
AFTER: 2 clear, non-overlapping policies per table

NEW ACCESS CONTROL RULES:
1. Only ADMIN users can INSERT/UPDATE/DELETE sensitive data
2. Only users with data_access_level 'FULL'/'MASKED' or role 'ADMIN'/'ANALYST' can SELECT
3. Users with 'NONE' data access cannot access sensitive data
4. All access restricted to same organization + active users only
5. Processos table only shows non-deleted records

SECURITY BENEFITS:
- Eliminated policy complexity and overlap
- Clear audit trail of who can access what
- Principle of least privilege enforced
- No more ambiguous access patterns
*/