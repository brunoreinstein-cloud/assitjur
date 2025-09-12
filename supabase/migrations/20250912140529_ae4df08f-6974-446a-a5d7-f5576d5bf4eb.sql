-- Fix critical infinite recursion in profiles RLS policies
-- This is causing the "infinite recursion detected in policy for relation profiles" error

-- First, drop all existing problematic policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "users_can_view_own_profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role needs to insert profiles during signup
CREATE POLICY "service_role_can_insert_profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Create helper functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS public.profiles
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.* FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_simple(check_org_id uuid)
RETURNS boolean
LANGUAGE SQL  
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = check_org_id 
    AND p.role = 'ADMIN'
    AND p.is_active = true
  );
$$;

-- Allow admins to view profiles in their organization (non-recursive)
CREATE POLICY "admins_can_view_org_profiles" 
ON public.profiles 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND public.is_org_admin_simple(organization_id)
);

-- Fix a few critical tables that definitely exist and need basic RLS

-- Legal cases table (has org_id column)
CREATE POLICY "users_can_access_org_legal_cases" 
ON public.legal_cases 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = legal_cases.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.organization_id = legal_cases.org_id
  )
);

-- Rate limits enhanced table (has user_id column)
CREATE POLICY "users_can_manage_own_rate_limits" 
ON public.rate_limits_enhanced 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);