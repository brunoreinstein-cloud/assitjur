-- Create demo organizations
INSERT INTO public.organizations (id, code, name, is_active) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'DEMO001', 'Escritório Demo Principal', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'DEMO002', 'Advocacia Demo & Associados', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'DEMO003', 'Consultoria Jurídica Demo', true);

-- Note: Demo users will need to be created through the signup process
-- The following emails can be used for demo purposes:
-- admin@demo.com - Should be assigned ADMIN role and organization DEMO001
-- analyst@demo.com - Should be assigned ANALYST role and organization DEMO001  
-- viewer@demo.com - Should be assigned VIEWER role and organization DEMO001