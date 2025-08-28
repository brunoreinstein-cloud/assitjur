-- RPCs para limpeza da base de dados

-- 1. Preview das alterações que serão feitas
CREATE OR REPLACE FUNCTION public.rpc_get_cleanup_preview(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb := '{}';
  v_invalid_cnjs integer;
  v_empty_reclamante integer;
  v_empty_reu integer;
  v_duplicates integer;
  v_soft_deleted integer;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Contar CNJs inválidos (não têm 20 dígitos ou são nulos)
  SELECT COUNT(*) INTO v_invalid_cnjs
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND (cnj_digits IS NULL OR length(cnj_digits) != 20 OR cnj_digits !~ '^[0-9]{20}$');

  -- Contar processos sem reclamante
  SELECT COUNT(*) INTO v_empty_reclamante
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND (reclamante_nome IS NULL OR trim(reclamante_nome) = '');

  -- Contar processos sem réu
  SELECT COUNT(*) INTO v_empty_reu
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND (reu_nome IS NULL OR trim(reu_nome) = '');

  -- Contar duplicatas (mesmo cnj_digits)
  SELECT COUNT(*) - COUNT(DISTINCT cnj_digits) INTO v_duplicates
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND cnj_digits IS NOT NULL
    AND length(cnj_digits) = 20;

  -- Contar soft deletes antigos (mais de 30 dias)
  SELECT COUNT(*) INTO v_soft_deleted
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days';

  -- Montar resultado
  v_result := jsonb_build_object(
    'invalid_cnjs', v_invalid_cnjs,
    'empty_reclamante', v_empty_reclamante,
    'empty_reu', v_empty_reu,
    'duplicates', v_duplicates,
    'soft_deleted', v_soft_deleted,
    'total_issues', v_invalid_cnjs + v_empty_reclamante + v_empty_reu + v_duplicates + v_soft_deleted
  );

  RETURN v_result;
END;
$$;

-- 2. Limpeza básica: Remove CNJs inválidos
CREATE OR REPLACE FUNCTION public.rpc_cleanup_invalid_cnjs(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Soft delete processos com CNJs inválidos
  UPDATE processos 
  SET deleted_at = now(), 
      deleted_by = auth.uid()
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND (cnj_digits IS NULL OR length(cnj_digits) != 20 OR cnj_digits !~ '^[0-9]{20}$');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log da operação
  PERFORM log_user_action(
    'CLEANUP_INVALID_CNJS',
    'processos',
    p_org_id,
    jsonb_build_object('deleted_count', v_deleted_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'CNJs inválidos removidos com sucesso'
  );
END;
$$;

-- 3. Remove processos com campos obrigatórios vazios
CREATE OR REPLACE FUNCTION public.rpc_cleanup_empty_required_fields(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Soft delete processos com campos obrigatórios vazios
  UPDATE processos 
  SET deleted_at = now(), 
      deleted_by = auth.uid()
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND (
      reclamante_nome IS NULL OR trim(reclamante_nome) = '' OR
      reu_nome IS NULL OR trim(reu_nome) = ''
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log da operação
  PERFORM log_user_action(
    'CLEANUP_EMPTY_FIELDS',
    'processos',
    p_org_id,
    jsonb_build_object('deleted_count', v_deleted_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'Processos com campos obrigatórios vazios removidos'
  );
END;
$$;

-- 4. Remove duplicatas (mantém o mais recente)
CREATE OR REPLACE FUNCTION public.rpc_cleanup_duplicates(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Soft delete duplicatas (mantém o mais recente)
  WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY cnj_digits ORDER BY created_at DESC) as rn
    FROM processos 
    WHERE org_id = p_org_id 
      AND deleted_at IS NULL
      AND cnj_digits IS NOT NULL
      AND length(cnj_digits) = 20
  )
  UPDATE processos 
  SET deleted_at = now(), 
      deleted_by = auth.uid()
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log da operação
  PERFORM log_user_action(
    'CLEANUP_DUPLICATES',
    'processos',
    p_org_id,
    jsonb_build_object('deleted_count', v_deleted_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'Duplicatas removidas com sucesso'
  );
END;
$$;

-- 5. Hard delete de soft deletes antigos
CREATE OR REPLACE FUNCTION public.rpc_cleanup_hard_delete_old(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Hard delete processos soft deleted há mais de 30 dias
  DELETE FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log da operação
  PERFORM log_user_action(
    'CLEANUP_HARD_DELETE',
    'processos',
    p_org_id,
    jsonb_build_object('deleted_count', v_deleted_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'Registros antigos removidos permanentemente'
  );
END;
$$;

-- 6. Normalização de CNJs
CREATE OR REPLACE FUNCTION public.rpc_cleanup_normalize_cnjs(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  -- Verificar permissões
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id = p_org_id AND role = 'ADMIN') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar esta operação.';
  END IF;

  -- Normalizar CNJs (remover pontuação e garantir 20 dígitos)
  UPDATE processos 
  SET cnj_digits = regexp_replace(cnj_digits, '[^0-9]', '', 'g'),
      cnj_normalizado = regexp_replace(cnj_digits, '[^0-9]', '', 'g'),
      updated_at = now()
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL
    AND cnj_digits IS NOT NULL
    AND cnj_digits ~ '[^0-9]';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Log da operação
  PERFORM log_user_action(
    'CLEANUP_NORMALIZE_CNJS',
    'processos',
    p_org_id,
    jsonb_build_object('updated_count', v_updated_count)
  );

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'message', 'CNJs normalizados com sucesso'
  );
END;
$$;