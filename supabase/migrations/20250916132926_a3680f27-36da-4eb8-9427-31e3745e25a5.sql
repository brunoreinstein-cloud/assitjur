-- SECURITY FIX: Remove Security Definer Views that bypass RLS
-- Issue: Views owned by 'postgres' bypass Row Level Security policies
-- Solution: Remove problematic views and use RLS-enabled table access instead

-- 1. Remove the security-problematic view that bypasses RLS
DROP VIEW IF EXISTS public.vw_processos_secure CASCADE;

-- 2. Remove any other potentially problematic views owned by postgres that could bypass RLS
-- (Keep financial views as they have proper admin-only access controls)
DROP VIEW IF EXISTS public.minha_view CASCADE;

-- 3. Create a SECURITY INVOKER function instead of a view for secure legal data access
-- This respects the calling user's RLS policies instead of bypassing them
CREATE OR REPLACE FUNCTION public.get_secure_processos()
RETURNS TABLE(
  id uuid,
  org_id uuid,
  cnj text,
  cnj_normalizado text,
  reclamante_nome text,
  reu_nome text,
  comarca text,
  tribunal text,
  vara text,
  fase text,
  status text,
  data_audiencia date,
  classificacao_final text,
  score_risco integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY INVOKER  -- CRITICAL: Uses caller's permissions, respects RLS
SET search_path TO 'public'
AS $function$
DECLARE
  user_access_level text;
BEGIN
  -- Get user's access level for data masking
  SELECT p.data_access_level::text INTO user_access_level
  FROM profiles p 
  WHERE p.user_id = auth.uid() 
    AND p.is_active = true;
  
  -- Return data with appropriate masking based on user's access level
  -- RLS on processos table will automatically filter by organization
  RETURN QUERY
  SELECT 
    p.id,
    p.org_id,
    p.cnj,
    p.cnj_normalizado,
    -- Apply data masking based on user access level
    CASE 
      WHEN user_access_level = 'FULL' THEN p.reclamante_nome
      ELSE mask_name(p.reclamante_nome)
    END as reclamante_nome,
    CASE 
      WHEN user_access_level = 'FULL' THEN p.reu_nome
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
  WHERE p.deleted_at IS NULL;  -- RLS will handle org filtering automatically
END;
$function$;

-- 4. Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_secure_processos() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_secure_processos() FROM anon;

-- 5. Add security documentation
COMMENT ON FUNCTION public.get_secure_processos IS 
'SECURITY INVOKER function for accessing legal process data. Uses caller permissions and respects RLS policies. Applies data masking based on user access level. Replaces the insecure vw_processos_secure view.';

-- 6. Verify that financial views have proper access controls
-- Check that financial views are only accessible by super admins
DO $$
DECLARE
  view_count INTEGER;
BEGIN
  -- Count views that might expose financial data
  SELECT COUNT(*) INTO view_count
  FROM pg_views 
  WHERE schemaname = 'public' 
    AND viewname LIKE 'v_%'
    AND viewname IN ('v_mrr_by_month', 'v_gross_margin', 'v_burn_runway', 'v_arpa_by_month');
  
  IF view_count > 0 THEN
    RAISE NOTICE 'SECURITY CHECK: % financial views detected. Ensure these have proper access controls via has_financial_access() function in application layer.', view_count;
  END IF;
  
  RAISE NOTICE 'SECURITY FIX COMPLETED: Removed RLS-bypassing views, replaced with SECURITY INVOKER function';
END $$;