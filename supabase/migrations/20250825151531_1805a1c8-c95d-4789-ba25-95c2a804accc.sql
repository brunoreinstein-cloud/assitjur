-- Create demo users and their profiles
-- Note: This uses Supabase's admin functions to create users

-- Create admin user
DO $$ 
DECLARE
  admin_user_id uuid;
  analyst_user_id uuid;
  viewer_user_id uuid;
BEGIN
  -- We'll create placeholder profiles that will be updated when users actually sign up
  -- This ensures the demo organization has the expected user structure
  
  -- Insert demo profiles for expected users
  INSERT INTO public.profiles (
    id, 
    user_id, 
    email, 
    role, 
    organization_id, 
    is_active,
    terms_accepted_at
  ) VALUES 
  (
    gen_random_uuid(),
    gen_random_uuid(), -- This will be updated when user actually signs up
    'admin@demo.com',
    'ADMIN',
    '550e8400-e29b-41d4-a716-446655440001', -- DEMO001 organization
    true,
    now()
  ),
  (
    gen_random_uuid(),
    gen_random_uuid(), -- This will be updated when user actually signs up  
    'analyst@demo.com',
    'ANALYST',
    '550e8400-e29b-41d4-a716-446655440001', -- DEMO001 organization
    true,
    now()
  ),
  (
    gen_random_uuid(),
    gen_random_uuid(), -- This will be updated when user actually signs up
    'viewer@demo.com', 
    'VIEWER',
    '550e8400-e29b-41d4-a716-446655440001', -- DEMO001 organization
    true,
    now()
  );
END $$;