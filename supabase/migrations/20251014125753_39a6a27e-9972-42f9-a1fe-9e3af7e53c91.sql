-- Corrigir view openai_keys_safe - remover security definer
DROP VIEW IF EXISTS openai_keys_safe;

-- Criar view sem security definer (consulta normal com RLS)
CREATE VIEW openai_keys_safe 
WITH (security_invoker=true)
AS
SELECT 
  id, org_id, alias, last_four, is_active,
  last_used_at, created_by, created_at, updated_at
FROM openai_keys;

COMMENT ON VIEW openai_keys_safe IS 'View segura de openai_keys sem expor encrypted_key';