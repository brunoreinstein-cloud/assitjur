-- Fix remaining Security Definer functions in hubjuria schema
-- This addresses the final security linter warnings about SECURITY DEFINER functions

-- Get the current function definitions to understand their structure
-- Then create secure versions

-- 1. Fix hubjuria.rpc_revalidate_processos - Remove SECURITY DEFINER if not necessary
-- First, let's see the current definition and then recreate it securely
CREATE OR REPLACE FUNCTION hubjuria.rpc_revalidate_processos(_org_id uuid, _ids uuid[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
-- Removed SECURITY DEFINER to rely on RLS policies instead
SET search_path TO 'public'
AS $function$
DECLARE
    v_updated_count integer := 0;
    v_error_count integer := 0;
    v_user_profile profiles%ROWTYPE;
    v_total_count integer := 0;
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
    
    -- Check role permissions - only admins can revalidate processes
    IF v_user_profile.role != 'ADMIN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: only administrators can revalidate processes');
    END IF;
    
    -- If specific IDs provided, validate array and limits
    IF _ids IS NOT NULL THEN
        IF array_length(_ids, 1) IS NULL OR array_length(_ids, 1) = 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'No valid IDs provided');
        END IF;
        
        -- Limit batch size for performance and security
        IF array_length(_ids, 1) > 500 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Batch size cannot exceed 500 records');
        END IF;
        
        v_total_count := array_length(_ids, 1);
        
        -- Revalidate specific processes
        UPDATE processos 
        SET updated_at = now()
        WHERE org_id = _org_id 
        AND id = ANY(_ids)
        AND deleted_at IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    ELSE
        -- Revalidate all processes for the organization
        SELECT COUNT(*) INTO v_total_count
        FROM processos 
        WHERE org_id = _org_id 
        AND deleted_at IS NULL;
        
        UPDATE processos 
        SET updated_at = now()
        WHERE org_id = _org_id 
        AND deleted_at IS NULL;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    END IF;
    
    -- Log the revalidation action
    PERFORM log_user_action(
        'REVALIDATE_PROCESSOS',
        'processos',
        NULL,
        jsonb_build_object(
            'org_id', _org_id,
            'total_count', v_total_count,
            'updated_count', v_updated_count,
            'user_role', v_user_profile.role,
            'batch_mode', _ids IS NOT NULL
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'total_count', v_total_count,
        'updated_count', v_updated_count,
        'message', format('Revalidated %s out of %s processes', v_updated_count, v_total_count)
    );
END;
$function$;

-- 2. Fix hubjuria.rpc_soft_delete_processos - Remove SECURITY DEFINER and add proper access control
CREATE OR REPLACE FUNCTION hubjuria.rpc_soft_delete_processos(_org_id uuid, _ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
-- Removed SECURITY DEFINER to rely on RLS policies instead
SET search_path TO 'public'
AS $function$
DECLARE
    v_deleted_count integer := 0;
    v_error_count integer := 0;
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
    
    -- Check role permissions - only admins can delete processes
    IF v_user_profile.role != 'ADMIN' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: only administrators can delete processes');
    END IF;
    
    -- Validate input array
    IF _ids IS NULL OR array_length(_ids, 1) IS NULL OR array_length(_ids, 1) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No valid IDs provided for deletion');
    END IF;
    
    -- Limit batch size for performance and security
    IF array_length(_ids, 1) > 500 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Batch deletion cannot exceed 500 records');
    END IF;
    
    v_total_count := array_length(_ids, 1);
    
    -- Perform soft deletion
    UPDATE processos 
    SET deleted_at = now(),
        deleted_by = auth.uid(),
        updated_at = now()
    WHERE org_id = _org_id 
    AND id = ANY(_ids)
    AND deleted_at IS NULL; -- Only delete records that aren't already deleted
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Log the deletion action
    PERFORM log_user_action(
        'SOFT_DELETE_PROCESSOS_BATCH',
        'processos',
        NULL,
        jsonb_build_object(
            'org_id', _org_id,
            'requested_count', v_total_count,
            'deleted_count', v_deleted_count,
            'user_role', v_user_profile.role,
            'deleted_ids', _ids
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'requested_count', v_total_count,
        'deleted_count', v_deleted_count,
        'message', format('Successfully soft-deleted %s out of %s requested processes', 
                         v_deleted_count, v_total_count)
    );
END;
$function$;