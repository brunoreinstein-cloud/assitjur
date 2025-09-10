-- RPC function to get AssistJur processos with filters and pagination
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_processos(
  p_org_id uuid,
  p_filters jsonb DEFAULT '{}',
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  data jsonb,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'assistjur'
AS $$
DECLARE
  v_offset integer;
  v_search text;
  v_classificacao text[];
  v_count_query text;
  v_data_query text;
  v_where_conditions text[] := ARRAY[]::text[];
  v_total_count bigint;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_limit;
  
  -- Extract filters
  v_search := p_filters->>'search';
  
  IF p_filters ? 'classificacao' AND jsonb_typeof(p_filters->'classificacao') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_classificacao
    FROM jsonb_array_elements_text(p_filters->'classificacao');
  END IF;
  
  -- Build WHERE conditions
  v_where_conditions := v_where_conditions || ARRAY['org_id = $1'];
  
  IF v_search IS NOT NULL AND v_search != '' THEN
    v_where_conditions := v_where_conditions || ARRAY[
      '(cnj ILIKE ' || quote_literal('%' || v_search || '%') || 
      ' OR reclamante_limpo ILIKE ' || quote_literal('%' || v_search || '%') || 
      ' OR reu_nome ILIKE ' || quote_literal('%' || v_search || '%') || ')'
    ];
  END IF;
  
  IF v_classificacao IS NOT NULL AND array_length(v_classificacao, 1) > 0 THEN
    v_where_conditions := v_where_conditions || ARRAY[
      'classificacao_final = ANY(' || quote_literal(v_classificacao) || ')'
    ];
  END IF;
  
  -- Build final WHERE clause
  v_where_conditions := ARRAY['WHERE ' || array_to_string(v_where_conditions, ' AND ')];
  
  -- Get total count
  v_count_query := 'SELECT COUNT(*) FROM assistjur.por_processo_staging ' || 
                   array_to_string(v_where_conditions, '');
  
  EXECUTE v_count_query USING p_org_id INTO v_total_count;
  
  -- Get data with transformed structure
  RETURN QUERY
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'cnj', COALESCE(p.cnj, ''),
        'reclamante', COALESCE(p.reclamante_limpo, ''),
        'reclamada', COALESCE(p.reu_nome, ''),
        'testemunhas_ativas', CASE 
          WHEN p.testemunhas_ativo_limpo IS NOT NULL AND p.testemunhas_ativo_limpo != '' 
          THEN string_to_array(trim(p.testemunhas_ativo_limpo), ',')
          ELSE ARRAY[]::text[]
        END,
        'testemunhas_passivas', CASE 
          WHEN p.testemunhas_passivo_limpo IS NOT NULL AND p.testemunhas_passivo_limpo != '' 
          THEN string_to_array(trim(p.testemunhas_passivo_limpo), ',')
          ELSE ARRAY[]::text[]
        END,
        'qtd_testemunhas', (
          CASE 
            WHEN p.testemunhas_ativo_limpo IS NOT NULL AND p.testemunhas_ativo_limpo != '' 
            THEN array_length(string_to_array(trim(p.testemunhas_ativo_limpo), ','), 1)
            ELSE 0
          END + 
          CASE 
            WHEN p.testemunhas_passivo_limpo IS NOT NULL AND p.testemunhas_passivo_limpo != '' 
            THEN array_length(string_to_array(trim(p.testemunhas_passivo_limpo), ','), 1)
            ELSE 0
          END
        ),
        'classificacao', COALESCE(p.classificacao_final, 'Normal'),
        'classificacao_estrategica', COALESCE(p.insight_estrategico, 'Normal'),
        'created_at', COALESCE(p.created_at, now())
      )
      ORDER BY p.created_at DESC
    ) as data,
    v_total_count as total_count
  FROM (
    SELECT
      cnj,
      reclamante_limpo,
      reu_nome,
      testemunhas_ativo_limpo,
      testemunhas_passivo_limpo,
      classificacao_final,
      insight_estrategico,
      created_at
    FROM assistjur.por_processo_staging
    WHERE org_id = p_org_id
      AND (v_search IS NULL OR v_search = '' OR (
        cnj ILIKE ('%' || v_search || '%') OR
        reclamante_limpo ILIKE ('%' || v_search || '%') OR
        reu_nome ILIKE ('%' || v_search || '%')
      ))
      AND (v_classificacao IS NULL OR classificacao_final = ANY(v_classificacao))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) p;
END;
$$;

-- RPC function to get AssistJur statistics
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_stats(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'assistjur'
AS $$
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
$$;