-- ============================================
-- FASE 2B: Correção de Segurança - Audit Log Immutable
-- ============================================

-- Fix RLS policies for audit_log_immutable table
-- Add policy for service role to manage audit logs
CREATE POLICY "service_role_full_access_immutable_audit"
ON public.audit_log_immutable
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add policy for admins to view their org audit logs
CREATE POLICY "org_admin_view_immutable_audit"
ON public.audit_log_immutable
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = audit_log_immutable.org_id
      AND p.role = 'ADMIN'::user_role
      AND p.is_active = true
  )
);

-- Create index for performance on immutable audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_immutable_org_created 
ON public.audit_log_immutable(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_immutable_user 
ON public.audit_log_immutable(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_immutable_resource 
ON public.audit_log_immutable(resource, resource_id);

-- Add comment explaining the purpose
COMMENT ON TABLE public.audit_log_immutable IS 
'Immutable audit trail for sensitive data changes. Records cannot be modified or deleted, only inserted. Provides cryptographic hashing of before/after states for compliance.';

-- Create function to query audit trail safely
CREATE OR REPLACE FUNCTION public.get_audit_trail(
  p_resource text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  action text,
  resource text,
  resource_id uuid,
  change_summary jsonb,
  created_at timestamptz,
  user_email text,
  legal_basis text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_org_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get user org and check if admin
  SELECT p.organization_id, (p.role = 'ADMIN'::user_role)
  INTO v_user_org_id, v_is_admin
  FROM profiles p
  WHERE p.user_id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied - admin only';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.action,
    a.resource,
    a.resource_id,
    a.change_summary,
    a.created_at,
    p.email as user_email,
    a.legal_basis
  FROM audit_log_immutable a
  JOIN profiles p ON p.user_id = a.user_id
  WHERE a.org_id = v_user_org_id
    AND (p_resource IS NULL OR a.resource = p_resource)
    AND (p_resource_id IS NULL OR a.resource_id = p_resource_id)
    AND (p_start_date IS NULL OR a.created_at >= p_start_date)
    AND (p_end_date IS NULL OR a.created_at <= p_end_date)
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_audit_trail(text, uuid, timestamptz, timestamptz, integer) TO authenticated;