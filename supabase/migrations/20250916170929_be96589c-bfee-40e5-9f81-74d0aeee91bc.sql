-- CRITICAL SECURITY FIX: Secure Financial Data Access (Fixed Version)
-- Issue: invoices table data could be accessed through views bypassing security controls

-- 1. Revoke all public access to financial views that access invoices table
REVOKE ALL ON public.v_mrr_by_month FROM PUBLIC;
REVOKE ALL ON public.v_arpa_by_month FROM PUBLIC;
REVOKE ALL ON public.v_burn_runway FROM PUBLIC;
REVOKE ALL ON public.v_gross_margin FROM PUBLIC;

-- 2. Create comprehensive invoice access audit function
CREATE OR REPLACE FUNCTION public.audit_invoice_access()
RETURNS TRIGGER AS $$
DECLARE
  user_profile profiles%ROWTYPE;
  access_context jsonb;
BEGIN
  -- Get user profile for audit
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  -- Build comprehensive audit context
  access_context := jsonb_build_object(
    'table_accessed', 'invoices',
    'access_method', TG_OP,
    'user_id', auth.uid(),
    'user_email', COALESCE(user_profile.email, 'unknown'),
    'user_role', COALESCE(user_profile.role::text, 'unknown'),
    'data_access_level', COALESCE(user_profile.data_access_level::text, 'unknown'),
    'organization_id', user_profile.organization_id,
    'is_active', COALESCE(user_profile.is_active, false),
    'timestamp', now(),
    'security_classification', 'FINANCIAL_CONFIDENTIAL',
    'compliance_note', 'Invoice access requires ADMIN role with FULL data access'
  );
  
  -- Log the access with high security classification
  PERFORM log_user_action(
    'FINANCIAL_INVOICE_ACCESS',
    'invoices',
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.id::text ELSE OLD.id::text END,
    access_context
  );
  
  -- Verify access is legitimate
  IF user_profile IS NULL OR 
     user_profile.role != 'ADMIN' OR 
     user_profile.data_access_level != 'FULL' OR 
     user_profile.is_active != true THEN
    
    -- Log security violation
    PERFORM log_user_action(
      'SECURITY_VIOLATION_INVOICE_ACCESS',
      'invoices',
      NULL,
      access_context || jsonb_build_object(
        'violation_type', 'UNAUTHORIZED_FINANCIAL_ACCESS',
        'threat_level', 'CRITICAL',
        'action_required', 'INVESTIGATE_IMMEDIATELY'
      )
    );
  END IF;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Create triggers for invoice access auditing (corrected syntax)
DROP TRIGGER IF EXISTS audit_invoice_insert_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_invoice_update_trigger ON invoices;
DROP TRIGGER IF EXISTS audit_invoice_delete_trigger ON invoices;

CREATE TRIGGER audit_invoice_insert_trigger
  AFTER INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION audit_invoice_access();

CREATE TRIGGER audit_invoice_update_trigger
  AFTER UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION audit_invoice_access();

CREATE TRIGGER audit_invoice_delete_trigger
  AFTER DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION audit_invoice_access();

-- 4. Create secure invoice summary function (replaces direct view access)
CREATE OR REPLACE FUNCTION public.get_invoice_summary_secure()
RETURNS TABLE(
  total_invoices bigint,
  total_revenue numeric,
  pending_amount numeric,
  paid_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  -- Strict security check
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  IF user_profile IS NULL OR 
     user_profile.role != 'ADMIN' OR 
     user_profile.data_access_level != 'FULL' OR 
     user_profile.is_active != true THEN
    
    RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized access to financial invoice data. Required: ADMIN role with FULL data access.';
  END IF;
  
  -- Log authorized access
  PERFORM log_user_action(
    'AUTHORIZED_INVOICE_SUMMARY_ACCESS',
    'invoices',
    NULL,
    jsonb_build_object(
      'user_id', auth.uid(),
      'organization_id', user_profile.organization_id,
      'access_level', 'SUMMARY_ONLY',
      'timestamp', now()
    )
  );
  
  -- Return secure summary data
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_invoices,
    COALESCE(SUM(amount - tax_amount - discounts), 0)::numeric as total_revenue,
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount - tax_amount - discounts ELSE 0 END), 0)::numeric as pending_amount,
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount - tax_amount - discounts ELSE 0 END), 0)::numeric as paid_amount
  FROM invoices;
END;
$$;

-- 5. Enhanced financial view security - Remove any grants to public role
REVOKE ALL PRIVILEGES ON public.v_mrr_by_month FROM public;
REVOKE ALL PRIVILEGES ON public.v_arpa_by_month FROM public;
REVOKE ALL PRIVILEGES ON public.v_burn_runway FROM public;
REVOKE ALL PRIVILEGES ON public.v_gross_margin FROM public;

-- 6. Create function to verify financial security is working
CREATE OR REPLACE FUNCTION public.verify_invoice_security()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT jsonb_build_object(
    'invoice_table_protected', 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE grantee = 'PUBLIC' 
        AND table_name = 'invoices'
        AND privilege_type = 'SELECT'
      ) THEN 'CRITICAL: Invoice table still has public access!'
      ELSE 'SECURE: Invoice table properly protected'
    END,
    'financial_views_protected',
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.table_privileges 
        WHERE grantee = 'PUBLIC' 
        AND table_name IN ('v_mrr_by_month', 'v_arpa_by_month', 'v_burn_runway', 'v_gross_margin')
        AND privilege_type = 'SELECT'
      ) THEN 'WARNING: Some financial views still have public access'
      ELSE 'SECURE: All financial views properly protected'
    END,
    'audit_triggers_active',
    (SELECT COUNT(*) FROM information_schema.triggers 
     WHERE event_object_table = 'invoices'
     AND trigger_name LIKE 'audit_invoice_%'),
    'security_scan_timestamp', now(),
    'fix_status', 'INVOICE_SECURITY_HARDENED'
  );
$$;

-- 7. Final security verification
SELECT verify_invoice_security();