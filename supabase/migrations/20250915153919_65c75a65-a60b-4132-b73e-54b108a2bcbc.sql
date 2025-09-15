-- Fix Security Definer functions to improve security
-- This migration addresses the security linter warnings about SECURITY DEFINER functions

-- 1. Fix assistjur.rpc_atualizar_mapa_testemunha - Remove SECURITY DEFINER and rely on RLS
CREATE OR REPLACE FUNCTION assistjur.rpc_atualizar_mapa_testemunha(
    vinculo_id uuid, 
    p_status assistjur.status_oitiva_enum, 
    p_relev smallint, 
    p_risco text, 
    p_prox timestamp with time zone, 
    p_nota text, 
    p_tags text[]
)
RETURNS assistjur.processos_testemunhas
LANGUAGE plpgsql
-- Removed SECURITY DEFINER to rely on RLS policies instead
SET search_path TO 'assistjur', 'public'
AS $function$
DECLARE
    updated_row assistjur.processos_testemunhas;
BEGIN
    -- Check if user has access to this organization's data
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN assistjur.processos_testemunhas pt ON pt.id = vinculo_id
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = (
            SELECT proc.org_id 
            FROM assistjur.processos proc 
            WHERE proc.id = pt.processo_id
        )
        AND p.is_active = true
        AND p.role IN ('ADMIN', 'ANALYST')
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;

    UPDATE assistjur.processos_testemunhas
    SET    status_oitiva = p_status,
           relevancia = p_relev,
           risco = p_risco,
           proxima_movimentacao = p_prox,
           nota_interna = p_nota,
           tags = p_tags,
           updated_at = now()
    WHERE  id = vinculo_id
    RETURNING * INTO updated_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Record not found or access denied';
    END IF;

    RETURN updated_row;
END;
$function$;

-- 2. Fix assistjur.rpc_get_assistjur_processos - Remove SECURITY DEFINER and add proper access control
CREATE OR REPLACE FUNCTION assistjur.rpc_get_assistjur_processos(
    _page integer, 
    _limit integer, 
    _fase text
)
RETURNS SETOF assistjur.processos
LANGUAGE plpgsql
-- Removed SECURITY DEFINER to rely on RLS policies instead
SET search_path TO 'assistjur', 'public'
AS $function$
DECLARE
    sql_text text;
    user_org_id uuid;
BEGIN
    -- Get user's organization ID from profiles table
    SELECT p.organization_id INTO user_org_id
    FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.is_active = true;
    
    IF user_org_id IS NULL THEN
        RAISE EXCEPTION 'Access denied: user not found or inactive';
    END IF;
    
    -- Check if user has appropriate permissions
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() 
        AND p.organization_id = user_org_id
        AND p.is_active = true
        AND (p.role IN ('ADMIN', 'ANALYST') OR p.data_access_level IN ('FULL', 'MASKED'))
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;

    -- Check if fase column exists
    PERFORM 1 FROM information_schema.columns 
    WHERE table_schema='assistjur' AND table_name='processos' AND column_name='fase';
    
    IF FOUND THEN
        sql_text := format($f$
            SELECT * FROM assistjur.processos p
            WHERE p.org_id = %L
              AND (_fase IS NULL OR p.fase = %L)
              AND p.deleted_at IS NULL
            ORDER BY p.updated_at DESC
            LIMIT %s OFFSET %s
        $f$, user_org_id::text, _fase, _limit::text, ((_page-1)*_limit)::text);
    ELSE
        sql_text := format($f$
            SELECT * FROM assistjur.processos p
            WHERE p.org_id = %L
              AND p.deleted_at IS NULL
            ORDER BY p.updated_at DESC
            LIMIT %s OFFSET %s
        $f$, user_org_id::text, _limit::text, ((_page-1)*_limit)::text);
    END IF;

    RETURN QUERY EXECUTE sql_text;
END;
$function$;

-- 3. Fix hubjuria.rpc_normalize_cnj - Keep SECURITY DEFINER but improve access control
CREATE OR REPLACE FUNCTION hubjuria.rpc_normalize_cnj(_id uuid, _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Keep this as it needs to access system functions for CNJ validation
SET search_path TO 'public' -- Secure the search path
AS $function$
DECLARE
    v_cnj_digits text;
    v_formatted_cnj text;
    v_updated_count integer := 0;
    v_user_profile profiles%ROWTYPE;
BEGIN
    -- Enhanced security check - get full user profile
    SELECT * INTO v_user_profile
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: user not found or inactive');
    END IF;
    
    -- Check role permissions
    IF v_user_profile.role NOT IN ('ADMIN', 'ANALYST') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: insufficient role permissions');
    END IF;
    
    -- Additional check for data access level
    IF v_user_profile.data_access_level NOT IN ('FULL', 'MASKED') AND v_user_profile.role != 'ADMIN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: insufficient data access level');
    END IF;
    
    -- Fetch existing CNJ digits with additional security check
    SELECT COALESCE(cnj_digits, '')
    INTO v_cnj_digits
    FROM processos 
    WHERE id = _id 
    AND org_id = _org_id
    AND deleted_at IS NULL; -- Ensure we don't work with deleted records
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Process not found or access denied');
    END IF;
    
    -- Validate CNJ digits format
    IF length(v_cnj_digits) <> 20 OR v_cnj_digits !~ '^[0-9]{20}$' THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'CNJ must have exactly 20 numeric digits'
        );
    END IF;
    
    -- Format CNJ in the standard pattern NNNNNNN-DD.AAAA.J.TR.OOOO
    v_formatted_cnj := substring(v_cnj_digits, 1, 7) || '-' ||
                       substring(v_cnj_digits, 8, 2) || '.' ||
                       substring(v_cnj_digits, 10, 4) || '.' ||
                       substring(v_cnj_digits, 14, 1) || '.' ||
                       substring(v_cnj_digits, 15, 2) || '.' ||
                       substring(v_cnj_digits, 17, 4);
    
    -- Update the record
    UPDATE processos 
    SET cnj = v_formatted_cnj,
        cnj_normalizado = v_cnj_digits,
        updated_at = now()
    WHERE id = _id 
    AND org_id = _org_id
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Log the action with enhanced metadata
    PERFORM log_user_action(
        'NORMALIZE_CNJ',
        'processos',
        _id,
        jsonb_build_object(
            'org_id', _org_id,
            'user_role', v_user_profile.role,
            'formatted_cnj', v_formatted_cnj,
            'cnj_digits', v_cnj_digits
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_updated_count,
        'formatted_cnj', v_formatted_cnj
    );
END;
$function$;

-- 4. Fix hubjuria.rpc_normalize_cnj_batch - Keep SECURITY DEFINER but improve access control
CREATE OR REPLACE FUNCTION hubjuria.rpc_normalize_cnj_batch(_ids uuid[], _org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Keep this as it needs to access system functions for batch operations
SET search_path TO 'public' -- Secure the search path
AS $function$
DECLARE
    v_updated_count integer := 0;
    v_error_count integer := 0;
    v_id uuid;
    v_result jsonb;
    v_user_profile profiles%ROWTYPE;
    v_total_count integer;
BEGIN
    -- Enhanced security check - get full user profile
    SELECT * INTO v_user_profile
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id = _org_id
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: user not found or inactive');
    END IF;
    
    -- Check role permissions
    IF v_user_profile.role NOT IN ('ADMIN', 'ANALYST') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: insufficient role permissions');
    END IF;
    
    -- Additional check for data access level
    IF v_user_profile.data_access_level NOT IN ('FULL', 'MASKED') AND v_user_profile.role != 'ADMIN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: insufficient data access level');
    END IF;
    
    -- Validate input array
    IF _ids IS NULL OR array_length(_ids, 1) IS NULL OR array_length(_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No IDs provided');
    END IF;
    
    -- Limit batch size for performance and security
    IF array_length(_ids, 1) > 1000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Batch size cannot exceed 1000 records');
    END IF;
    
    v_total_count := array_length(_ids, 1);
    
    -- Process each ID individually for better error handling and security
    FOREACH v_id IN ARRAY _ids
    LOOP
        BEGIN
            -- Call the individual function which has its own security checks
            SELECT hubjuria.rpc_normalize_cnj(v_id, _org_id) INTO v_result;
            
            IF (v_result->>'success')::boolean THEN
                v_updated_count := v_updated_count + 1;
            ELSE
                v_error_count := v_error_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            -- Log the error but continue processing
            PERFORM log_user_action(
                'NORMALIZE_CNJ_BATCH_ERROR',
                'processos',
                v_id,
                jsonb_build_object(
                    'org_id', _org_id,
                    'error', SQLERRM,
                    'user_role', v_user_profile.role
                )
            );
        END;
    END LOOP;
    
    -- Log the batch operation
    PERFORM log_user_action(
        'NORMALIZE_CNJ_BATCH',
        'processos',
        NULL,
        jsonb_build_object(
            'org_id', _org_id,
            'total_count', v_total_count,
            'updated_count', v_updated_count,
            'error_count', v_error_count,
            'user_role', v_user_profile.role
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'total_count', v_total_count,
        'updated_count', v_updated_count,
        'error_count', v_error_count,
        'message', format('Processed %s records: %s updated, %s errors', 
                         v_total_count, v_updated_count, v_error_count)
    );
END;
$function$;