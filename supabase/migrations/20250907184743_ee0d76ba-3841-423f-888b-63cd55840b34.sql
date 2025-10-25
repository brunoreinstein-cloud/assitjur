-- Add reu_nome column and update view/function
ALTER TABLE assistjur.por_processo_staging
ADD COLUMN IF NOT EXISTS reu_nome text;

-- Populate existing rows with empty string to avoid nulls
UPDATE assistjur.por_processo_staging
SET reu_nome = ''
WHERE reu_nome IS NULL;

-- Update canonical view to expose reu_nome as reclamada
CREATE OR REPLACE VIEW assistjur.por_processo_view AS
SELECT
  cnj,
  reclamante_limpo as reclamante,
  reu_nome as reclamada,
  CASE
    WHEN testemunhas_ativo_limpo IS NOT NULL AND testemunhas_ativo_limpo <> ''
    THEN string_to_array(testemunhas_ativo_limpo, ',')
    ELSE ARRAY[]::text[]
  END as testemunhas_ativas,
  CASE
    WHEN testemunhas_passivo_limpo IS NOT NULL AND testemunhas_passivo_limpo <> ''
    THEN string_to_array(testemunhas_passivo_limpo, ',')
    ELSE ARRAY[]::text[]
  END as testemunhas_passivas,
  CASE
    WHEN testemunhas_ativo_limpo IS NOT NULL AND testemunhas_ativo_limpo <> ''
    THEN array_length(string_to_array(testemunhas_ativo_limpo, ','), 1)
    ELSE 0
  END +
  CASE
    WHEN testemunhas_passivo_limpo IS NOT NULL AND testemunhas_passivo_limpo <> ''
    THEN array_length(string_to_array(testemunhas_passivo_limpo, ','), 1)
    ELSE 0
  END as qtd_testemunhas,
  classificacao_final as classificacao,
  insight_estrategico as classificacao_estrategica,
  created_at,
  org_id
FROM assistjur.por_processo_staging;

-- Ensure RPC uses the new column
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_processos(
  p_org_id uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_page integer DEFAULT 1,
  p_limit integer DEFAULT 50
)
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
  -- Verify user has access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied to organization data';
  END IF;

  -- Calculate offset
  v_offset := (p_page - 1) * p_limit;

  -- Extract filters safely
  v_search := COALESCE(p_filters->>'search', '');

  IF p_filters ? 'classificacao' AND jsonb_typeof(p_filters->'classificacao') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_classificacao
    FROM jsonb_array_elements_text(p_filters->'classificacao')
    WHERE value::text IS NOT NULL AND value::text <> '';
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
          WHEN COALESCE(p.testemunhas_ativo_limpo, '') <> '' AND p.testemunhas_ativo_limpo <> 'nan'
          THEN string_to_array(trim(p.testemunhas_ativo_limpo), ',')
          ELSE ARRAY[]::text[]
        END,
        'testemunhas_passivas', CASE
          WHEN COALESCE(p.testemunhas_passivo_limpo, '') <> '' AND p.testemunhas_passivo_limpo <> 'nan'
          THEN string_to_array(trim(p.testemunhas_passivo_limpo), ',')
          ELSE ARRAY[]::text[]
        END,
        'qtd_testemunhas', COALESCE((
          CASE
            WHEN COALESCE(p.testemunhas_ativo_limpo, '') <> '' AND p.testemunhas_ativo_limpo <> 'nan'
            THEN array_length(string_to_array(trim(p.testemunhas_ativo_limpo), ','), 1)
            ELSE 0
          END +
          CASE
            WHEN COALESCE(p.testemunhas_passivo_limpo, '') <> '' AND p.testemunhas_passivo_limpo <> 'nan'
            THEN array_length(string_to_array(trim(p.testemunhas_passivo_limpo), ','), 1)
            ELSE 0
          END
        ), 0),
        'classificacao', COALESCE(p.classificacao_final, 'Normal'),
        'classificacao_estrategica', COALESCE(p.insight_estrategico, 'Normal'),
        'created_at', COALESCE(p.created_at, now())
      )
      ORDER BY p.created_at DESC
    ) AS data,
    v_total_count AS total_count
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
