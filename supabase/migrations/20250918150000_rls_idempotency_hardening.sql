-- Purpose: RLS idempotency hardening without changing effective access
-- This migration ensures RLS is enabled and expected policies exist, using guards to avoid conflicts

-- === processos ===
ALTER TABLE IF EXISTS public.processos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'processos' AND policyname = 'processos_admin_full_access'
  ) THEN
    CREATE POLICY "processos_admin_full_access"
    ON public.processos
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
          AND p.organization_id = processos.org_id
          AND p.role = 'ADMIN'
          AND p.is_active = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
          AND p.organization_id = processos.org_id
          AND p.role = 'ADMIN'
          AND p.is_active = true
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'processos' AND policyname = 'processos_authorized_read_only'
  ) THEN
    CREATE POLICY "processos_authorized_read_only"
    ON public.processos
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
          AND p.organization_id = processos.org_id
          AND p.is_active = true
          AND (p.data_access_level IN ('FULL', 'MASKED') OR p.role IN ('ADMIN', 'ANALYST'))
      )
      AND processos.deleted_at IS NULL
    );
  END IF;
END $$;

-- service_role has full access via PostgREST; explicit policies are not required, but keep existing ones intact.

-- === pessoas ===
ALTER TABLE IF EXISTS public.pessoas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pessoas' AND policyname = 'pessoas_strict_org_isolation'
  ) THEN
    CREATE POLICY "pessoas_strict_org_isolation"
    ON public.pessoas
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
          AND p.organization_id = pessoas.org_id
          AND p.is_active = true
          AND (
            p.role = 'ADMIN'::user_role OR p.data_access_level IN ('FULL'::data_access_level, 'MASKED'::data_access_level)
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.user_id = auth.uid()
          AND p.organization_id = pessoas.org_id
          AND p.is_active = true
          AND p.role = 'ADMIN'::user_role
      )
    );
  END IF;
END $$;

-- Note: This migration avoids dropping any existing policies to prevent conflicts in already-migrated environments.
--       It only ensures required policies exist and RLS is enabled.


