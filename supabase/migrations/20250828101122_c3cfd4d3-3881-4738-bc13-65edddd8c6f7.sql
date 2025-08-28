-- Fase 1: Alinhamento do Schema e Staging Tables

-- 1.1 Criar staging table para importação segura
CREATE TABLE IF NOT EXISTS public.stg_processos (
  cnj text,
  reclamante_limpo text,
  reu_nome text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  reclamante_cpf text,
  data_audiencia text,
  observacoes text,
  cnj_digits text,
  -- metadados para tracking
  row_number integer,
  import_job_id uuid
);

-- 1.2 Adicionar coluna cnj_digits à tabela processos se não existir
ALTER TABLE public.processos 
ADD COLUMN IF NOT EXISTS cnj_digits text;

-- 1.3 Criar índice único em cnj_digits para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS processos_org_cnj_digits_unique 
ON public.processos (org_id, cnj_digits) 
WHERE deleted_at IS NULL;

-- 1.4 Criar índices de performance
CREATE INDEX IF NOT EXISTS processos_cnj_digits_idx ON public.processos (cnj_digits);
CREATE INDEX IF NOT EXISTS stg_processos_cnj_digits_idx ON public.stg_processos (cnj_digits);

-- 1.5 Função para popular cnj_digits a partir de cnj_normalizado existente
CREATE OR REPLACE FUNCTION public.populate_cnj_digits() 
RETURNS void AS $$
BEGIN
  UPDATE public.processos 
  SET cnj_digits = cnj_normalizado 
  WHERE cnj_digits IS NULL AND cnj_normalizado IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.6 Popular dados existentes
SELECT public.populate_cnj_digits();

-- 1.7 Função para upsert staging → final (compatível com comando proposto)
CREATE OR REPLACE FUNCTION public.upsert_staging_to_final(p_org_id uuid, p_import_job_id uuid DEFAULT NULL)
RETURNS TABLE (
  inserted_count integer,
  updated_count integer,
  error_count integer
) AS $$
DECLARE
  v_inserted integer := 0;
  v_updated integer := 0;
  v_error integer := 0;
BEGIN
  -- Upsert com tratamento de data
  WITH inserted_data AS (
    INSERT INTO public.processos (
      org_id, cnj, cnj_digits, reclamante_nome, reu_nome, 
      comarca, tribunal, vara, fase, status, 
      reclamante_cpf_mask, data_audiencia, observacoes, version_id
    )
    SELECT
      p_org_id,
      s.cnj,
      s.cnj_digits,
      s.reclamante_limpo, -- mapeamento correto
      s.reu_nome,
      NULLIF(s.comarca, '') as comarca,
      NULLIF(s.tribunal, '') as tribunal,
      NULLIF(s.vara, '') as vara,
      NULLIF(s.fase, '') as fase,
      NULLIF(s.status, '') as status,
      NULLIF(s.reclamante_cpf, '') as reclamante_cpf_mask,
      -- tratamento de data flexível
      (CASE
         WHEN s.data_audiencia ~ '^\d{4}-\d{2}-\d{2}$' THEN s.data_audiencia::date
         WHEN s.data_audiencia ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(s.data_audiencia,'DD/MM/YYYY')
         ELSE NULL
       END) as data_audiencia,
      NULLIF(s.observacoes, '') as observacoes,
      (SELECT dv.id FROM dataset_versions dv WHERE dv.org_id = p_org_id AND dv.is_active = true LIMIT 1)
    FROM public.stg_processos s
    WHERE s.cnj_digits IS NOT NULL 
      AND length(s.cnj_digits) = 20
      AND (p_import_job_id IS NULL OR s.import_job_id = p_import_job_id)
    ON CONFLICT (org_id, cnj_digits)
    DO UPDATE SET
      reclamante_nome = EXCLUDED.reclamante_nome,
      reu_nome = EXCLUDED.reu_nome,
      comarca = EXCLUDED.comarca,
      tribunal = EXCLUDED.tribunal,
      vara = EXCLUDED.vara,
      fase = EXCLUDED.fase,
      status = EXCLUDED.status,
      reclamante_cpf_mask = EXCLUDED.reclamante_cpf_mask,
      data_audiencia = EXCLUDED.data_audiencia,
      observacoes = EXCLUDED.observacoes,
      updated_at = now()
    RETURNING (CASE WHEN xmax = 0 THEN 'INSERT' ELSE 'UPDATE' END) as operation
  )
  SELECT 
    COUNT(*) FILTER (WHERE operation = 'INSERT'),
    COUNT(*) FILTER (WHERE operation = 'UPDATE'),
    0
  FROM inserted_data INTO v_inserted, v_updated, v_error;

  RETURN QUERY SELECT v_inserted, v_updated, v_error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.8 Função para limpar staging (segurança)
CREATE OR REPLACE FUNCTION public.cleanup_staging(p_import_job_id uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF p_import_job_id IS NOT NULL THEN
    DELETE FROM public.stg_processos WHERE import_job_id = p_import_job_id;
  ELSE
    TRUNCATE public.stg_processos;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;