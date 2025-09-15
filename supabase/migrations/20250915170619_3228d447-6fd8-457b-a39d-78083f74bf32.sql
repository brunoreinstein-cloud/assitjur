-- Enable RLS on secure financial views and add proper access policies
-- This ensures the secure views are actually protected from unauthorized access

-- Enable RLS on all secure financial views
ALTER VIEW public.v_mrr_by_month_secure ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.v_gross_margin_secure ENABLE ROW LEVEL SECURITY; 
ALTER VIEW public.v_arpa_by_month_secure ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.v_burn_runway_secure ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that restrict access to authorized users only
CREATE POLICY "Secure financial access - authorized users only" 
ON public.v_mrr_by_month_secure 
FOR SELECT 
TO authenticated
USING (public.has_financial_access());

CREATE POLICY "Secure financial access - authorized users only" 
ON public.v_gross_margin_secure 
FOR SELECT 
TO authenticated  
USING (public.has_financial_access());

CREATE POLICY "Secure financial access - authorized users only" 
ON public.v_arpa_by_month_secure 
FOR SELECT 
TO authenticated
USING (public.has_financial_access());

CREATE POLICY "Secure financial access - authorized users only" 
ON public.v_burn_runway_secure 
FOR SELECT 
TO authenticated
USING (public.has_financial_access());

-- Revoke public access and grant only to authenticated users
REVOKE ALL ON public.v_mrr_by_month_secure FROM public;
REVOKE ALL ON public.v_gross_margin_secure FROM public;
REVOKE ALL ON public.v_arpa_by_month_secure FROM public;
REVOKE ALL ON public.v_burn_runway_secure FROM public;

-- Ensure service role retains full access
GRANT SELECT ON public.v_mrr_by_month_secure TO service_role;
GRANT SELECT ON public.v_gross_margin_secure TO service_role;
GRANT SELECT ON public.v_arpa_by_month_secure TO service_role;
GRANT SELECT ON public.v_burn_runway_secure TO service_role;