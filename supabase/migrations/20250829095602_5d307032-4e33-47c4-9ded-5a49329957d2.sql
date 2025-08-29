-- Drop and recreate the upsert_staging_to_final function with manual upsert logic
DROP FUNCTION IF EXISTS public.upsert_staging_to_final(uuid, uuid);

CREATE OR REPLACE FUNCTION public.upsert_staging_to_final(p_org_id uuid, p_import_job_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(inserted_count integer, updated_count integer, error_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inserted integer := 0;
  v_updated integer := 0;
  v_error integer := 0;
  v_active_version_id uuid;
BEGIN
  -- Get active version ID
  SELECT dv.id INTO v_active_version_id 
  FROM dataset_versions dv 
  WHERE dv.org_id = p_org_id AND dv.is_active = true 
  LIMIT 1;

  -- First, UPDATE existing records (not soft-deleted)
  WITH updated_data AS (
    UPDATE public.processos 
    SET 
      reclamante_nome = s.reclamante_limpo,
      reu_nome = s.reu_nome,
      comarca = NULLIF(s.comarca, ''),
      tribunal = NULLIF(s.tribunal, ''),
      vara = NULLIF(s.vara, ''),
      fase = NULLIF(s.fase, ''),
      status = NULLIF(s.status, ''),
      reclamante_cpf_mask = NULLIF(s.reclamante_cpf, ''),
      data_audiencia = (CASE
         WHEN s.data_audiencia ~ '^\d{4}-\d{2}-\d{2}$' THEN s.data_audiencia::date
         WHEN s.data_audiencia ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(s.data_audiencia,'DD/MM/YYYY')
         ELSE NULL
       END),
      observacoes = NULLIF(s.observacoes, ''),
      updated_at = now()
    FROM public.stg_processos s
    WHERE processos.org_id = p_org_id
      AND processos.cnj_digits = s.cnj_digits
      AND processos.deleted_at IS NULL
      AND s.cnj_digits IS NOT NULL 
      AND length(s.cnj_digits) = 20
      AND (p_import_job_id IS NULL OR s.import_job_id = p_import_job_id)
    RETURNING processos.id
  )
  SELECT COUNT(*) INTO v_updated FROM updated_data;

  -- Then, INSERT new records that don't exist or are soft-deleted
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
      s.reclamante_limpo,
      s.reu_nome,
      NULLIF(s.comarca, ''),
      NULLIF(s.tribunal, ''),
      NULLIF(s.vara, ''),
      NULLIF(s.fase, ''),
      NULLIF(s.status, ''),
      NULLIF(s.reclamante_cpf, ''),
      (CASE
         WHEN s.data_audiencia ~ '^\d{4}-\d{2}-\d{2}$' THEN s.data_audiencia::date
         WHEN s.data_audiencia ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(s.data_audiencia,'DD/MM/YYYY')
         ELSE NULL
       END),
      NULLIF(s.observacoes, ''),
      v_active_version_id
    FROM public.stg_processos s
    WHERE s.cnj_digits IS NOT NULL 
      AND length(s.cnj_digits) = 20
      AND (p_import_job_id IS NULL OR s.import_job_id = p_import_job_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.processos p 
        WHERE p.org_id = p_org_id 
          AND p.cnj_digits = s.cnj_digits 
          AND p.deleted_at IS NULL
      )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted_data;

  RETURN QUERY SELECT v_inserted, v_updated, v_error;
END;
$function$;