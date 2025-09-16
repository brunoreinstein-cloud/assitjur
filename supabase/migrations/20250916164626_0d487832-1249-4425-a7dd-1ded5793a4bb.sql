-- Create secure wrapper functions with correct column names
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
RETURNS TABLE(month date, revenue numeric, cogs numeric, opex numeric, net_cash_flow numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT v.month, v.revenue, v.cogs, v.opex, v.net_cash_flow
  FROM public.v_burn_runway v
  WHERE public.has_financial_access();
$function$;

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

-- Revoke public access to financial views
REVOKE ALL ON public.v_arpa_by_month FROM PUBLIC;
REVOKE ALL ON public.v_burn_runway FROM PUBLIC;
REVOKE ALL ON public.v_gross_margin FROM PUBLIC;
REVOKE ALL ON public.v_mrr_by_month FROM PUBLIC;

-- Grant access only to authenticated users (restricted by has_financial_access function)
GRANT SELECT ON public.v_arpa_by_month TO authenticated;
GRANT SELECT ON public.v_burn_runway TO authenticated;
GRANT SELECT ON public.v_gross_margin TO authenticated;
GRANT SELECT ON public.v_mrr_by_month TO authenticated;

-- Add comprehensive audit logging
CREATE OR REPLACE FUNCTION public.audit_financial_data_access()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_user_action(
    'ACCESS_FINANCIAL_VIEW',
    TG_TABLE_NAME,
    null,
    jsonb_build_object(
      'view_accessed', TG_TABLE_NAME,
      'access_granted', public.has_financial_access(),
      'user_role', (SELECT role FROM profiles WHERE user_id = auth.uid()),
      'data_access_level', (SELECT data_access_level FROM profiles WHERE user_id = auth.uid()),
      'security_classification', 'HIGH_CONFIDENTIAL'
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';