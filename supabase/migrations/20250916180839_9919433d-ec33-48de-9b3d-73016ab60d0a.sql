-- Fix security vulnerability: Create secure wrapper functions for financial views
-- Views cannot have RLS policies, so we create SECURITY DEFINER functions instead

-- Secure wrapper for v_arpa_by_month view
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

-- Secure wrapper for v_burn_runway view  
CREATE OR REPLACE FUNCTION public.get_burn_runway_secure()
RETURNS TABLE(month date, revenue numeric, cogs numeric, opex numeric, net_cash_flow numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.revenue, v.cogs, v.opex, v.net_cash_flow
  FROM public.v_burn_runway v
  WHERE public.has_financial_access();
$function$;

-- Secure wrapper for v_gross_margin view
CREATE OR REPLACE FUNCTION public.get_gross_margin_secure()
RETURNS TABLE(month date, revenue numeric, cogs numeric, gm_pct numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.revenue, v.cogs, v.gm_pct
  FROM public.v_gross_margin v
  WHERE public.has_financial_access();
$function$;

-- Note: get_mrr_by_month_secure() already exists and follows this pattern

-- Add comprehensive comment explaining the security model
COMMENT ON FUNCTION public.get_arpa_by_month_secure() IS 'Secure access to ARPA financial data. Only users with financial access (ADMIN role + FULL data access level) can retrieve this data.';
COMMENT ON FUNCTION public.get_burn_runway_secure() IS 'Secure access to burn rate and runway financial data. Only users with financial access (ADMIN role + FULL data access level) can retrieve this data.';
COMMENT ON FUNCTION public.get_gross_margin_secure() IS 'Secure access to gross margin financial data. Only users with financial access (ADMIN role + FULL data access level) can retrieve this data.';

-- Create a helper function to get all financial data securely in one call (optional convenience function)
CREATE OR REPLACE FUNCTION public.get_financial_dashboard_secure()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.has_financial_access() THEN
      jsonb_build_object(
        'mrr_data', (SELECT jsonb_agg(row_to_json(t)) FROM public.get_mrr_by_month_secure() t),
        'arpa_data', (SELECT jsonb_agg(row_to_json(t)) FROM public.get_arpa_by_month_secure() t),
        'margin_data', (SELECT jsonb_agg(row_to_json(t)) FROM public.get_gross_margin_secure() t),
        'burn_data', (SELECT jsonb_agg(row_to_json(t)) FROM public.get_burn_runway_secure() t)
      )
    ELSE NULL
  END;
$function$;