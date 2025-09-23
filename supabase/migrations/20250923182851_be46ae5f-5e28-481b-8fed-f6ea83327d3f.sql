-- Correção imediata do org_id (versão corrigida)
-- 1. Criar organização padrão se não existir
INSERT INTO organizations (id, name, code, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AssistJur IA - Organização Principal', 
  'ASSISTJUR_MAIN',
  true,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Associar usuários órfãos à organização padrão
UPDATE profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid,
    updated_at = now()
WHERE organization_id IS NULL;

-- 3. Consolidar dados staging - mover tudo para org padrão
UPDATE assistjur.por_processo_staging 
SET org_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE org_id != '00000000-0000-0000-0000-000000000001'::uuid;

-- 4. Limpar duplicatas na staging (manter apenas um registro por cnj)
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY cnj ORDER BY created_at DESC) as rn
  FROM assistjur.por_processo_staging
  WHERE cnj IS NOT NULL AND trim(cnj) != ''
)
DELETE FROM assistjur.por_processo_staging 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 5. Consolidar dados na tabela final processos  
UPDATE processos 
SET org_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE org_id != '00000000-0000-0000-0000-000000000001'::uuid;

-- 6. Consolidar dados na tabela pessoas
UPDATE pessoas 
SET org_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE org_id != '00000000-0000-0000-0000-000000000001'::uuid;

-- 7. Criar função para verificar consistência
CREATE OR REPLACE FUNCTION public.verify_org_consistency()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'timestamp', now(),
    'users_without_org', (SELECT count(*) FROM profiles WHERE organization_id IS NULL),
    'staging_records_main_org', (SELECT count(*) FROM assistjur.por_processo_staging WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid),
    'processos_main_org', (SELECT count(*) FROM processos WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid AND deleted_at IS NULL),
    'pessoas_main_org', (SELECT count(*) FROM pessoas WHERE org_id = '00000000-0000-0000-0000-000000000001'::uuid),
    'total_orgs', (SELECT count(*) FROM organizations WHERE is_active = true),
    'main_org_exists', (SELECT EXISTS(SELECT 1 FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'::uuid)),
    'status', 'CONSISTENCY_CHECK_COMPLETE'
  );
$function$;