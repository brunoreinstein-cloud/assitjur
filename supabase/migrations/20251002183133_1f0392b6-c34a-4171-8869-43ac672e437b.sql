-- ============================================================================
-- SUPER ADMIN ACCESS: Permitir super admins acessarem todas as organizações
-- ============================================================================
-- Issue: Super admins devem ter acesso cross-organizational no mapa de testemunhas
-- Date: 2025-10-02
-- ============================================================================

-- 1. Drop e recriar função de log para ações de super admin
DROP FUNCTION IF EXISTS public.log_super_admin_action(TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS public.log_super_admin_action(TEXT, UUID);
DROP FUNCTION IF EXISTS public.log_super_admin_action;

CREATE FUNCTION public.log_super_admin_action(
  p_action TEXT,
  p_target_org_id UUID,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    email,
    role,
    organization_id,
    action,
    resource,
    table_name,
    result,
    metadata
  )
  SELECT
    auth.uid(),
    p.email,
    'SUPER_ADMIN',
    p_target_org_id,
    p_action,
    'assistjur_data',
    'cross_org_access',
    'SUCCESS',
    p_metadata || jsonb_build_object(
      'is_super_admin', true,
      'user_org_id', p.organization_id,
      'target_org_id', p_target_org_id
    )
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$;

-- 2. Drop e recriar rpc_get_assistjur_processos com suporte a super admin
DROP FUNCTION IF EXISTS public.rpc_get_assistjur_processos(UUID, JSONB, INTEGER, INTEGER);

CREATE FUNCTION public.rpc_get_assistjur_processos(
  p_org_id uuid, 
  p_filters jsonb DEFAULT '{}'::jsonb, 
  p_page integer DEFAULT 1, 
  p_limit integer DEFAULT 50
)
RETURNS TABLE(data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_classificacao text[];
  v_total_count bigint;
  v_user_org_id uuid;
  v_user_access_level text;
  v_is_super_admin boolean;
BEGIN
  -- ✅ CHECK SUPER ADMIN STATUS FIRST
  v_is_super_admin := is_super_admin(auth.uid());
  
  IF v_is_super_admin THEN
    -- Super admin: FULL access to all organizations
    v_user_access_level := 'FULL';
    
    -- Log super admin cross-org access
    PERFORM log_super_admin_action(
      'ACCESS_ASSISTJUR_PROCESSOS',
      p_org_id,
      jsonb_build_object(
        'filters', p_filters,
        'page', p_page,
        'limit', p_limit
      )
    );
  ELSE
    -- Regular user: enforce organizational isolation
    SELECT p.organization_id, p.data_access_level::text 
    INTO v_user_org_id, v_user_access_level
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.is_active = true;
    
    -- Reject if user doesn't exist or belongs to different org
    IF v_user_org_id IS NULL OR v_user_org_id != p_org_id THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Access denied to organization data. User org: %, Requested org: %', v_user_org_id, p_org_id;
    END IF;
    
    -- Verify user has minimum required access level
    IF v_user_access_level NOT IN ('FULL', 'MASKED') THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Insufficient data access level: %', v_user_access_level;
    END IF;
  END IF;
  
  -- Calculate offset
  v_offset := (p_page - 1) * p_limit;
  
  -- Extract filters safely with input sanitization
  v_search := COALESCE(trim(p_filters->>'search'), '');
  
  -- Sanitize search input to prevent injection
  IF length(v_search) > 100 THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Search term too long';
  END IF;
  
  IF p_filters ? 'classificacao' AND jsonb_typeof(p_filters->'classificacao') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_classificacao
    FROM jsonb_array_elements_text(p_filters->'classificacao')
    WHERE value::text IS NOT NULL AND value::text != '' AND length(value::text) < 50;
  END IF;
  
  -- Get total count with MANDATORY org isolation
  SELECT COUNT(*) INTO v_total_count
  FROM assistjur.por_processo_staging
  WHERE org_id = p_org_id
    AND (v_search = '' OR v_search IS NULL OR (
      COALESCE(cnj, '') ILIKE ('%' || v_search || '%') OR
      COALESCE(reclamante_limpo, '') ILIKE ('%' || v_search || '%') OR
      COALESCE(reu_nome, '') ILIKE ('%' || v_search || '%')
    ))
    AND (v_classificacao IS NULL OR COALESCE(classificacao_final, 'Normal') = ANY(v_classificacao));
  
  -- Get data with MANDATORY org isolation and data masking based on access level
  RETURN QUERY
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'cnj', COALESCE(p.cnj, ''),
        'reclamante', CASE 
          WHEN v_user_access_level = 'FULL' THEN COALESCE(p.reclamante_limpo, '')
          ELSE left(COALESCE(p.reclamante_limpo, ''), 2) || '***'
        END,
        'reclamada', CASE 
          WHEN v_user_access_level = 'FULL' THEN COALESCE(p.reu_nome, '')
          ELSE left(COALESCE(p.reu_nome, ''), 2) || '***'
        END,
        'testemunhas_ativas', CASE 
          WHEN v_user_access_level = 'FULL' AND COALESCE(p.testemunhas_ativo_limpo, '') != '' AND p.testemunhas_ativo_limpo != 'nan'
          THEN string_to_array(trim(p.testemunhas_ativo_limpo), ',')
          ELSE ARRAY['***']::text[]
        END,
        'testemunhas_passivas', CASE 
          WHEN v_user_access_level = 'FULL' AND COALESCE(p.testemunhas_passivo_limpo, '') != '' AND p.testemunhas_passivo_limpo != 'nan'
          THEN string_to_array(trim(p.testemunhas_passivo_limpo), ',')
          ELSE ARRAY['***']::text[]
        END,
        'qtd_testemunhas', COALESCE((
          CASE 
            WHEN COALESCE(p.testemunhas_ativo_limpo, '') != '' AND p.testemunhas_ativo_limpo != 'nan'
            THEN array_length(string_to_array(trim(p.testemunhas_ativo_limpo), ','), 1)
            ELSE 0
          END + 
          CASE 
            WHEN COALESCE(p.testemunhas_passivo_limpo, '') != '' AND p.testemunhas_passivo_limpo != 'nan'
            THEN array_length(string_to_array(trim(p.testemunhas_passivo_limpo), ','), 1)
            ELSE 0
          END
        ), 0),
        'classificacao', COALESCE(p.classificacao_final, 'Normal'),
        'classificacao_estrategica', COALESCE(p.insight_estrategico, 'Normal'),
        'created_at', COALESCE(p.created_at, now())
      )
      ORDER BY p.created_at DESC
    ) as data,
    v_total_count as total_count
  FROM (
    SELECT *
    FROM assistjur.por_processo_staging
    WHERE org_id = p_org_id
      AND (v_search = '' OR v_search IS NULL OR (
        COALESCE(cnj, '') ILIKE ('%' || v_search || '%') OR
        COALESCE(reclamante_limpo, '') ILIKE ('%' || v_search || '%') OR
        COALESCE(reu_nome, '') ILIKE ('%' || v_search || '%')
      ))
      AND (v_classificacao IS NULL OR COALESCE(classificacao_final, 'Normal') = ANY(v_classificacao))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) p;
  
  -- Log sensitive data access for audit trail
  IF NOT v_is_super_admin THEN
    PERFORM log_user_action(
      'ACCESS_SENSITIVE_LEGAL_DATA',
      'assistjur.por_processo_staging',
      null,
      jsonb_build_object(
        'org_id', p_org_id,
        'user_access_level', v_user_access_level,
        'records_returned', v_total_count,
        'search_filters', p_filters
      )
    );
  END IF;
END;
$function$;

-- 3. Drop e recriar rpc_get_assistjur_testemunhas com suporte a super admin
DROP FUNCTION IF EXISTS public.rpc_get_assistjur_testemunhas(UUID, JSONB, INTEGER, INTEGER);

CREATE FUNCTION public.rpc_get_assistjur_testemunhas(
  p_org_id uuid, 
  p_filters jsonb DEFAULT '{}'::jsonb, 
  p_page integer DEFAULT 1, 
  p_limit integer DEFAULT 50
)
RETURNS TABLE(data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_classificacao text[];
  v_total_count bigint;
  v_user_org_id uuid;
  v_user_access_level text;
  v_is_super_admin boolean;
BEGIN
  -- ✅ CHECK SUPER ADMIN STATUS FIRST
  v_is_super_admin := is_super_admin(auth.uid());
  
  IF v_is_super_admin THEN
    -- Super admin: FULL access to all organizations
    v_user_access_level := 'FULL';
    
    -- Log super admin cross-org access
    PERFORM log_super_admin_action(
      'ACCESS_ASSISTJUR_TESTEMUNHAS',
      p_org_id,
      jsonb_build_object(
        'filters', p_filters,
        'page', p_page,
        'limit', p_limit
      )
    );
  ELSE
    -- Regular user: enforce organizational isolation
    SELECT p.organization_id, p.data_access_level::text 
    INTO v_user_org_id, v_user_access_level
    FROM profiles p 
    WHERE p.user_id = auth.uid() 
      AND p.is_active = true;
    
    -- Reject if user doesn't exist or belongs to different org
    IF v_user_org_id IS NULL OR v_user_org_id != p_org_id THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Access denied to organization data. User org: %, Requested org: %', v_user_org_id, p_org_id;
    END IF;
    
    -- Verify user has minimum required access level
    IF v_user_access_level NOT IN ('FULL', 'MASKED') THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Insufficient data access level: %', v_user_access_level;
    END IF;
  END IF;
  
  -- Calculate offset
  v_offset := (p_page - 1) * p_limit;
  
  -- Extract filters safely with input sanitization
  v_search := COALESCE(trim(p_filters->>'search'), '');
  
  -- Sanitize search input to prevent injection
  IF length(v_search) > 100 THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Search term too long';
  END IF;
  
  IF p_filters ? 'classificacao' AND jsonb_typeof(p_filters->'classificacao') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_classificacao
    FROM jsonb_array_elements_text(p_filters->'classificacao')
    WHERE value::text IS NOT NULL AND value::text != '' AND length(value::text) < 50;
  END IF;
  
  -- Get total count with MANDATORY org isolation
  SELECT COUNT(*) INTO v_total_count
  FROM assistjur.por_testemunha_staging
  WHERE org_id = p_org_id
    AND (v_search = '' OR v_search IS NULL OR 
      COALESCE(nome_testemunha, '') ILIKE ('%' || v_search || '%')
    )
    AND (v_classificacao IS NULL OR COALESCE(classificacao, 'Normal') = ANY(v_classificacao));
  
  -- Get data with MANDATORY org isolation and proper type conversions
  RETURN QUERY
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'nome_testemunha', CASE 
          WHEN v_user_access_level = 'FULL' THEN COALESCE(t.nome_testemunha, '')
          ELSE left(COALESCE(t.nome_testemunha, ''), 2) || '***'
        END,
        'qtd_depoimentos', COALESCE(
          CASE 
            WHEN t.qtd_depoimentos ~ '^\d+$' THEN t.qtd_depoimentos::integer
            ELSE 0
          END, 
          0
        ),
        'foi_testemunha_em_ambos_polos', COALESCE((t.foi_testemunha_em_ambos_polos = 'Sim'), false),
        'ja_foi_reclamante', COALESCE((t.ja_foi_reclamante = 'Sim'), false),
        'participou_triangulacao', COALESCE((t.participou_triangulacao = 'Sim'), false),
        'participou_troca_favor', COALESCE((t.participou_troca_favor = 'Sim'), false),
        'classificacao', COALESCE(t.classificacao, 'Normal'),
        'created_at', COALESCE(t.created_at, now())
      )
      ORDER BY t.created_at DESC
    ) as data,
    v_total_count as total_count
  FROM (
    SELECT *
    FROM assistjur.por_testemunha_staging
    WHERE org_id = p_org_id
      AND (v_search = '' OR v_search IS NULL OR 
        COALESCE(nome_testemunha, '') ILIKE ('%' || v_search || '%')
      )
      AND (v_classificacao IS NULL OR COALESCE(classificacao, 'Normal') = ANY(v_classificacao))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) t;
  
  -- Log sensitive data access for audit trail
  IF NOT v_is_super_admin THEN
    PERFORM log_user_action(
      'ACCESS_SENSITIVE_WITNESS_DATA',
      'assistjur.por_testemunha_staging',
      null,
      jsonb_build_object(
        'org_id', p_org_id,
        'user_access_level', v_user_access_level,
        'records_returned', v_total_count,
        'search_filters', p_filters
      )
    );
  END IF;
END;
$function$;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Super admin access implementado nos RPCs do mapa de testemunhas';
  RAISE NOTICE '✅ Função log_super_admin_action criada para auditoria';
  RAISE NOTICE '✅ rpc_get_assistjur_processos atualizado com suporte a super admin';
  RAISE NOTICE '✅ rpc_get_assistjur_testemunhas atualizado com suporte a super admin';
  RAISE NOTICE '📊 Super admins agora podem acessar dados de todas as organizações';
  RAISE NOTICE '🔐 Todos os acessos cross-org são auditados em audit_logs';
END $$;