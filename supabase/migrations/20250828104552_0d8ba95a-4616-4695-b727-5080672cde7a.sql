-- FASE 1 (CORRIGIDA): Views de Qualidade e RPCs para Admin Data Explorer 

-- View de qualidade para processos (corrigida - usando cnj_digits existente)
CREATE OR REPLACE VIEW hubjuria.vw_processos_quality AS
SELECT
  p.*,
  -- Análise de qualidade CNJ (usando coluna existente)
  (length(COALESCE(p.cnj_digits, '')) = 20) as cnj_valid,
  
  -- Análise de campos obrigatórios
  (COALESCE(NULLIF(trim(p.reclamante_nome), ''), '') <> '') as reclamante_valid,
  (COALESCE(NULLIF(trim(p.reu_nome), ''), '') <> '') as reu_valid,
  
  -- Análise de duplicatas
  COUNT(*) OVER (
    PARTITION BY p.org_id, p.cnj_digits
  ) as duplicate_count,
  ROW_NUMBER() OVER (
    PARTITION BY p.org_id, p.cnj_digits
    ORDER BY p.created_at ASC
  ) = 1 as is_canonical,
  
  -- Score de qualidade geral (0-100)
  CASE 
    WHEN (length(COALESCE(p.cnj_digits, '')) = 20)
         AND (COALESCE(NULLIF(trim(p.reclamante_nome), ''), '') <> '')
         AND (COALESCE(NULLIF(trim(p.reu_nome), ''), '') <> '')
         AND (COUNT(*) OVER (PARTITION BY p.org_id, p.cnj_digits) = 1)
    THEN 100
    WHEN (length(COALESCE(p.cnj_digits, '')) = 20)
         AND (COALESCE(NULLIF(trim(p.reclamante_nome), ''), '') <> '')
         AND (COALESCE(NULLIF(trim(p.reu_nome), ''), '') <> '')
    THEN 75
    ELSE 25
  END as quality_score,
  
  -- Severidade geral
  CASE 
    WHEN (length(COALESCE(p.cnj_digits, '')) <> 20)
         OR (COALESCE(NULLIF(trim(p.reclamante_nome), ''), '') = '')
         OR (COALESCE(NULLIF(trim(p.reu_nome), ''), '') = '')
    THEN 'ERROR'
    WHEN (COUNT(*) OVER (PARTITION BY p.org_id, p.cnj_digits) > 1)
    THEN 'WARNING'
    ELSE 'OK'
  END as severity
FROM public.processos p
WHERE p.deleted_at IS NULL;

-- View de qualidade para pessoas (testemunhas)
CREATE OR REPLACE VIEW hubjuria.vw_pessoas_quality AS
SELECT
  pe.*,
  -- Análise de campos obrigatórios
  (COALESCE(NULLIF(trim(pe.nome_civil), ''), '') <> '') as nome_valid,
  
  -- Análise de duplicatas por nome e CPF
  COUNT(*) OVER (
    PARTITION BY pe.org_id, LOWER(trim(pe.nome_civil)), pe.cpf_mask
  ) as duplicate_count,
  ROW_NUMBER() OVER (
    PARTITION BY pe.org_id, LOWER(trim(pe.nome_civil)), pe.cpf_mask
    ORDER BY pe.created_at ASC
  ) = 1 as is_canonical,
  
  -- Score de qualidade
  CASE 
    WHEN (COALESCE(NULLIF(trim(pe.nome_civil), ''), '') <> '')
         AND (COUNT(*) OVER (PARTITION BY pe.org_id, LOWER(trim(pe.nome_civil)), pe.cpf_mask) = 1)
    THEN 100
    WHEN (COALESCE(NULLIF(trim(pe.nome_civil), ''), '') <> '')
    THEN 75
    ELSE 25
  END as quality_score,
  
  -- Severidade
  CASE 
    WHEN (COALESCE(NULLIF(trim(pe.nome_civil), ''), '') = '')
    THEN 'ERROR'
    WHEN (COUNT(*) OVER (PARTITION BY pe.org_id, LOWER(trim(pe.nome_civil)), pe.cpf_mask) > 1)
    THEN 'WARNING'
    ELSE 'OK'
  END as severity
FROM public.pessoas pe;

-- RPC: Normalizar CNJ (aplicar máscara padrão)
CREATE OR REPLACE FUNCTION hubjuria.rpc_normalize_cnj(_id uuid, _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cnj_digits text;
  v_formatted_cnj text;
  v_updated_count integer := 0;
BEGIN
  -- Verificar se o usuário tem acesso a esta organização
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
    AND role IN ('ADMIN', 'ANALYST')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  
  -- Buscar CNJ digits existente
  SELECT COALESCE(cnj_digits, '')
  INTO v_cnj_digits
  FROM processos 
  WHERE id = _id AND org_id = _org_id;
  
  -- Verificar se tem 20 dígitos
  IF length(v_cnj_digits) <> 20 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'CNJ deve ter exatamente 20 dígitos'
    );
  END IF;
  
  -- Formatar CNJ no padrão NNNNNNN-DD.AAAA.J.TR.OOOO
  v_formatted_cnj := substring(v_cnj_digits, 1, 7) || '-' ||
                     substring(v_cnj_digits, 8, 2) || '.' ||
                     substring(v_cnj_digits, 10, 4) || '.' ||
                     substring(v_cnj_digits, 14, 1) || '.' ||
                     substring(v_cnj_digits, 15, 2) || '.' ||
                     substring(v_cnj_digits, 17, 4);
  
  -- Atualizar o registro
  UPDATE processos 
  SET cnj = v_formatted_cnj,
      cnj_normalizado = v_cnj_digits,
      updated_at = now()
  WHERE id = _id AND org_id = _org_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Log da ação
  PERFORM log_user_action(
    'NORMALIZE_CNJ',
    'processos',
    _id,
    jsonb_build_object(
      'old_cnj', (SELECT cnj FROM processos WHERE id = _id),
      'new_cnj', v_formatted_cnj
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'formatted_cnj', v_formatted_cnj
  );
END;
$$;

-- RPC: Normalizar CNJ em lote
CREATE OR REPLACE FUNCTION hubjuria.rpc_normalize_cnj_batch(_ids uuid[], _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer := 0;
  v_error_count integer := 0;
  v_id uuid;
  v_result jsonb;
BEGIN
  -- Verificar acesso
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
    AND role IN ('ADMIN', 'ANALYST')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Acesso negado');
  END IF;
  
  -- Processar cada ID
  FOREACH v_id IN ARRAY _ids
  LOOP
    SELECT hubjuria.rpc_normalize_cnj(v_id, _org_id) INTO v_result;
    
    IF (v_result->>'success')::boolean THEN
      v_updated_count := v_updated_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'error_count', v_error_count,
    'total_processed', array_length(_ids, 1)
  );
END;
$$;

-- RPC: Revalidar registros
CREATE OR REPLACE FUNCTION hubjuria.rpc_revalidate_processos(_ids uuid[], _org_id uuid)
RETURNS SETOF hubjuria.vw_processos_quality
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM hubjuria.vw_processos_quality
  WHERE org_id = _org_id 
  AND id = ANY(_ids)
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
  );
$$;

-- RPC: Excluir registros (soft delete)
CREATE OR REPLACE FUNCTION hubjuria.rpc_soft_delete_processos(_ids uuid[], _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Verificar acesso de admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
    AND role = 'ADMIN'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas administradores podem excluir registros');
  END IF;
  
  -- Soft delete
  UPDATE processos 
  SET deleted_at = now(),
      deleted_by = auth.uid(),
      updated_at = now()
  WHERE id = ANY(_ids) 
  AND org_id = _org_id
  AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Log da ação
  PERFORM log_user_action(
    'SOFT_DELETE_BATCH',
    'processos',
    null,
    jsonb_build_object(
      'deleted_ids', _ids,
      'deleted_count', v_deleted_count
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count
  );
END;
$$;