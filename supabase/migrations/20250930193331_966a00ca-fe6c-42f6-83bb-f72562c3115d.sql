-- Correct RPC function for assistjur testemunhas with proper type conversions
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_testemunhas(
  p_org_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(data jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
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
  
  -- Get total count with MANDATORY org isolation (no cpf reference)
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
END;
$function$;