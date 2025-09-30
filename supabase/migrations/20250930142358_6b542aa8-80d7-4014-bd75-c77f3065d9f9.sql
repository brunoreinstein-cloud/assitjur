-- ============================================
-- CORREÇÃO: Sincronizar memberships com profiles e ajustar org_ids
-- ============================================

-- 1. Criar membership para usuário atual
INSERT INTO public.memberships (user_id, org_id, role)
SELECT 
  p.user_id,
  p.organization_id,
  'admin' as role
FROM public.profiles p
WHERE p.user_id = '9d9e2497-9826-4c71-914e-d1f3c1ac7b2b'
  AND NOT EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = p.user_id
  );

-- 2. Atualizar org_id dos processos staging para o org_id correto
UPDATE assistjur.por_processo_staging
SET org_id = 'b5c91bd4-0c9e-42ad-bf77-b7dc68fd17d2'
WHERE org_id = '00000000-0000-0000-0000-000000000001';

-- 3. Remover dados duplicados com org_id incorreto em testemunhas
DELETE FROM assistjur.por_testemunha_staging
WHERE org_id = '11111111-1111-1111-1111-111111111111';

-- 4. Criar trigger para sincronizar memberships automaticamente
CREATE OR REPLACE FUNCTION public.sync_membership_on_profile_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um profile é criado, criar membership correspondente
  INSERT INTO public.memberships (user_id, org_id, role)
  VALUES (
    NEW.user_id,
    NEW.organization_id,
    CASE 
      WHEN NEW.role = 'ADMIN' THEN 'admin'
      ELSE 'member'
    END
  )
  ON CONFLICT (user_id, org_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS sync_membership_trigger ON public.profiles;
CREATE TRIGGER sync_membership_trigger
  AFTER INSERT OR UPDATE OF organization_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_membership_on_profile_create();

COMMENT ON FUNCTION public.sync_membership_on_profile_create() IS 
  'Sincroniza automaticamente memberships quando profiles são criados/atualizados';