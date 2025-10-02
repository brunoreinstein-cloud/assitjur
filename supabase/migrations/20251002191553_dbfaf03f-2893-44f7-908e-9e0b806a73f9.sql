-- ============================================
-- FASE 1A: Adicionar diagnóstico Super Admin
-- ============================================

CREATE OR REPLACE FUNCTION public.debug_super_admin_status()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'current_user_id', auth.uid(),
    'is_in_super_admins_table', EXISTS(
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    ),
    'is_active_super_admin', EXISTS(
      SELECT 1 FROM super_admins WHERE user_id = auth.uid() AND is_active = true
    ),
    'super_admin_record', (
      SELECT jsonb_build_object(
        'email', email,
        'is_active', is_active,
        'granted_at', granted_at
      )
      FROM super_admins 
      WHERE user_id = auth.uid()
    ),
    'is_super_admin_result', public.is_super_admin(auth.uid())
  );
$$;

-- ============================================
-- FASE 1B: Corrigir ambiguidade em get_all_orgs_summary
-- ============================================

-- Dropar função existente primeiro
DROP FUNCTION IF EXISTS public.get_all_orgs_summary();

-- Recriar com qualificadores corretos
CREATE FUNCTION public.get_all_orgs_summary()
RETURNS TABLE(
  org_id uuid,
  org_name text,
  org_code text,
  is_active boolean,
  total_members bigint,
  total_processos bigint,
  total_pessoas bigint,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é super admin
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    o.code as org_code,
    o.is_active,
    COALESCE(member_counts.total, 0) as total_members,
    COALESCE(processo_counts.total, 0) as total_processos,
    COALESCE(pessoa_counts.total, 0) as total_pessoas,
    o.created_at
  FROM organizations o
  LEFT JOIN (
    SELECT m.org_id, COUNT(*) as total
    FROM members m
    WHERE m.status = 'active'
    GROUP BY m.org_id
  ) member_counts ON member_counts.org_id = o.id
  LEFT JOIN (
    SELECT p.org_id, COUNT(*) as total
    FROM processos p
    WHERE p.deleted_at IS NULL
    GROUP BY p.org_id
  ) processo_counts ON processo_counts.org_id = o.id
  LEFT JOIN (
    SELECT ps.org_id, COUNT(*) as total
    FROM pessoas ps
    GROUP BY ps.org_id
  ) pessoa_counts ON pessoa_counts.org_id = o.id
  ORDER BY o.created_at DESC;
END;
$$;