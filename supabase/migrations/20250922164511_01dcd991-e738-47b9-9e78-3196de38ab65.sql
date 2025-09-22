-- Corrigir o problema de organização do usuário Bruno
-- Criar uma organização padrão se não existir e associar ao usuário

-- Inserir uma organização padrão se não existir
INSERT INTO organizations (name, code, domain, is_active) 
VALUES ('Organização Padrão', 'default-org', 'assistjur.com.br', true)
ON CONFLICT (code) DO NOTHING;

-- Atualizar o profile do usuário para ter uma organização
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations WHERE code = 'default-org'),
    role = 'ADMIN',
    data_access_level = 'FULL',
    updated_at = now()
WHERE user_id = '9d9e2497-9826-4c71-914e-d1f3c1ac7b2b' 
  AND organization_id IS NULL;