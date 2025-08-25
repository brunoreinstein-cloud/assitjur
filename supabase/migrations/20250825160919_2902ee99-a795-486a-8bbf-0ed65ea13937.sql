-- Add encrypted_key column to openai_keys table
ALTER TABLE openai_keys ADD COLUMN IF NOT EXISTS encrypted_key text;

-- Update RLS policies to ensure proper RBAC
DROP POLICY IF EXISTS "Only admins can manage openai keys" ON openai_keys;
DROP POLICY IF EXISTS "Users can view their organization keys" ON openai_keys;

CREATE POLICY "Only admins can manage openai keys" 
ON openai_keys 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = openai_keys.org_id 
    AND p.role = 'ADMIN'::user_role
));

CREATE POLICY "Users can view their organization keys" 
ON openai_keys 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.user_id = auth.uid() 
    AND p.organization_id = openai_keys.org_id
));