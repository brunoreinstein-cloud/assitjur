-- SECURITY FIXES - Phase 2: Targeted fixes for remaining warnings

-- Fix the two functions with non-standard search_path
-- These functions have 'search_path=public, assistjur' which should be just 'public'

CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_processos(p_org_id uuid, p_filters jsonb DEFAULT '{}'::jsonb, p_page integer DEFAULT 1, p_limit integer DEFAULT 50)
RETURNS TABLE(data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_classificacao text[];
  v_total_count bigint;
  v_user_org_id uuid;
  v_user_access_level text;
BEGIN
  -- CRITICAL SECURITY CHECK: Verify user belongs to the requested organization
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
  WHERE org_id = p_org_id  -- CRITICAL: Always filter by org_id
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
    WHERE org_id = p_org_id  -- CRITICAL: Mandatory org isolation
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
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_stats(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_total integer;
  v_criticos integer;
  v_atencao integer;
  v_observacao integer;
  v_normais integer;
  v_percentual_critico numeric;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO v_total
  FROM assistjur.por_processo_staging
  WHERE org_id = p_org_id;
  
  -- Get classification counts
  SELECT 
    COUNT(*) FILTER (WHERE lower(classificacao_final) = 'crítico') as criticos,
    COUNT(*) FILTER (WHERE lower(classificacao_final) = 'atenção') as atencao,
    COUNT(*) FILTER (WHERE lower(classificacao_final) = 'observação') as observacao
  INTO v_criticos, v_atencao, v_observacao
  FROM assistjur.por_processo_staging
  WHERE org_id = p_org_id;
  
  -- Calculate normais
  v_normais := v_total - v_criticos - v_atencao - v_observacao;
  
  -- Calculate percentage
  v_percentual_critico := CASE 
    WHEN v_total > 0 THEN ROUND((v_criticos::numeric / v_total::numeric) * 100, 1)
    ELSE 0
  END;
  
  RETURN jsonb_build_object(
    'total', v_total,
    'criticos', v_criticos,
    'atencao', v_atencao,
    'observacao', v_observacao,
    'normais', v_normais,
    'percentualCritico', v_percentual_critico::text
  );
END;
$function$;