-- Fix audit_logs constraint - allow 'login' action
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- Add proper check constraint for audit_logs actions
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check 
CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'signup', 'password_reset', 'profile_access', 'data_export', 'data_import', 'LOGIN_ATTEMPT', 'ACCEPT_INVITATION', 'SOFT_DELETE_ALL_PROCESSOS', 'HARD_DELETE_ALL_PROCESSOS', 'RESTORE_ALL_PROCESSOS', 'CLEANUP_DERIVED_DATA', 'ACCESS_PROFILE', 'DELETE_ALL_PROCESSOS'));

-- Fix infinite recursion in profiles RLS policies by removing problematic policies
DROP POLICY IF EXISTS "admins_can_view_org_profiles" ON public.profiles;

-- Create a simple, non-recursive policy for profiles
CREATE POLICY "profiles_simple_access" ON public.profiles 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  auth.role() = 'service_role'
);

-- Create security definer function for admin checks without recursion
CREATE OR REPLACE FUNCTION public.is_admin_simple(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = check_user_id 
    AND p.role = 'ADMIN' 
    AND p.is_active = true
  );
$$;