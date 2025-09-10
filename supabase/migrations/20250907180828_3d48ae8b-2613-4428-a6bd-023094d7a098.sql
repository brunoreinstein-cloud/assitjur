-- CRITICAL SECURITY FIXES - Phase 1: Data Protection

-- 1. Fix processos_live table - ADD MISSING RLS POLICIES (CRITICAL)
-- This table contains sensitive legal data and has NO protection
ALTER TABLE public.processos_live ENABLE ROW LEVEL SECURITY;

-- Users can only see processos from their organization
CREATE POLICY "Users can view their organization processos_live" 
ON public.processos_live 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos_live.org_id
    AND can_access_sensitive_data(auth.uid())
));

-- Only admins can manage processos_live data
CREATE POLICY "Only admins can manage processos_live" 
ON public.processos_live 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = processos_live.org_id
    AND p.role = 'ADMIN'
));

-- 2. Secure beta_signups table - RESTRICT PUBLIC ACCESS
-- Remove the overly permissive public signup policy
DROP POLICY IF EXISTS "Allow public beta signup creation" ON public.beta_signups;

-- Add rate-limited beta signup policy (more secure)
CREATE POLICY "Controlled beta signup creation" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (
  -- Rate limit: only allow 1 signup per email per day
  NOT EXISTS (
    SELECT 1 FROM beta_signups 
    WHERE email = NEW.email 
      AND created_at > now() - interval '24 hours'
  )
);

-- 3. Fix critical database functions - ADD MISSING SECURITY SETTINGS
-- These functions are security definer but missing proper search_path
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

-- 4. Secure the assistjur stats function
CREATE OR REPLACE FUNCTION public.rpc_get_assistjur_stats(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'assistjur'
AS $function$
DECLARE
  v_total integer;
  v_criticos integer;
  v_atencao integer;
  v_observacao integer;
  v_normais integer;
  v_percentual_critico numeric;
BEGIN
  -- Verify user has access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
      AND p.organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Access denied to organization data';
  END IF;

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