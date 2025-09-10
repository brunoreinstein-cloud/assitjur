-- pgTAP tests for tenant RLS policies
BEGIN;
SELECT plan(5);

-- Check tenant_id column and policies on profiles
SELECT has_column('public', 'profiles', 'tenant_id', 'profiles has tenant_id');
SELECT has_policy('public', 'profiles', 'tenant_scope_profiles', 'profiles tenant_scope policy exists');

-- Check tenant_id column and policies on audit_logs
SELECT has_column('public', 'audit_logs', 'tenant_id', 'audit_logs has tenant_id');
SELECT has_policy('public', 'audit_logs', 'tenant_scope_audit_logs', 'audit_logs tenant_scope policy exists');

SELECT finish();
ROLLBACK;
