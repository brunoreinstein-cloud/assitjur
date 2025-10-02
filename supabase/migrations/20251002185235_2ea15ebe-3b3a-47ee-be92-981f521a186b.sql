-- =====================================================
-- FASE 1: Super Admin - Critical Functionalities
-- =====================================================

-- 1. Drop ALL existing versions of log_super_admin_action
DROP FUNCTION IF EXISTS public.log_super_admin_action(TEXT, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_super_admin_action(TEXT, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_super_admin_action CASCADE;

-- 2. Create new unified version
CREATE FUNCTION public.log_super_admin_action(
  p_action TEXT,
  p_target_user_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    resource,
    metadata,
    result,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    'super_admin_actions',
    'user:' || p_target_user_id::text,
    jsonb_build_object(
      'reason', p_reason,
      'super_admin_id', auth.uid(),
      'target_user_id', p_target_user_id,
      'timestamp', now()
    ) || p_metadata,
    'SUCCESS',
    now()
  );
END;
$$;

-- 3. RPC para listar TODOS os usuários (cross-org)
CREATE OR REPLACE FUNCTION public.get_all_users_summary()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  organization_id UUID,
  organization_name TEXT,
  role user_role,
  data_access_level data_access_level,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  member_status TEXT
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.organization_id,
    o.name as organization_name,
    p.role,
    p.data_access_level,
    p.is_active,
    p.last_login_at,
    p.created_at,
    m.status as member_status
  FROM profiles p
  LEFT JOIN organizations o ON o.id = p.organization_id
  LEFT JOIN members m ON m.user_id = p.user_id AND m.org_id = p.organization_id
  WHERE is_super_admin(auth.uid())
  ORDER BY p.created_at DESC;
$$;

-- 4. Adicionar colunas para tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_reset_by UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ;

-- 5. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_members_org_user ON members(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_super_admin ON audit_logs(user_id, action) WHERE table_name = 'super_admin_actions';