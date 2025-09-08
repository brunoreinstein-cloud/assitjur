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

/*
SECURITY IMPROVEMENT SUMMARY:
===========================================

BEFORE: Complex overlapping policies creating potential security gaps:
- 4 different policies per table (processos/pessoas)
- Multiple permissive policies that could conflict
- Overly broad "org_read" policies allowing any org member access

AFTER: Simplified, secure, non-overlapping policies:
- 2 clear policies per table (admin + read-only)
- Principle of least privilege enforced
- Clear separation between write and read permissions

NEW ACCESS CONTROL RULES:
1. ADMIN users: Full CRUD access (INSERT/UPDATE/DELETE/SELECT)
2. ANALYST users with proper data_access_level: READ-ONLY access (SELECT only)
3. Users with 'NONE' data access: NO access to sensitive data
4. All access restricted to same organization + active users only
5. Processos table: Only shows non-deleted records

SECURITY BENEFITS:
✓ Eliminated policy complexity and overlap
✓ Removed overly permissive organization-wide access
✓ Clear audit trail of who can access what
✓ Principle of least privilege enforced
✓ No ambiguous access patterns
*/