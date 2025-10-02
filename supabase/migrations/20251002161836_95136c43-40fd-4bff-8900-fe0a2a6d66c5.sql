-- ============================================================================
-- ETAPA 2: Remover Fallbacks Temporários de profiles.role
-- ============================================================================
-- Issue: SEC-101 | Finalizar migração para members como fonte única
-- Author: Security Team
-- Date: 2025-10-02
-- ============================================================================

-- 2.1. Remover trigger de sincronização temporário (após 48h de testes)
DROP TRIGGER IF EXISTS sync_profile_role ON profiles;
DROP FUNCTION IF EXISTS sync_profile_role_to_members();

-- 2.2. Adicionar comentário de deprecação na coluna profiles.role
COMMENT ON COLUMN profiles.role IS 
'[DEPRECATED] Esta coluna será removida em 7 dias. Use members.role como fonte de verdade.';

-- 2.3. Criar índice para otimizar queries de role
CREATE INDEX IF NOT EXISTS idx_members_role_lookup 
ON members(user_id, org_id, status) 
WHERE status = 'active';

-- 2.4. Validar consistência entre profiles e members
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM profiles p
  LEFT JOIN members m ON m.user_id = p.user_id 
    AND m.org_id = p.organization_id 
    AND m.status = 'active'
  WHERE p.organization_id IS NOT NULL 
    AND m.role IS NULL;
  
  IF inconsistent_count > 0 THEN
    RAISE WARNING 'Found % profiles without corresponding members record', inconsistent_count;
  END IF;
END $$;

-- 2.5. Atualizar comentário da tabela members
COMMENT ON TABLE members IS 
'[PRIMARY] Fonte única de verdade para roles de usuários. Substitui profiles.role (deprecated).';