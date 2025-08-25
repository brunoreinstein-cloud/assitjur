-- Fix RLS policies for openai_keys table
DROP POLICY IF EXISTS "Only admins can manage openai keys" ON public.openai_keys;
DROP POLICY IF EXISTS "Users can view their organization keys" ON public.openai_keys;

-- Create comprehensive policies for openai_keys
CREATE POLICY "Admins can view organization keys" 
ON public.openai_keys 
FOR SELECT 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = openai_keys.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Admins can insert organization keys" 
ON public.openai_keys 
FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = openai_keys.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Admins can update organization keys" 
ON public.openai_keys 
FOR UPDATE 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = openai_keys.org_id 
  AND p.role = 'ADMIN'
));

CREATE POLICY "Admins can delete organization keys" 
ON public.openai_keys 
FOR DELETE 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.organization_id = openai_keys.org_id 
  AND p.role = 'ADMIN'
));

-- Also ensure the function can bypass RLS by using service role
CREATE POLICY "Service role full access" 
ON public.openai_keys 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);