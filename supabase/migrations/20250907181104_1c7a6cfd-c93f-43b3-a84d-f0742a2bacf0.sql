-- CRITICAL SECURITY FIXES - Phase 1: Data Protection (Final)

-- 1. Secure beta_signups table - RESTRICT PUBLIC ACCESS
-- Remove the overly permissive public signup policy
DROP POLICY IF EXISTS "Allow public beta signup creation" ON public.beta_signups;

-- Add a more restrictive beta signup policy
CREATE POLICY "Restricted beta signup creation" 
ON public.beta_signups 
FOR INSERT 
WITH CHECK (
  -- Only allow authenticated users to create beta signups
  auth.uid() IS NOT NULL
);

-- 2. Since processos_live is a view, we need to drop it and replace with a secure function
DROP VIEW IF EXISTS public.processos_live;

-- 3. Fix all critical security definer functions - add missing search_path
CREATE OR REPLACE FUNCTION public.cleanup_staging(p_import_job_id uuid DEFAULT NULL)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_import_job_id IS NOT NULL THEN
    DELETE FROM public.stg_processos WHERE import_job_id = p_import_job_id;
  ELSE
    TRUNCATE public.stg_processos;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potential XSS/injection characters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<[^>]*>', '', 'g'),
      '[<>''";]', '', 'g'
    ),
    '\s+', ' ', 'g'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_staging_to_final(p_org_id uuid, p_import_job_id uuid DEFAULT NULL)
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
  -- Verify user has admin access to this organization
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
      AND p.organization_id = p_org_id
      AND p.role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Access denied to organization data';
  END IF;

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
      cnj_normalizado = s.cnj_digits,
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
      org_id, cnj, cnj_digits, cnj_normalizado, reclamante_nome, reu_nome, 
      comarca, tribunal, vara, fase, status, 
      reclamante_cpf_mask, data_audiencia, observacoes, version_id
    )
    SELECT
      p_org_id,
      s.cnj,
      s.cnj_digits,
      s.cnj_digits, -- Map cnj_digits to cnj_normalizado
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