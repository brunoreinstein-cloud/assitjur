-- ============================================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- Issues: 1 (Privilege Escalation), 2 (Financial Data), 3 (Injection), 4 (2FA)
-- ============================================================

-- ============================================================
-- ISSUE 1: FIX PRIVILEGE ESCALATION - Separate user_roles table
-- ============================================================

-- Step 1: Create enum for roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');

-- Step 2: Create dedicated user_roles table (NO user access, only service_role)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, organization_id, role)
);

-- Step 3: Enable RLS with ONLY service_role access
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- Step 4: Create security definer function for safe role checks
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role app_role,
  _org_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND organization_id = _org_id
  )
$$;

-- Step 5: Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _org_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND organization_id = _org_id
  LIMIT 1
$$;

-- Step 6: Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role, organization_id, granted_at)
SELECT 
  user_id,
  CASE 
    WHEN role = 'ADMIN'::user_role THEN 'ADMIN'::app_role
    WHEN role = 'ANALYST'::user_role THEN 'ANALYST'::app_role
    ELSE 'VIEWER'::app_role
  END,
  organization_id,
  created_at
FROM public.profiles
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id, role) DO NOTHING;

-- Step 7: Update critical RLS policies to use has_role()
-- Fix profiles RLS to prevent self-escalation
DROP POLICY IF EXISTS "profiles_ultra_secure" ON public.profiles;

CREATE POLICY "profiles_read_own"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own_safe"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Can update own profile but NOT role/org fields
  auth.uid() = user_id 
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
  AND organization_id = (SELECT organization_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "profiles_service_role_full"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Fix processos RLS
DROP POLICY IF EXISTS "processos_strict_org_isolation" ON public.processos;

CREATE POLICY "processos_org_access"
ON public.processos
FOR ALL
USING (
  deleted_at IS NULL 
  AND (
    public.has_role(auth.uid(), 'ADMIN'::app_role, org_id)
    OR public.has_role(auth.uid(), 'ANALYST'::app_role, org_id)
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.organization_id = processos.org_id
        AND p.is_active = true
        AND p.data_access_level IN ('FULL', 'MASKED')
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'ADMIN'::app_role, org_id)
);

-- Fix pessoas RLS
DROP POLICY IF EXISTS "pessoas_strict_org_isolation" ON public.pessoas;

CREATE POLICY "pessoas_org_access"
ON public.pessoas
FOR ALL
USING (
  public.has_role(auth.uid(), 'ADMIN'::app_role, org_id)
  OR public.has_role(auth.uid(), 'ANALYST'::app_role, org_id)
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.organization_id = pessoas.org_id
      AND p.is_active = true
      AND p.data_access_level IN ('FULL', 'MASKED')
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'ADMIN'::app_role, org_id)
);

-- ============================================================
-- ISSUE 2: FIX FINANCIAL DATA EXPOSURE - Add RLS to views
-- ============================================================

-- Financial views must have RLS policies (create policies on base tables)
-- Since views inherit RLS from base tables, we ensure invoices table has proper RLS

DROP POLICY IF EXISTS "invoices_ultra_secure" ON public.invoices;

CREATE POLICY "invoices_admin_only"
ON public.invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'::app_role
      AND p.data_access_level = 'FULL'
      AND p.is_active = true
  )
  OR auth.role() = 'service_role'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'::app_role
      AND p.data_access_level = 'FULL'
      AND p.is_active = true
  )
  OR auth.role() = 'service_role'
);

-- Also fix cogs_monthly and opex_monthly
DROP POLICY IF EXISTS "Enhanced financial data protection for cogs" ON public.cogs_monthly;
DROP POLICY IF EXISTS "financial_data_corporate_only" ON public.cogs_monthly;

CREATE POLICY "cogs_admin_only"
ON public.cogs_monthly
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'::app_role
      AND p.data_access_level = 'FULL'
      AND p.is_active = true
  )
  OR auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "opex_data_corporate_only" ON public.opex_monthly;

CREATE POLICY "opex_admin_only"
ON public.opex_monthly
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'ADMIN'::app_role
      AND p.data_access_level = 'FULL'
      AND p.is_active = true
  )
  OR auth.role() = 'service_role'
);

-- ============================================================
-- ISSUE 3: FIX SEARCH_PATH INJECTION
-- ============================================================

-- Fix vulnerable functions by adding SET search_path = public
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = check_user_id 
    AND role = 'ADMIN'::app_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_data_access(
  p_table_name text, 
  p_record_ids uuid[] DEFAULT NULL::uuid[], 
  p_access_type text DEFAULT 'SELECT'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO user_profile FROM profiles WHERE user_id = auth.uid();
  
  IF user_profile IS NOT NULL THEN
    INSERT INTO data_access_logs (
      org_id, user_id, accessed_table, accessed_records, access_type, ip_address, user_agent
    ) VALUES (
      user_profile.organization_id, auth.uid(), p_table_name, p_record_ids, p_access_type,
      inet '127.0.0.1', 'AssistJur-App'
    );
  END IF;
END;
$function$;

-- Update has_financial_access to use new user_roles table
CREATE OR REPLACE FUNCTION public.has_financial_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'ADMIN'::app_role
      AND p.data_access_level = 'FULL'
      AND p.is_active = true
  );
$function$;

-- ============================================================
-- ISSUE 4: 2FA BYPASS PREVENTION
-- ============================================================

-- Create table to track MFA status server-side (not in sessionStorage)
CREATE TABLE IF NOT EXISTS public.user_mfa_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_mfa_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA status"
ON public.user_mfa_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages MFA status"
ON public.user_mfa_status
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create function to verify MFA requirement
CREATE OR REPLACE FUNCTION public.requires_mfa_verification()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT require_2fa FROM organizations o
     JOIN profiles p ON p.organization_id = o.id
     WHERE p.user_id = auth.uid()
     LIMIT 1),
    false
  );
$$;