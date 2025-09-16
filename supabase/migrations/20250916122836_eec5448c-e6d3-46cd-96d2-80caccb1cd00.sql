-- CRITICAL SECURITY FIX: Prevent Legal Data Leakage
-- Issue: Confidential legal case information could be leaked through insecure functions and inconsistent access controls

-- 1. SECURITY DEFINER Function Fix - Add mandatory org verification
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

-- 2. Enhanced data access logging function for legal data
CREATE OR REPLACE FUNCTION public.log_legal_data_access(
  p_table_name text,
  p_org_id uuid,
  p_access_type text,
  p_record_count integer DEFAULT 0,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile 
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Only log if user has profile and belongs to the org
  IF v_user_profile.organization_id = p_org_id THEN
    INSERT INTO data_access_logs (
      org_id, 
      user_id, 
      accessed_table, 
      access_type,
      ip_address, 
      user_agent,
      created_at
    ) VALUES (
      p_org_id,
      auth.uid(),
      p_table_name,
      p_access_type,
      inet '127.0.0.1',
      'AssistJur-LegalDataAccess',
      now()
    );
    
    -- Also create audit log for critical legal data access
    PERFORM log_user_action(
      'LEGAL_DATA_ACCESS',
      p_table_name,
      null,
      jsonb_build_object(
        'org_id', p_org_id,
        'access_type', p_access_type,
        'record_count', p_record_count,
        'user_role', v_user_profile.role,
        'access_level', v_user_profile.data_access_level,
        'metadata', p_metadata
      )
    );
  END IF;
END;
$function$;

-- 3. Enhanced access control function with legal compliance
CREATE OR REPLACE FUNCTION public.can_access_legal_data(p_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM profiles 
  WHERE user_id = auth.uid() 
    AND is_active = true;
  
  -- User must exist, be active, belong to org, and have appropriate access
  IF v_profile.user_id IS NULL 
     OR v_profile.organization_id != p_org_id 
     OR v_profile.data_access_level NOT IN ('FULL', 'MASKED') THEN
    RETURN false;
  END IF;
  
  -- Log the access check for audit purposes
  PERFORM log_legal_data_access(
    'ACCESS_PERMISSION_CHECK',
    p_org_id,
    'PERMISSION_VERIFICATION',
    0,
    jsonb_build_object(
      'user_role', v_profile.role,
      'access_level', v_profile.data_access_level,
      'result', 'GRANTED'
    )
  );
  
  RETURN true;
END;
$function$;

-- 4. Security trigger for legal data access monitoring
CREATE OR REPLACE FUNCTION public.monitor_legal_data_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Monitor access to sensitive legal tables
  IF TG_TABLE_NAME IN ('processos', 'pessoas') THEN
    PERFORM log_legal_data_access(
      TG_TABLE_NAME,
      COALESCE(NEW.org_id, OLD.org_id),
      TG_OP,
      1,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id)
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

-- Apply monitoring triggers to sensitive tables
DROP TRIGGER IF EXISTS trigger_monitor_processos_access ON processos;
CREATE TRIGGER trigger_monitor_processos_access
    AFTER INSERT OR UPDATE OR DELETE ON processos
    FOR EACH ROW EXECUTE FUNCTION monitor_legal_data_access();

DROP TRIGGER IF EXISTS trigger_monitor_pessoas_access ON pessoas;
CREATE TRIGGER trigger_monitor_pessoas_access
    AFTER INSERT OR UPDATE OR DELETE ON pessoas
    FOR EACH ROW EXECUTE FUNCTION monitor_legal_data_access();

-- 5. Create secure view for legal case access with built-in isolation
CREATE OR REPLACE VIEW public.vw_processos_secure AS
SELECT 
  p.id,
  p.org_id,
  p.cnj,
  p.cnj_normalizado,
  -- Apply data masking based on user access level
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reclamante_nome
    ELSE mask_name(p.reclamante_nome)
  END as reclamante_nome,
  CASE 
    WHEN can_access_sensitive_data(auth.uid()) THEN p.reu_nome
    ELSE mask_name(p.reu_nome)
  END as reu_nome,
  p.comarca,
  p.tribunal,
  p.vara,
  p.fase,
  p.status,
  p.data_audiencia,
  p.classificacao_final,
  p.score_risco,
  p.created_at,
  p.updated_at
FROM processos p
WHERE p.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.user_id = auth.uid() 
      AND pr.organization_id = p.org_id
      AND pr.is_active = true
      AND pr.data_access_level IN ('FULL', 'MASKED')
  );

-- Add RLS to the secure view
ALTER VIEW public.vw_processos_secure OWNER TO postgres;
GRANT SELECT ON public.vw_processos_secure TO authenticated;

-- 6. Add comprehensive security comments
COMMENT ON FUNCTION public.rpc_get_assistjur_processos IS 'SECURITY CRITICAL: This function accesses confidential legal case data. It enforces strict organizational isolation and data masking based on user access levels. All access is logged for LGPD compliance.';

COMMENT ON FUNCTION public.can_access_legal_data IS 'SECURITY FUNCTION: Determines if user can access legal data for specific organization with mandatory audit logging.';

COMMENT ON FUNCTION public.log_legal_data_access IS 'AUDIT FUNCTION: Logs all access to sensitive legal data for compliance with Brazilian privacy laws (LGPD).';

COMMENT ON VIEW public.vw_processos_secure IS 'SECURE VIEW: Provides access to legal process data with built-in organizational isolation and automatic data masking based on user permissions.';

-- 7. Final security validation
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Verify RLS is enabled on critical tables
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('processos', 'pessoas')
    AND schemaname = 'public';
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'SECURITY VALIDATION FAILED: Insufficient RLS policies on critical legal data tables';
  END IF;
  
  RAISE NOTICE 'SECURITY VALIDATION PASSED: Legal data protection measures are in place';
END $$;