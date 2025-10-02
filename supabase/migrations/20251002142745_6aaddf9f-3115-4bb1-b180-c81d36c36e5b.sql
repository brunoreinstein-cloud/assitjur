-- Drop existing problematic policies on members table
DROP POLICY IF EXISTS "Admins can manage members in their organization" ON members;
DROP POLICY IF EXISTS "Users can view members of their organization" ON members;

-- Create security definer helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_org(user_uuid uuid, org_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = user_uuid
      AND org_id = org_uuid
      AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_org(user_uuid uuid, org_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.members
  WHERE user_id = user_uuid
    AND org_id = org_uuid
    AND status = 'active'
  LIMIT 1
$$;

-- Recreate policies using the helper functions to avoid recursion
CREATE POLICY "Users can view members of their organization"
ON public.members
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) 
  OR is_member_of_org(auth.uid(), org_id)
);

CREATE POLICY "Admins can manage members in their organization"
ON public.members
FOR ALL
TO authenticated
USING (
  is_super_admin(auth.uid())
  OR get_user_role_in_org(auth.uid(), org_id) = 'ADMIN'
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR get_user_role_in_org(auth.uid(), org_id) = 'ADMIN'
);