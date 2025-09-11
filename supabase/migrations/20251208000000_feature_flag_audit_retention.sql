BEGIN;

-- Ensure feature_flag_audit does not store PII beyond user_id
ALTER TABLE IF EXISTS public.feature_flag_audit
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS ip,
  DROP COLUMN IF EXISTS ua,
  DROP COLUMN IF EXISTS user_agent;

-- Add default retention policy for feature_flag_audit
INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup)
SELECT id, 'feature_flag_audit', 6, true FROM organizations
ON CONFLICT (org_id, table_name) DO NOTHING;

-- Update default retention policies function
CREATE OR REPLACE FUNCTION public.setup_default_retention_policies(
  p_org_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO retention_policies (org_id, table_name, retention_months, auto_cleanup) VALUES
    (p_org_id, 'processos', 60, false), -- 5 years for legal processes
    (p_org_id, 'audit_logs', 24, true),  -- 2 years for audit logs
    (p_org_id, 'openai_logs', 12, true), -- 1 year for AI logs
    (p_org_id, 'data_access_logs', 24, true), -- 2 years for access logs
    (p_org_id, 'lgpd_requests', 36, false), -- 3 years for LGPD requests
    (p_org_id, 'feature_flag_audit', 6, true) -- 6 months for feature flag audit
  ON CONFLICT (org_id, table_name) DO NOTHING;
END;
$$;

-- Extend execute_retention_cleanup to handle feature_flag_audit
CREATE OR REPLACE FUNCTION public.execute_retention_cleanup(p_policy_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  policy_record retention_policies%ROWTYPE;
  records_count integer := 0;
  cleanup_log_id uuid;
  cutoff_date timestamp with time zone;
BEGIN
  -- Get policy details
  SELECT * INTO policy_record
  FROM retention_policies
  WHERE id = p_policy_id AND auto_cleanup = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Policy not found or auto cleanup disabled'
    );
  END IF;

  -- Calculate cutoff date
  cutoff_date := now() - (policy_record.retention_months || ' months')::interval;

  -- Start cleanup log
  INSERT INTO cleanup_logs (
    org_id, policy_id, table_name, status
  ) VALUES (
    policy_record.org_id, p_policy_id, policy_record.table_name, 'STARTED'
  ) RETURNING id INTO cleanup_log_id;

  BEGIN
    -- Build and execute cleanup query based on table
    CASE policy_record.table_name
      WHEN 'processos' THEN
        UPDATE processos
        SET deleted_at = now(), deleted_by = '00000000-0000-0000-0000-000000000000'
        WHERE org_id = policy_record.org_id
          AND deleted_at IS NULL
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;

      WHEN 'audit_logs' THEN
        DELETE FROM audit_logs
        WHERE organization_id = policy_record.org_id
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;

      WHEN 'openai_logs' THEN
        DELETE FROM openai_logs
        WHERE org_id = policy_record.org_id
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;

      WHEN 'data_access_logs' THEN
        DELETE FROM data_access_logs
        WHERE org_id = policy_record.org_id
          AND created_at < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;

      WHEN 'feature_flag_audit' THEN
        DELETE FROM feature_flag_audit
        WHERE tenant_id = policy_record.org_id
          AND "timestamp" < cutoff_date;
        GET DIAGNOSTICS records_count = ROW_COUNT;

      ELSE
        records_count := 0;
    END CASE;

    -- Update policy last cleanup
    UPDATE retention_policies
    SET
      last_cleanup_at = now(),
      next_cleanup_at = calculate_next_cleanup(now(), retention_months),
      updated_at = now()
    WHERE id = p_policy_id;

    -- Complete cleanup log
    UPDATE cleanup_logs
    SET
      status = 'COMPLETED',
      records_affected = records_count,
      completed_at = now(),
      metadata = jsonb_build_object(
        'cutoff_date', cutoff_date,
        'retention_months', policy_record.retention_months
      )
    WHERE id = cleanup_log_id;

    RETURN jsonb_build_object(
      'success', true,
      'records_affected', records_count,
      'cutoff_date', cutoff_date,
      'message', 'Cleanup completed successfully'
    );

  EXCEPTION WHEN OTHERS THEN
    UPDATE cleanup_logs
    SET
      status = 'FAILED',
      error_message = SQLERRM,
      completed_at = now()
    WHERE id = cleanup_log_id;

    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cleanup failed: ' || SQLERRM
    );
  END;
END;
$$;

COMMIT;
