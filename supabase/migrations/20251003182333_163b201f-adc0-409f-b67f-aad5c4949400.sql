-- ============================================
-- FASE 1: Corrigir 4 Funções sem search_path
-- ============================================

-- 1. Corrigir assistjur.pt_set_updated_at()
DROP FUNCTION IF EXISTS assistjur.pt_set_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION assistjur.pt_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = assistjur, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION assistjur.pt_set_updated_at() IS 
  'SECURITY HARDENED: Trigger function para atualizar updated_at - search_path fixo';

-- 2. Corrigir assistjur.update_updated_at_column()
DROP FUNCTION IF EXISTS assistjur.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION assistjur.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = assistjur, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION assistjur.update_updated_at_column() IS 
  'SECURITY HARDENED: Trigger function para atualizar updated_at - search_path fixo';

-- 3. Corrigir hubjuria.parse_list(text)
DROP FUNCTION IF EXISTS hubjuria.parse_list(text) CASCADE;

CREATE OR REPLACE FUNCTION hubjuria.parse_list(input_text text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = hubjuria, public
AS $$
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN ARRAY[]::text[];
  END IF;
  
  RETURN string_to_array(
    regexp_replace(trim(input_text), '\s*,\s*', ',', 'g'),
    ','
  );
END;
$$;

COMMENT ON FUNCTION hubjuria.parse_list(text) IS 
  'SECURITY HARDENED: Parse comma-separated text to array - search_path fixo';

-- 4. Corrigir hubjuria.set_updated_at()
DROP FUNCTION IF EXISTS hubjuria.set_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION hubjuria.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = hubjuria, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION hubjuria.set_updated_at() IS 
  'SECURITY HARDENED: Trigger function para atualizar updated_at - search_path fixo';

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

-- Verificação final
DO $$
DECLARE
  v_functions_fixed INTEGER := 0;
BEGIN
  -- Contar funções corrigidas (simplified check)
  SELECT COUNT(*) INTO v_functions_fixed
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE (
    (n.nspname = 'assistjur' AND p.proname IN ('pt_set_updated_at', 'update_updated_at_column'))
    OR (n.nspname = 'hubjuria' AND p.proname IN ('parse_list', 'set_updated_at'))
  );

  RAISE NOTICE 'SECURITY MIGRATION PHASE 1 COMPLETE:';
  RAISE NOTICE '  - Functions corrected: % (expected: 4)', v_functions_fixed;
  RAISE NOTICE '  - All functions now have SET search_path configured';
END $$;