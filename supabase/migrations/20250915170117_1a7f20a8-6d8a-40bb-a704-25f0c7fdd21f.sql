-- Secure financial views by enabling RLS and restricting access
-- These views contain sensitive business metrics like revenue, costs, and cash flow

-- Enable RLS on financial views
ALTER VIEW public.v_arpa_by_month SET (security_barrier = true);
ALTER VIEW public.v_burn_runway SET (security_barrier = true); 
ALTER VIEW public.v_gross_margin SET (security_barrier = true);
ALTER VIEW public.v_mrr_by_month SET (security_barrier = true);

-- Create RLS policies to restrict access to service role only
-- This matches the security model of the underlying tables

CREATE POLICY "Financial data - service role only" 
ON public.v_arpa_by_month 
FOR ALL 
TO public 
USING (auth.role() = 'service_role');

CREATE POLICY "Financial data - service role only" 
ON public.v_burn_runway 
FOR ALL 
TO public 
USING (auth.role() = 'service_role');

CREATE POLICY "Financial data - service role only" 
ON public.v_gross_margin 
FOR ALL 
TO public 
USING (auth.role() = 'service_role');

CREATE POLICY "Financial data - service role only" 
ON public.v_mrr_by_month 
FOR ALL 
TO public 
USING (auth.role() = 'service_role');

-- Enable RLS on the views (this must be done after creating policies)
ALTER VIEW public.v_arpa_by_month ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.v_burn_runway ENABLE ROW LEVEL SECURITY;
ALTER VIEW public.v_gross_margin ENABLE ROW LEVEL SECURITY; 
ALTER VIEW public.v_mrr_by_month ENABLE ROW LEVEL SECURITY;