-- Create security definer functions to properly control access to financial views
-- This ensures only authorized users can access sensitive business metrics

-- Function to check if user has financial data access
CREATE OR REPLACE FUNCTION public.has_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Only service role and admin users with FULL data access can view financial data
  SELECT 
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
        AND p.role = 'ADMIN' 
        AND p.data_access_level = 'FULL'
        AND p.is_active = true
    );
$$;

-- Create secure wrapper views that check permissions
CREATE OR REPLACE VIEW public.v_mrr_by_month_secure 
WITH (security_invoker=true) AS
SELECT *
FROM public.v_mrr_by_month
WHERE public.has_financial_access();

CREATE OR REPLACE VIEW public.v_gross_margin_secure 
WITH (security_invoker=true) AS
SELECT *
FROM public.v_gross_margin  
WHERE public.has_financial_access();

CREATE OR REPLACE VIEW public.v_arpa_by_month_secure 
WITH (security_invoker=true) AS
SELECT *
FROM public.v_arpa_by_month
WHERE public.has_financial_access();

CREATE OR REPLACE VIEW public.v_burn_runway_secure 
WITH (security_invoker=true) AS  
SELECT *
FROM public.v_burn_runway
WHERE public.has_financial_access();

-- Grant usage to authenticated users for the secure views
GRANT SELECT ON public.v_mrr_by_month_secure TO authenticated;
GRANT SELECT ON public.v_gross_margin_secure TO authenticated;
GRANT SELECT ON public.v_arpa_by_month_secure TO authenticated;
GRANT SELECT ON public.v_burn_runway_secure TO authenticated;