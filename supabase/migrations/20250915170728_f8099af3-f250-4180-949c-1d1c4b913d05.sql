-- Drop insecure views and replace with proper security definer functions
-- This ensures financial data is only accessible to authorized users

-- Drop the insecure views
DROP VIEW IF EXISTS public.v_mrr_by_month_secure;
DROP VIEW IF EXISTS public.v_gross_margin_secure;
DROP VIEW IF EXISTS public.v_arpa_by_month_secure;
DROP VIEW IF EXISTS public.v_burn_runway_secure;

-- Create security definer functions that properly control access
CREATE OR REPLACE FUNCTION public.get_mrr_by_month_secure()
RETURNS TABLE(
  month date,
  revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.month, v.revenue
  FROM public.v_mrr_by_month v
  WHERE public.has_financial_access();
$$;

CREATE OR REPLACE FUNCTION public.get_gross_margin_secure()
RETURNS TABLE(
  month date,
  revenue numeric,
  cogs numeric,
  gm_pct numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.month, v.revenue, v.cogs, v.gm_pct
  FROM public.v_gross_margin v
  WHERE public.has_financial_access();
$$;

CREATE OR REPLACE FUNCTION public.get_arpa_by_month_secure()
RETURNS TABLE(
  month date,
  arpa numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.month, v.arpa
  FROM public.v_arpa_by_month v
  WHERE public.has_financial_access();
$$;

CREATE OR REPLACE FUNCTION public.get_burn_runway_secure()
RETURNS TABLE(
  month date,
  revenue numeric,
  cogs numeric,
  opex numeric,
  net_cash_flow numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.month, v.revenue, v.cogs, v.opex, v.net_cash_flow
  FROM public.v_burn_runway v
  WHERE public.has_financial_access();
$$;

-- Grant execute permissions only to authenticated users
REVOKE ALL ON FUNCTION public.get_mrr_by_month_secure() FROM public;
REVOKE ALL ON FUNCTION public.get_gross_margin_secure() FROM public;
REVOKE ALL ON FUNCTION public.get_arpa_by_month_secure() FROM public;
REVOKE ALL ON FUNCTION public.get_burn_runway_secure() FROM public;

GRANT EXECUTE ON FUNCTION public.get_mrr_by_month_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gross_margin_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_arpa_by_month_secure() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_burn_runway_secure() TO authenticated;