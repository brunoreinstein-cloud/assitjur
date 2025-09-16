-- Create secure wrapper functions for financial views
-- These replace direct access to the vulnerable views

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

-- Drop the vulnerable views to prevent direct access
DROP VIEW IF EXISTS public.v_arpa_by_month;
DROP VIEW IF EXISTS public.v_burn_runway; 
DROP VIEW IF EXISTS public.v_gross_margin;

-- Add audit logging for financial function access
CREATE OR REPLACE FUNCTION public.log_financial_access(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM log_user_action(
    'ACCESS_FINANCIAL_DATA',
    'financial_functions',
    null,
    jsonb_build_object(
      'function_name', function_name,
      'user_role', (SELECT role FROM profiles WHERE user_id = auth.uid()),
      'access_level', (SELECT data_access_level FROM profiles WHERE user_id = auth.uid()),
      'has_access', public.has_financial_access(),
      'security_context', 'FINANCIAL_DATA_ACCESS'
    )
  );
END;
$function$;