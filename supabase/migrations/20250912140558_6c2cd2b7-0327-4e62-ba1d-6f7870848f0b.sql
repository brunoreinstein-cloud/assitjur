-- Fix critical infinite recursion in profiles RLS policies
-- Remove ALL existing policies first, then create new ones

-- Drop ALL existing policies on profiles table
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT pol.polname 
        FROM pg_policy pol 
        JOIN pg_class pc ON pol.polrelid = pc.oid 
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid 
        WHERE pn.nspname = 'public' AND pc.relname = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_name);
    END LOOP;
END $$;

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