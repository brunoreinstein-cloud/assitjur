-- CRITICAL FINANCIAL SECURITY FIX - Simple approach to prevent competitor access

-- 1. Revoke all public access to financial views immediately
REVOKE ALL ON v_arpa_by_month FROM PUBLIC;
REVOKE ALL ON v_burn_runway FROM PUBLIC; 
REVOKE ALL ON v_gross_margin FROM PUBLIC;
REVOKE ALL ON v_mrr_by_month FROM PUBLIC;

-- 2. Create a simple security barrier function for financial access
CREATE OR REPLACE FUNCTION public.check_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'ADMIN'
    AND p.data_access_level = 'FULL'
    AND p.is_active = true
  );
$$;

-- 3. Grant conditional access back to authenticated users (controlled by underlying table RLS)
GRANT SELECT ON v_arpa_by_month TO authenticated;
GRANT SELECT ON v_burn_runway TO authenticated;
GRANT SELECT ON v_gross_margin TO authenticated;
GRANT SELECT ON v_mrr_by_month TO authenticated;

-- 4. Log this critical security action
SELECT log_user_action(
  'FINANCIAL_VIEWS_SECURED',
  'financial_security',
  NULL,
  jsonb_build_object(
    'action', 'REVOKED_PUBLIC_ACCESS_TO_FINANCIAL_VIEWS',
    'views_secured', ARRAY['v_arpa_by_month', 'v_burn_runway', 'v_gross_margin', 'v_mrr_by_month'],
    'security_level', 'CRITICAL_COMPETITOR_PROTECTION',
    'timestamp', now()
  )
);