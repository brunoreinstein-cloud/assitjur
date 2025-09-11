BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  value_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key),
  CONSTRAINT platform_settings_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_select ON public.platform_settings;
CREATE POLICY platform_settings_select ON public.platform_settings
  FOR SELECT
  USING (auth.jwt()->>'tenant_id' = tenant_id::text);

DROP POLICY IF EXISTS platform_settings_insert ON public.platform_settings;
CREATE POLICY platform_settings_insert ON public.platform_settings
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'tenant_id' = tenant_id::text AND
    (auth.jwt()->>'role') IN ('admin','super_admin')
  );

DROP POLICY IF EXISTS platform_settings_update ON public.platform_settings;
CREATE POLICY platform_settings_update ON public.platform_settings
  FOR UPDATE
  USING (
    auth.jwt()->>'tenant_id' = tenant_id::text AND
    (auth.jwt()->>'role') IN ('admin','super_admin')
  )
  WITH CHECK (auth.jwt()->>'tenant_id' = tenant_id::text);

DROP POLICY IF EXISTS platform_settings_delete ON public.platform_settings;
CREATE POLICY platform_settings_delete ON public.platform_settings
  FOR DELETE
  USING (
    auth.jwt()->>'tenant_id' = tenant_id::text AND
    (auth.jwt()->>'role') IN ('admin','super_admin')
  );

COMMENT ON TABLE public.platform_settings IS 'Tenant-scoped platform settings stored as jsonb values.';

COMMIT;
