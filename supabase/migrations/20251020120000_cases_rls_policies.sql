-- ============================================================================
-- Migration: RLS policies for cases
-- Description: Enforces tenant isolation and hierarchical access on cases table
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE IF EXISTS public.cases ENABLE ROW LEVEL SECURITY;

-- Default policy: deny all access by default
CREATE POLICY IF NOT EXISTS default_cases
  ON public.cases
  FOR ALL
  TO public
  USING (false);

-- Tenant scope policy: match tenant_id to JWT claim
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

-- Hierarchical access policy: owner or supervisor's member
CREATE POLICY IF NOT EXISTS hierarchical_access_cases
  ON public.cases
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = owner_id OR
      auth.uid() IN (
        SELECT member_id
        FROM law_firm_hierarchy
        WHERE supervisor_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = owner_id OR
      auth.uid() IN (
        SELECT member_id
        FROM law_firm_hierarchy
        WHERE supervisor_id = auth.uid()
      )
    )
  );

-- Supporting index for tenant and owner lookups
CREATE INDEX IF NOT EXISTS idx_cases_tenant_owner
  ON public.cases (tenant_id, owner_id);

-- ============================================================================
