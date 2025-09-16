-- First drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_arpa_by_month_secure();
DROP FUNCTION IF EXISTS public.get_burn_runway_secure();
DROP FUNCTION IF EXISTS public.get_gross_margin_secure();

-- Create secure wrapper functions for financial views
CREATE OR REPLACE FUNCTION public.get_arpa_by_month_secure()
RETURNS TABLE(month date, arpa numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.arpa
  FROM public.v_arpa_by_month v
  WHERE public.has_financial_access();
$function$;

CREATE OR REPLACE FUNCTION public.get_burn_runway_secure()
RETURNS TABLE(month date, burn_rate numeric, runway_months integer)  
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.burn_rate, v.runway_months
  FROM public.v_burn_runway v
  WHERE public.has_financial_access();
$function$;

CREATE OR REPLACE FUNCTION public.get_gross_margin_secure()
RETURNS TABLE(month date, revenue numeric, cogs numeric, gross_margin numeric, margin_percentage numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.revenue, v.cogs, v.gross_margin, v.margin_percentage  
  FROM public.v_gross_margin v
  WHERE public.has_financial_access();
$function$;

-- Revoke public access to the original views
REVOKE ALL ON public.v_arpa_by_month FROM PUBLIC;
REVOKE ALL ON public.v_burn_runway FROM PUBLIC;  
REVOKE ALL ON public.v_gross_margin FROM PUBLIC;
REVOKE ALL ON public.v_mrr_by_month FROM PUBLIC;

-- Grant access only to authenticated users (will be further restricted by has_financial_access)
GRANT SELECT ON public.v_arpa_by_month TO authenticated;
GRANT SELECT ON public.v_burn_runway TO authenticated;
GRANT SELECT ON public.v_gross_margin TO authenticated; 
GRANT SELECT ON public.v_mrr_by_month TO authenticated;