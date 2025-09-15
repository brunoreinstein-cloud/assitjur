-- Fix profiles RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "admins_can_view_org_profiles" ON public.profiles;
DROP POLICY IF EXISTS "service_role_insert_profiles" ON public.profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "users_can_view_own_profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "service_role_full_access" ON public.profiles
FOR ALL USING (auth.role() = 'service_role');

-- Create a simple security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = check_user_id 
    AND role = 'ADMIN' 
    AND is_active = true
  );
$$;

-- Policy for admins to view org profiles (using security definer function)
CREATE POLICY "admins_can_view_org_profiles" ON public.profiles
FOR SELECT USING (
  organization_id IS NOT NULL 
  AND is_admin_user(auth.uid())
  AND EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.organization_id = profiles.organization_id
  )
);