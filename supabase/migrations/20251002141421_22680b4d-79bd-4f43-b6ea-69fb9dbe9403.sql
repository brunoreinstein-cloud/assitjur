-- Super Admin Dashboard - Fase 1: RPCs agregadas

-- RPC para obter resumo de todas as organizações (super admin only)
CREATE OR REPLACE FUNCTION public.get_all_orgs_summary()
RETURNS TABLE(
  org_id uuid,
  org_name text,
  org_code text,
  is_active boolean,
  total_members bigint,
  total_processos bigint,
  total_pessoas bigint,
  created_at timestamp with time zone,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se usuário é super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  RETURN QUERY
  SELECT 
    o.id as org_id,
    o.name as org_name,
    o.code as org_code,
    o.is_active,
    COALESCE(m.member_count, 0) as total_members,
    COALESCE(p.processo_count, 0) as total_processos,
    COALESCE(ps.pessoa_count, 0) as total_pessoas,
    o.created_at,
    GREATEST(
      o.updated_at,
      COALESCE(m.last_member_activity, o.updated_at),
      COALESCE(p.last_processo_activity, o.updated_at)
    ) as last_activity
  FROM organizations o
  LEFT JOIN (
    SELECT org_id, COUNT(*) as member_count, MAX(updated_at) as last_member_activity
    FROM members
    WHERE status = 'active'
    GROUP BY org_id
  ) m ON m.org_id = o.id
  LEFT JOIN (
    SELECT org_id, COUNT(*) as processo_count, MAX(updated_at) as last_processo_activity
    FROM processos
    WHERE deleted_at IS NULL
    GROUP BY org_id
  ) p ON p.org_id = o.id
  LEFT JOIN (
    SELECT org_id, COUNT(*) as pessoa_count
    FROM pessoas
    GROUP BY org_id
  ) ps ON ps.org_id = o.id
  ORDER BY o.created_at DESC;
END;
$$;

-- RPC para obter métricas globais do sistema (super admin only)
CREATE OR REPLACE FUNCTION public.get_global_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_metrics jsonb;
BEGIN
  -- Verificar se usuário é super admin
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Super admin only';
  END IF;

  SELECT jsonb_build_object(
    'timestamp', now(),
    'total_organizations', (SELECT COUNT(*) FROM organizations WHERE is_active = true),
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM members WHERE status = 'active'),
    'total_processos', (SELECT COUNT(*) FROM processos WHERE deleted_at IS NULL),
    'total_pessoas', (SELECT COUNT(*) FROM pessoas),
    'total_conversations', (SELECT COUNT(*) FROM conversations),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'active_sessions_today', (
      SELECT COUNT(DISTINCT user_id) 
      FROM audit_logs 
      WHERE created_at > now() - interval '24 hours'
    ),
    'storage_usage_mb', (
      SELECT COALESCE(SUM(file_size) / (1024.0 * 1024.0), 0)::numeric(10,2)
      FROM dataset_files
    ),
    'openai_requests_today', (
      SELECT COUNT(*) 
      FROM openai_logs 
      WHERE created_at > now() - interval '24 hours'
    ),
    'openai_cost_today_cents', (
      SELECT COALESCE(SUM(cost_cents), 0)
      FROM openai_logs 
      WHERE created_at > now() - interval '24 hours'
    ),
    'avg_response_time_ms', (
      SELECT COALESCE(AVG(duration_ms), 0)::integer
      FROM openai_logs 
      WHERE created_at > now() - interval '24 hours'
    ),
    'organizations_by_status', (
      SELECT jsonb_object_agg(
        CASE WHEN is_active THEN 'active' ELSE 'inactive' END,
        count
      )
      FROM (
        SELECT is_active, COUNT(*) as count
        FROM organizations
        GROUP BY is_active
      ) sub
    ),
    'users_by_role', (
      SELECT jsonb_object_agg(role::text, count)
      FROM (
        SELECT role, COUNT(*) as count
        FROM members
        WHERE status = 'active'
        GROUP BY role
      ) sub
    )
  ) INTO v_metrics;

  -- Log acesso às métricas globais
  PERFORM enhanced_log_user_action(
    'VIEW_GLOBAL_METRICS',
    'system',
    NULL,
    jsonb_build_object('metrics_accessed', true)
  );

  RETURN v_metrics;
END;
$$;