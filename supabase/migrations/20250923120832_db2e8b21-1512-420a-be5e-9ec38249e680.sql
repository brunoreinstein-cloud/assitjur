-- Atualizar o usuário bruno@dietwin.com.br para administrador
UPDATE profiles 
SET 
  role = 'ADMIN',
  data_access_level = 'FULL',
  is_active = true,
  updated_at = now()
WHERE email = 'bruno@dietwin.com.br';