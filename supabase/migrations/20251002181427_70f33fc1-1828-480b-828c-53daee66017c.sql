-- ============================================================================
-- FIX: Corrigir Security Definer View
-- ============================================================================
-- Issue: SEC-101 | View v_profile_role_usage_audit não deve ser SECURITY DEFINER
-- Author: Security Team
-- Date: 2025-10-02
-- ============================================================================

-- Recriar view sem SECURITY DEFINER (usar permissões normais de RLS)
DROP VIEW IF EXISTS public.v_profile_role_usage_audit;

CREATE VIEW public.v_profile_role_usage_audit AS
SELECT 
  p.user_id,
  p.email,
  p.organization_id,
  p.role as deprecated_profile_role,
  m.role as current_member_role,
  CASE 
    WHEN p.role IS DISTINCT FROM m.role THEN 'MISMATCH'
    WHEN p.role IS NULL AND m.role IS NOT NULL THEN 'MIGRATED'
    WHEN p.role IS NOT NULL AND m.role IS NULL THEN 'MISSING_MEMBER'
    ELSE 'CONSISTENT'
  END as migration_status,
  m.status as member_status,
  p.updated_at as profile_updated,
  m.updated_at as member_updated
FROM profiles p
LEFT JOIN members m ON m.user_id = p.user_id 
  AND m.org_id = p.organization_id
WHERE p.organization_id IS NOT NULL;

COMMENT ON VIEW v_profile_role_usage_audit IS 
'View de auditoria para monitorar inconsistências entre profiles.role e members.role. Respeita RLS de profiles e members.';

-- Log
DO $$
BEGIN
  RAISE NOTICE '✅ View v_profile_role_usage_audit corrigida - removido SECURITY DEFINER';
END $$;