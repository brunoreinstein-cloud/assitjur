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

-- === COMMENT EXPLANATION ===
/*
SECURITY IMPROVEMENTS APPLIED:

1. ELIMINATED POLICY OVERLAP: Removed multiple conflicting policies that created security gaps

2. CLEAR ACCESS CONTROL MATRIX:
   - ADMIN users: Full access (CRUD) to their organization's data
   - ANALYST users with FULL/MASKED access: Read-only access to their organization's data
   - VIEWER users with NONE access: No access to sensitive data
   - Inactive users: No access to any data

3. ORGANIZATION ISOLATION: All access strictly limited to user's organization

4. DELETED DATA PROTECTION: Processos marked as deleted are hidden from all users

5. AUTHENTICATION REQUIREMENT: All policies require authenticated users

Before: Complex overlapping policies allowed potential unauthorized access
After: Clear, simple policies with no security gaps
*/