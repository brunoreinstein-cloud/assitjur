-- Corrigir problemas de segurança críticos

-- 1. Habilitar RLS na tabela stg_processos
ALTER TABLE public.stg_processos ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas RLS para stg_processos (apenas admins)
CREATE POLICY "Admins can manage staging processos" ON public.stg_processos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role = 'ADMIN'
    )
  );

-- 3. Adicionar as funções com search_path seguro
CREATE OR REPLACE FUNCTION public.upsert_staging_to_final(p_org_id uuid, p_import_job_id uuid DEFAULT NULL)
RETURNS TABLE (
  inserted_count integer,
  updated_count integer,
  error_count integer
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

-- 4. Função para limpar staging com search_path seguro
CREATE OR REPLACE FUNCTION public.cleanup_staging(p_import_job_id uuid DEFAULT NULL)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF p_import_job_id IS NOT NULL THEN
    DELETE FROM public.stg_processos WHERE import_job_id = p_import_job_id;
  ELSE
    TRUNCATE public.stg_processos;
  END IF;
END;
$$;