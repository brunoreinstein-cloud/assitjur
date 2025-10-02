-- ============================================
-- FASE 1: CONSOLIDAÇÃO DE ROLES E SISTEMA DE ASSENTOS
-- ============================================

-- 1. Criar tabela members consolidada
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role user_role NOT NULL,
  data_access_level data_access_level NOT NULL DEFAULT 'MASKED',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- 2. Migrar dados de profiles para members
INSERT INTO public.members (org_id, user_id, role, data_access_level, status, created_at, updated_at)
SELECT 
  organization_id,
  user_id,
  role,
  COALESCE(data_access_level, 'MASKED'::data_access_level),
  CASE WHEN is_active THEN 'active' ELSE 'inactive' END,
  created_at,
  updated_at
FROM public.profiles
WHERE organization_id IS NOT NULL
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3. Criar tabela seats para controle de assentos
CREATE TABLE IF NOT EXISTS public.seats (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  included_admins INTEGER NOT NULL DEFAULT 1,
  included_viewers INTEGER NOT NULL DEFAULT 2,
  included_analysts INTEGER NOT NULL DEFAULT 0,
  extra_admins INTEGER NOT NULL DEFAULT 0,
  extra_viewers INTEGER NOT NULL DEFAULT 0,
  extra_analysts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Criar seats para orgs existentes
INSERT INTO public.seats (org_id, included_admins, included_viewers)
SELECT id, 1, 2
FROM public.organizations
ON CONFLICT (org_id) DO NOTHING;

-- 5. Criar tabela plan_catalog
CREATE TABLE IF NOT EXISTS public.plan_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  included_admins INTEGER NOT NULL DEFAULT 1,
  included_viewers INTEGER NOT NULL DEFAULT 2,
  included_analysts INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Inserir planos básicos
INSERT INTO public.plan_catalog (key, name, description, price_cents, included_admins, included_viewers, included_analysts, features, limits)
VALUES 
  ('starter', 'Starter', 'Plano básico com funcionalidades essenciais', 0, 1, 2, 0, 
   '{"witness_map": true, "ai_assistant": false, "exports": true}',
   '{"ai_queries_per_day": 0, "cases_limit": 10, "attachments_per_case": 5}'),
  ('pro', 'Professional', 'Plano profissional com IA e assentos flexíveis', 49900, 1, 5, 1,
   '{"witness_map": true, "ai_assistant": true, "exports": true, "advanced_analytics": true}',
   '{"ai_queries_per_day": 100, "cases_limit": -1, "attachments_per_case": 50}'),
  ('business', 'Business', 'Plano empresarial com SSO e auditoria avançada', 99900, 2, 10, 3,
   '{"witness_map": true, "ai_assistant": true, "exports": true, "advanced_analytics": true, "sso": true, "audit_advanced": true}',
   '{"ai_queries_per_day": -1, "cases_limit": -1, "attachments_per_case": -1}')
ON CONFLICT (key) DO NOTHING;

-- 7. Atualizar subscriptions para incluir plan_key
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan_key TEXT REFERENCES public.plan_catalog(key);

-- 8. Criar função segura para checar role (security definer)
CREATE OR REPLACE FUNCTION public.has_member_role(_user_id UUID, _org_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.members
    WHERE user_id = _user_id
      AND org_id = _org_id
      AND role = _role
      AND status = 'active'
  );
$$;

-- 9. Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_member_role(_user_id UUID, _org_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.members
  WHERE user_id = _user_id
    AND org_id = _org_id
    AND status = 'active'
  LIMIT 1;
$$;

-- 10. Criar função para checar se pode adicionar membro
CREATE OR REPLACE FUNCTION public.can_add_member(_org_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caps AS (
    SELECT
      included_admins + extra_admins AS cap_admin,
      included_viewers + extra_viewers AS cap_viewer,
      included_analysts + extra_analysts AS cap_analyst
    FROM seats 
    WHERE org_id = _org_id
  ),
  usage AS (
    SELECT
      SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS used_admin,
      SUM(CASE WHEN role = 'VIEWER' THEN 1 ELSE 0 END) AS used_viewer,
      SUM(CASE WHEN role = 'ANALYST' THEN 1 ELSE 0 END) AS used_analyst
    FROM members 
    WHERE org_id = _org_id 
      AND status = 'active'
  )
  SELECT CASE
    WHEN _role = 'ADMIN' THEN (usage.used_admin < caps.cap_admin)
    WHEN _role = 'VIEWER' THEN (usage.used_viewer < caps.cap_viewer)
    WHEN _role = 'ANALYST' THEN (usage.used_analyst < caps.cap_analyst)
  END
  FROM caps, usage;
$$;

-- 11. Criar trigger para enforcement de quota de assentos
CREATE OR REPLACE FUNCTION public.enforce_seat_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.status = 'active' AND NOT can_add_member(NEW.org_id, NEW.role) THEN
      RAISE EXCEPTION 'Seat quota exceeded for role %. Please upgrade your plan or remove inactive users.', NEW.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_seat_quota
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION enforce_seat_quota();

-- 12. Trigger para atualizar updated_at
CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_seats_updated_at
BEFORE UPDATE ON public.seats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_plan_catalog_updated_at
BEFORE UPDATE ON public.plan_catalog
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 13. Enable RLS em members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 14. RLS Policies para members
CREATE POLICY "Users can view members of their organization"
ON public.members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

CREATE POLICY "Admins can manage members in their organization"
ON public.members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = members.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
);

CREATE POLICY "Service role has full access to members"
ON public.members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 15. Enable RLS em seats
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

-- 16. RLS Policies para seats
CREATE POLICY "Users can view seats of their organization"
ON public.seats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

CREATE POLICY "Admins can manage seats in their organization"
ON public.seats
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.org_id = seats.org_id
      AND m.user_id = auth.uid()
      AND m.role = 'ADMIN'
      AND m.status = 'active'
  )
);

CREATE POLICY "Service role has full access to seats"
ON public.seats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 17. Enable RLS em plan_catalog
ALTER TABLE public.plan_catalog ENABLE ROW LEVEL SECURITY;

-- 18. RLS Policy para plan_catalog (todos podem ler planos ativos)
CREATE POLICY "Anyone can view active plans"
ON public.plan_catalog
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Service role has full access to plan_catalog"
ON public.plan_catalog
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 19. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_members_org_id ON public.members(org_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_org_user ON public.members(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status) WHERE status = 'active';

-- 20. Comentários para documentação
COMMENT ON TABLE public.members IS 'Tabela consolidada de membros de organizações com roles e níveis de acesso';
COMMENT ON TABLE public.seats IS 'Controle de assentos (seats) por organização';
COMMENT ON TABLE public.plan_catalog IS 'Catálogo de planos disponíveis';
COMMENT ON FUNCTION public.has_member_role IS 'Verifica se um usuário tem um role específico em uma organização';
COMMENT ON FUNCTION public.can_add_member IS 'Verifica se há quota disponível para adicionar um membro com determinado role';