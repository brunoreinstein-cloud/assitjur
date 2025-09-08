-- Fix security vulnerability in beta_signups table
-- Update existing policies to be more restrictive

-- Update the SELECT policy to require FULL access level (super admin)
DROP POLICY IF EXISTS "Only admins can view beta signups" ON public.beta_signups;
CREATE POLICY "Only super admins can view beta signups" 
ON public.beta_signups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'ADMIN'::user_role
      AND p.is_active = true
      AND p.data_access_level = 'FULL'::data_access_level
  )
);

-- Update INSERT policy to only allow service role (for beta-signup edge function)
DROP POLICY IF EXISTS "Restricted beta signup creation" ON public.beta_signups;
CREATE POLICY "Service role only can insert beta signups"
ON public.beta_signups
FOR INSERT  
WITH CHECK (auth.role() = 'service_role');

-- Update UPDATE policy to require FULL access level
DROP POLICY IF EXISTS "Only admins can update beta signups" ON public.beta_signups;
CREATE POLICY "Only super admins can update beta signups"
ON public.beta_signups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'ADMIN'::user_role
      AND p.is_active = true
      AND p.data_access_level = 'FULL'::data_access_level
  )
);

-- Update DELETE policy to require FULL access level
DROP POLICY IF EXISTS "Only admins can delete beta signups" ON public.beta_signups;
CREATE POLICY "Only super admins can delete beta signups"
ON public.beta_signups  
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
      AND p.role = 'ADMIN'::user_role
      AND p.is_active = true
      AND p.data_access_level = 'FULL'::data_access_level
  )
);