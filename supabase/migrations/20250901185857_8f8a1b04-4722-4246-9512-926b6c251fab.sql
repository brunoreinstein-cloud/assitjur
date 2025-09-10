-- Fix NaN and null values in assistjur.por_processo_staging
UPDATE assistjur.por_processo_staging 
SET 
  testemunhas_ativo_limpo = CASE 
    WHEN testemunhas_ativo_limpo = 'nan' OR testemunhas_ativo_limpo IS NULL THEN ''
    ELSE testemunhas_ativo_limpo
  END,
  testemunhas_passivo_limpo = CASE 
    WHEN testemunhas_passivo_limpo = 'nan' OR testemunhas_passivo_limpo IS NULL THEN ''
    ELSE testemunhas_passivo_limpo
  END,
  cnjs_triangulacao = CASE 
    WHEN cnjs_triangulacao = 'nan' OR cnjs_triangulacao IS NULL THEN ''
    ELSE cnjs_triangulacao
  END,
  cnjs_troca_direta = CASE 
    WHEN cnjs_troca_direta = 'nan' OR cnjs_troca_direta IS NULL THEN ''
    ELSE cnjs_troca_direta
  END
WHERE org_id = 'f794ba63-47ba-4a04-ba57-dffe0de045c0';

-- Update the RPC function to handle edge cases better
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_processos(p_org_id uuid, p_filters jsonb DEFAULT '{}'::jsonb, p_page integer DEFAULT 1, p_limit integer DEFAULT 50)
 RETURNS TABLE(data jsonb, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'assistjur'
AS $function$
DECLARE
  v_offset integer;
  v_search text;
  v_classificacao text[];
  v_total_count bigint;
BEGIN
  -- Calculate offset
  v_offset := (p_page - 1) * p_limit;
  
  -- Extract filters safely
  v_search := COALESCE(p_filters->>'search', '');
  
  IF p_filters ? 'classificacao' AND jsonb_typeof(p_filters->'classificacao') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_classificacao
    FROM jsonb_array_elements_text(p_filters->'classificacao')
    WHERE value::text IS NOT NULL AND value::text != '';
  END IF;
  
  -- Get total count safely
  SELECT COUNT(*) INTO v_total_count
  FROM assistjur.por_processo_staging
  WHERE org_id = p_org_id
    AND (v_search = '' OR v_search IS NULL OR (
      COALESCE(cnj, '') ILIKE ('%' || v_search || '%') OR
      COALESCE(reclamante_limpo, '') ILIKE ('%' || v_search || '%') OR
      COALESCE(reu_nome, '') ILIKE ('%' || v_search || '%')
    ))
    AND (v_classificacao IS NULL OR COALESCE(classificacao_final, 'Normal') = ANY(v_classificacao));
  
  -- Get data with safe transformations
  RETURN QUERY
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'cnj', COALESCE(p.cnj, ''),
        'reclamante', COALESCE(p.reclamante_limpo, ''),
        'reclamada', COALESCE(p.reu_nome, ''),
        'testemunhas_ativas', CASE 
          WHEN COALESCE(p.testemunhas_ativo_limpo, '') != '' AND p.testemunhas_ativo_limpo != 'nan'
          THEN string_to_array(trim(p.testemunhas_ativo_limpo), ',')
          ELSE ARRAY[]::text[]
        END,
        'testemunhas_passivas', CASE 
          WHEN COALESCE(p.testemunhas_passivo_limpo, '') != '' AND p.testemunhas_passivo_limpo != 'nan'
          THEN string_to_array(trim(p.testemunhas_passivo_limpo), ',')
          ELSE ARRAY[]::text[]
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
      AND (v_search = '' OR v_search IS NULL OR (
        COALESCE(cnj, '') ILIKE ('%' || v_search || '%') OR
        COALESCE(reclamante_limpo, '') ILIKE ('%' || v_search || '%') OR
        COALESCE(reu_nome, '') ILIKE ('%' || v_search || '%')
      ))
      AND (v_classificacao IS NULL OR COALESCE(classificacao_final, 'Normal') = ANY(v_classificacao))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET v_offset
  ) p;
END;
$function$;