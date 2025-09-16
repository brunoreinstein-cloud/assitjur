-- Enable RLS on critical financial views
ALTER VIEW public.v_mrr_by_month SET (security_barrier = true);
ALTER VIEW public.v_arpa_by_month SET (security_barrier = true);
ALTER VIEW public.v_burn_runway SET (security_barrier = true);
ALTER VIEW public.v_gross_margin SET (security_barrier = true);

-- Create RLS policies for financial data views - restrict to super admins with financial access
CREATE POLICY "Financial data access restricted to super admins"
ON public.v_mrr_by_month FOR SELECT
USING (public.has_financial_access());

CREATE POLICY "Financial data access restricted to super admins" 
ON public.v_arpa_by_month FOR SELECT
USING (public.has_financial_access());

CREATE POLICY "Financial data access restricted to super admins"
ON public.v_burn_runway FOR SELECT  
USING (public.has_financial_access());

CREATE POLICY "Financial data access restricted to super admins"
ON public.v_gross_margin FOR SELECT
USING (public.has_financial_access());

-- Add audit logging for financial data access
CREATE OR REPLACE FUNCTION public.audit_financial_view_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log financial data access for compliance
  PERFORM log_user_action(
    'ACCESS_FINANCIAL_DATA',
    TG_TABLE_NAME,
    null,
    jsonb_build_object(
      'view_name', TG_TABLE_NAME,
      'user_role', (SELECT role FROM profiles WHERE user_id = auth.uid()),
      'access_level', (SELECT data_access_level FROM profiles WHERE user_id = auth.uid()),
      'security_context', 'FINANCIAL_DATA_ACCESS'
    )
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';