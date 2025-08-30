-- Create RPC functions for mass deletion operations

-- Function to get deletion impact preview
CREATE OR REPLACE FUNCTION public.rpc_get_deletion_impact(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb := '{}';
  v_total_processos integer;
  v_total_pessoas integer;
  v_active_processos integer;
  v_soft_deleted integer;
BEGIN
  -- Count total processos
  SELECT COUNT(*) INTO v_total_processos
  FROM processos 
  WHERE org_id = p_org_id;

  -- Count active processos (not soft deleted)
  SELECT COUNT(*) INTO v_active_processos
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NULL;

  -- Count soft deleted processos
  SELECT COUNT(*) INTO v_soft_deleted
  FROM processos 
  WHERE org_id = p_org_id 
    AND deleted_at IS NOT NULL;

  -- Count people records
  SELECT COUNT(*) INTO v_total_pessoas
  FROM pessoas 
  WHERE org_id = p_org_id;

  -- Build result
  v_result := jsonb_build_object(
    'total_processos', v_total_processos,
    'active_processos', v_active_processos,
    'soft_deleted_processos', v_soft_deleted,
    'total_pessoas', v_total_pessoas,
    'estimated_deletion_time_minutes', CASE 
      WHEN v_active_processos > 10000 THEN 5
      WHEN v_active_processos > 1000 THEN 2
      ELSE 1
    END
  );

  RETURN v_result;
END;
$function$;

-- Function to delete all processos for an organization
CREATE OR REPLACE FUNCTION public.rpc_delete_all_processos(p_org_id uuid, p_hard_delete boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_count integer := 0;
  v_user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Check if user is admin
  IF v_user_profile IS NULL OR v_user_profile.role != 'ADMIN' OR v_user_profile.organization_id != p_org_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Acesso negado - apenas administradores podem executar esta operação'
    );
  END IF;

  -- Perform deletion
  IF p_hard_delete THEN
    -- Hard delete (permanent removal)
    DELETE FROM processos 
    WHERE org_id = p_org_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log action
    PERFORM log_user_action(
      'HARD_DELETE_ALL_PROCESSOS',
      'processos',
      NULL,
      jsonb_build_object(
        'org_id', p_org_id,
        'deleted_count', v_deleted_count,
        'operation_type', 'HARD_DELETE_ALL'
      )
    );
  ELSE
    -- Soft delete (recommended)
    UPDATE processos 
    SET deleted_at = now(), 
        deleted_by = auth.uid()
    WHERE org_id = p_org_id 
      AND deleted_at IS NULL;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log action
    PERFORM log_user_action(
      'SOFT_DELETE_ALL_PROCESSOS',
      'processos',
      NULL,
      jsonb_build_object(
        'org_id', p_org_id,
        'deleted_count', v_deleted_count,
        'operation_type', 'SOFT_DELETE_ALL'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'operation_type', CASE WHEN p_hard_delete THEN 'HARD_DELETE' ELSE 'SOFT_DELETE' END,
    'message', 'Operação de exclusão concluída com sucesso'
  );
END;
$function$;

-- Function to cleanup derived data (pessoas records that no longer have associated processos)
CREATE OR REPLACE FUNCTION public.rpc_cleanup_derived_data(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted_count integer := 0;
  v_user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Check if user is admin
  IF v_user_profile IS NULL OR v_user_profile.role != 'ADMIN' OR v_user_profile.organization_id != p_org_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Acesso negado - apenas administradores podem executar esta operação'
    );
  END IF;

  -- Delete orphaned pessoas records
  DELETE FROM pessoas 
  WHERE org_id = p_org_id 
    AND NOT EXISTS (
      SELECT 1 FROM processos p 
      WHERE p.org_id = pessoas.org_id 
        AND p.deleted_at IS NULL
        AND (
          p.reclamante_nome = pessoas.nome_civil 
          OR pessoas.nome_civil = ANY(p.testemunhas_ativo)
          OR pessoas.nome_civil = ANY(p.testemunhas_passivo)
        )
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log action
  PERFORM log_user_action(
    'CLEANUP_DERIVED_DATA',
    'pessoas',
    NULL,
    jsonb_build_object(
      'org_id', p_org_id,
      'deleted_count', v_deleted_count,
      'operation_type', 'CLEANUP_ORPHANED_PESSOAS'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', 'Limpeza de dados derivados concluída com sucesso'
  );
END;
$function$;

-- Function to restore soft deleted processos
CREATE OR REPLACE FUNCTION public.rpc_restore_all_processos(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_restored_count integer := 0;
  v_user_profile profiles%ROWTYPE;
BEGIN
  -- Get current user profile
  SELECT * INTO v_user_profile
  FROM profiles 
  WHERE user_id = auth.uid();
  
  -- Check if user is admin
  IF v_user_profile IS NULL OR v_user_profile.role != 'ADMIN' OR v_user_profile.organization_id != p_org_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Acesso negado - apenas administradores podem executar esta operação'
    );
  END IF;

  -- Restore soft deleted processos
  UPDATE processos 
  SET deleted_at = NULL, 
      deleted_by = NULL
  WHERE org_id = p_org_id 
    AND deleted_at IS NOT NULL;

  GET DIAGNOSTICS v_restored_count = ROW_COUNT;

  -- Log action
  PERFORM log_user_action(
    'RESTORE_ALL_PROCESSOS',
    'processos',
    NULL,
    jsonb_build_object(
      'org_id', p_org_id,
      'restored_count', v_restored_count,
      'operation_type', 'RESTORE_ALL'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'restored_count', v_restored_count,
    'message', 'Restauração de processos concluída com sucesso'
  );
END;
$function$;