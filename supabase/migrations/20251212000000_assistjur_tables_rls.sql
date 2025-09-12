-- Migration: Add org_id-based RLS to assistjur tables
-- Description: Rename tenant_id to org_id where needed and enforce RLS by org and role.

-- 1. Ensure org_id columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'assistjur' AND table_name = 'processos' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE assistjur.processos RENAME COLUMN tenant_id TO org_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'assistjur' AND table_name = 'testemunhas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE assistjur.testemunhas RENAME COLUMN tenant_id TO org_id;
  END IF;
END $$;

-- 2. Create provas table if missing
CREATE TABLE IF NOT EXISTS assistjur.provas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES assistjur.processos(id) ON DELETE CASCADE,
  descricao text,
  org_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE assistjur.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur.testemunhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistjur.provas ENABLE ROW LEVEL SECURITY;

-- 4. Policies for processos
DROP POLICY IF EXISTS processos_org_rls ON assistjur.processos;
CREATE POLICY processos_org_rls ON assistjur.processos
  FOR ALL TO authenticated
  USING (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  )
  WITH CHECK (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  );

-- 5. Policies for testemunhas
DROP POLICY IF EXISTS testemunhas_org_rls ON assistjur.testemunhas;
CREATE POLICY testemunhas_org_rls ON assistjur.testemunhas
  FOR ALL TO authenticated
  USING (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  )
  WITH CHECK (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  );

-- 6. Policies for provas
DROP POLICY IF EXISTS provas_org_rls ON assistjur.provas;
CREATE POLICY provas_org_rls ON assistjur.provas
  FOR ALL TO authenticated
  USING (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  )
  WITH CHECK (
    auth.jwt()->>'org_id' = org_id::text AND
    lower(auth.jwt()->>'role') IN ('admin','advogado','estagiario','financeiro')
  );

-- 7. Indexes to support org-based lookups
CREATE INDEX IF NOT EXISTS idx_assistjur_processos_org ON assistjur.processos(org_id);
CREATE INDEX IF NOT EXISTS idx_assistjur_testemunhas_org ON assistjur.testemunhas(org_id);
CREATE INDEX IF NOT EXISTS idx_assistjur_provas_org ON assistjur.provas(org_id);
