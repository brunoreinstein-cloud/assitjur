BEGIN;

-- 1. Add tenant_id to feature_flags and feature_flag_audit
ALTER TABLE IF EXISTS public.feature_flags
  ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE IF EXISTS public.feature_flag_audit
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Optional foreign keys to organizations if table exists
DO $$
BEGIN
  IF to_regclass('public.organizations') IS NOT NULL THEN
    ALTER TABLE IF EXISTS public.feature_flags
      ADD CONSTRAINT IF NOT EXISTS feature_flags_tenant_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    ALTER TABLE IF EXISTS public.feature_flag_audit
      ADD CONSTRAINT IF NOT EXISTS feature_flag_audit_tenant_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enforce NOT NULL
ALTER TABLE IF EXISTS public.feature_flags ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE IF EXISTS public.feature_flag_audit ALTER COLUMN tenant_id SET NOT NULL;

-- 2. Date window constraint
DO $$
BEGIN
  IF to_regclass('public.feature_flags') IS NOT NULL AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='feature_flags' AND column_name='start_date') AND
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='feature_flags' AND column_name='end_date') THEN
    ALTER TABLE public.feature_flags DROP CONSTRAINT IF EXISTS feature_flags_start_before_end;
    ALTER TABLE public.feature_flags ADD CONSTRAINT feature_flags_start_before_end
      CHECK (start_date IS NULL OR end_date IS NULL OR start_date < end_date);
  END IF;
END $$;

-- 3. Indexes
DO $$
BEGIN
  IF to_regclass('public.feature_flags') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS feature_flags_tenant_env_enabled_idx
      ON public.feature_flags (tenant_id, environment, enabled)
      WHERE enabled = true;
    CREATE INDEX IF NOT EXISTS feature_flags_tenant_id_id_idx
      ON public.feature_flags (tenant_id, id);
  END IF;
  IF to_regclass('public.feature_flag_audit') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS feature_flag_audit_tenant_timestamp_idx
      ON public.feature_flag_audit (tenant_id, "timestamp" DESC);
  END IF;
END $$;

-- 4. Row Level Security and policies
DO $$
BEGIN
  IF to_regclass('public.feature_flags') IS NOT NULL THEN
    ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS feature_flags_select ON public.feature_flags;
    CREATE POLICY feature_flags_select ON public.feature_flags
      FOR SELECT USING (
        auth.jwt()->>'tenant_id' = tenant_id::text AND
        (
          (auth.jwt()->>'env') IS NOT NULL AND auth.jwt()->>'env' = environment
          OR
          (auth.jwt()->>'env') IS NULL AND (
            environment = 'production'
            OR ((auth.jwt()->>'role') IN ('admin','super_admin') AND environment IN ('staging','development'))
          )
        )
      );
    COMMENT ON POLICY feature_flags_select ON public.feature_flags IS 'Tenant isolation with environment filtering based on JWT claim or role.';

    DROP POLICY IF EXISTS feature_flags_insert ON public.feature_flags;
    CREATE POLICY feature_flags_insert ON public.feature_flags
      FOR INSERT WITH CHECK (
        auth.jwt()->>'tenant_id' = tenant_id::text
      );
    COMMENT ON POLICY feature_flags_insert ON public.feature_flags IS 'Only allow inserts within the caller\'s tenant.';

    DROP POLICY IF EXISTS feature_flags_update ON public.feature_flags;
    CREATE POLICY feature_flags_update ON public.feature_flags
      FOR UPDATE USING (
        auth.jwt()->>'tenant_id' = tenant_id::text AND
        (
          (auth.jwt()->>'role') IN ('admin','super_admin')
          OR auth.jwt()->>'email' = 'bruno@assistjur.com'
        )
      ) WITH CHECK (auth.jwt()->>'tenant_id' = tenant_id::text);
    COMMENT ON POLICY feature_flags_update ON public.feature_flags IS 'Updates restricted to admins or specific email within same tenant.';

    DROP POLICY IF EXISTS feature_flags_delete ON public.feature_flags;
    CREATE POLICY feature_flags_delete ON public.feature_flags
      FOR DELETE USING (
        auth.jwt()->>'tenant_id' = tenant_id::text AND
        (
          (auth.jwt()->>'role') IN ('admin','super_admin')
          OR auth.jwt()->>'email' = 'bruno@assistjur.com'
        )
      );
    COMMENT ON POLICY feature_flags_delete ON public.feature_flags IS 'Deletes restricted to admins or specific email within same tenant.';
  END IF;

  IF to_regclass('public.feature_flag_audit') IS NOT NULL THEN
    ALTER TABLE public.feature_flag_audit ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS feature_flag_audit_select_admin ON public.feature_flag_audit;
    CREATE POLICY feature_flag_audit_select_admin ON public.feature_flag_audit
      FOR SELECT USING (
        auth.jwt()->>'tenant_id' = tenant_id::text AND
        (auth.jwt()->>'role') IN ('admin','super_admin')
      );
    COMMENT ON POLICY feature_flag_audit_select_admin ON public.feature_flag_audit IS 'Admins of the tenant can view all audit rows.';

    DROP POLICY IF EXISTS feature_flag_audit_select_user ON public.feature_flag_audit;
    CREATE POLICY feature_flag_audit_select_user ON public.feature_flag_audit
      FOR SELECT USING (
        auth.jwt()->>'tenant_id' = tenant_id::text AND
        auth.uid() = user_id
      );
    COMMENT ON POLICY feature_flag_audit_select_user ON public.feature_flag_audit IS 'Users can view their own audit entries within their tenant.';

    DROP POLICY IF EXISTS feature_flag_audit_insert ON public.feature_flag_audit;
    CREATE POLICY feature_flag_audit_insert ON public.feature_flag_audit
      FOR INSERT WITH CHECK (
        auth.jwt()->>'role' = 'service_role'
      );
    COMMENT ON POLICY feature_flag_audit_insert ON public.feature_flag_audit IS 'Only service role (Edge functions/RPC) may insert audit rows.';
  END IF;
END $$;

-- 5. Secure view for public feature flags
CREATE OR REPLACE VIEW public.feature_flags_public_view
WITH (security_invoker = true) AS
SELECT *
FROM public.feature_flags
WHERE
  enabled = true AND
  auth.jwt()->>'tenant_id' = tenant_id::text AND
  (start_date IS NULL OR start_date <= now()) AND
  (end_date IS NULL OR end_date >= now()) AND
  (
    (auth.jwt()->>'env') IS NOT NULL AND auth.jwt()->>'env' = environment
    OR
    (auth.jwt()->>'env') IS NULL AND (
      environment = 'production'
      OR ((auth.jwt()->>'role') IN ('admin','super_admin') AND environment IN ('staging','development'))
    )
  );
COMMENT ON VIEW public.feature_flags_public_view IS 'Public view exposing active, enabled feature flags scoped to tenant and environment.';

COMMIT;
