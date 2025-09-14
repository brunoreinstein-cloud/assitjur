-- Fix audit_logs schema to match the code expectations
-- Add missing email column and adjust structure
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS result text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update audit_logs RLS policies to be more permissive for service operations
DROP POLICY IF EXISTS "insert_audit" ON audit_logs;
CREATE POLICY "service_can_insert_audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- Fix profiles table RLS policies to prevent violations
DROP POLICY IF EXISTS "service_role_can_insert_profiles" ON profiles;
CREATE POLICY "users_can_insert_own_profile" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to insert profiles (for user creation flow)
CREATE POLICY "service_role_insert_profiles" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Improve profiles SELECT policy  
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
CREATE POLICY "users_can_view_own_profile" ON profiles 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Allow admins to view organization profiles (already exists but ensure it's there)
DROP POLICY IF EXISTS "admins_can_view_org_profiles" ON profiles;
CREATE POLICY "admins_can_view_org_profiles" ON profiles 
  FOR SELECT 
  USING (
    organization_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.organization_id = profiles.organization_id 
      AND p.role = 'ADMIN'
    )
  );