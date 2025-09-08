-- Fix security vulnerability in beta_signups table
-- Ensure only admins can view/modify beta signups and tighten access controls

-- Drop existing policies to recreate them with stricter controls
DROP POLICY IF EXISTS "Only admins can view beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Only admins can update beta signups" ON public.beta_signups;  
DROP POLICY IF EXISTS "Only admins can delete beta signups" ON public.beta_signups;
DROP POLICY IF EXISTS "Restricted beta signup creation" ON public.beta_signups;

-- Create more secure policies
-- Only super admins can view beta signups (stricter than before)
CREATE POLICY "Super admins only can view beta signups" 
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

-- Only super admins can update beta signups  
CREATE POLICY "Super admins only can update beta signups"
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

-- Only super admins can delete beta signups
CREATE POLICY "Super admins only can delete beta signups"
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

-- Allow beta signup creation only via service role (for edge functions)
-- This prevents direct user access while allowing the beta-signup edge function to work
CREATE POLICY "Service role can insert beta signups"
ON public.beta_signups
FOR INSERT  
WITH CHECK (auth.role() = 'service_role');

-- Audit the change
INSERT INTO audit_logs (
  user_id, action, resource, result, metadata
) VALUES (
  auth.uid(), 
  'SECURITY_FIX_BETA_SIGNUPS', 
  'beta_signups', 
  'SUCCESS',
  '{"security_issue": "PUBLIC_USER_DATA", "fix": "Restricted RLS policies to super admins only"}'::jsonb
);