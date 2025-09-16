-- Fix security vulnerability: Protect financial data views with RLS policies
-- These views contain sensitive business metrics and need proper access control

-- Enable RLS on all financial reporting views
ALTER TABLE v_arpa_by_month ENABLE ROW LEVEL SECURITY;
ALTER TABLE v_burn_runway ENABLE ROW LEVEL SECURITY;  
ALTER TABLE v_gross_margin ENABLE ROW LEVEL SECURITY;
ALTER TABLE v_mrr_by_month ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for financial data views
-- Only users with financial access (ADMIN role + FULL data access level) can view

CREATE POLICY "Financial data: ARPA access restricted to authorized users"
ON v_arpa_by_month
FOR SELECT
USING (has_financial_access());

CREATE POLICY "Financial data: Burn/runway access restricted to authorized users"  
ON v_burn_runway
FOR SELECT
USING (has_financial_access());

CREATE POLICY "Financial data: Gross margin access restricted to authorized users"
ON v_gross_margin  
FOR SELECT
USING (has_financial_access());

CREATE POLICY "Financial data: MRR access restricted to authorized users"
ON v_mrr_by_month
FOR SELECT  
USING (has_financial_access());

-- Add audit logging for financial data access attempts
CREATE OR REPLACE FUNCTION log_financial_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone accesses financial views
  PERFORM log_user_action(
    'FINANCIAL_DATA_ACCESS',
    TG_TABLE_NAME,
    NULL,
    jsonb_build_object(
      'view_name', TG_TABLE_NAME,
      'access_timestamp', now(),
      'user_has_financial_access', has_financial_access()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Note: Triggers on views require INSTEAD OF triggers, but since these are 
-- read-only views, we'll rely on the existing audit system in the functions
-- that call these views (like get_mrr_by_month_secure)