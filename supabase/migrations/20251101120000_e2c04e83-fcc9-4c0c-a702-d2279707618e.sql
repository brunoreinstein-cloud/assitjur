-- ============================================================================
-- Migration: Add RLS policies for cases table
-- Date: 2025-11-01
-- Enforces deny-by-default, tenant scoping, and hierarchical access
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE IF EXISTS public.cases ENABLE ROW LEVEL SECURITY;

-- 2. Default policy - block all without explicit allow
CREATE POLICY IF NOT EXISTS "default_cases"
ON public.cases
FOR ALL
TO public
USING (false);

-- 3. Policy tenant_scope: line accessible if cases.tenant_id = jwt.tenant_id
CREATE POLICY IF NOT EXISTS tenant_scope_cases
ON public.cases
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- 4. Policy hierarchical_access via law_firm_hierarchy
CREATE POLICY IF NOT EXISTS hierarchical_access_cases
ON public.cases
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    owner_id = auth.uid() OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    owner_id = auth.uid() OR
    auth.uid() IN (
      SELECT member_id FROM law_firm_hierarchy WHERE supervisor_id = auth.uid()
    )
  )
);

-- 5. Required indexes
CREATE INDEX IF NOT EXISTS idx_cases_tenant ON public.cases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_owner ON public.cases (tenant_id, owner_id);
-- ============================================================================
