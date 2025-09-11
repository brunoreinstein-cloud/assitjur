-- Purpose: Enforce strict RLS on financial tables and restrict access to finance/admin only.
-- Risk addressed: PUBLIC_FINANCIAL_DATA
-- Strategy:
--  - Deny-by-default with ENABLE RLS + restrictive policies
--  - Allow only service_role (bypass) and users tagged as finance/admin
--  - Prefer JWT claim 'role' when present; fallback to profiles.role; final fallback: finance_users whitelist

-- 0) Optional: data classification
COMMENT ON TABLE public.cogs_monthly  IS 'CLASSIFICATION: CONFIDENTIAL | COGS monthly costs';
COMMENT ON TABLE public.opex_monthly  IS 'CLASSIFICATION: CONFIDENTIAL | OPEX monthly costs';
COMMENT ON TABLE public.invoices      IS 'CLASSIFICATION: CONFIDENTIAL | Customer invoices';
COMMENT ON TABLE public.subscriptions IS 'CLASSIFICATION: CONFIDENTIAL | Subscription details';

-- 1) Fallback whitelist if profiles/roles are not available
CREATE TABLE IF NOT EXISTS public.finance_users (
  user_id uuid PRIMARY KEY
);

-- Helper function to decide if the caller is finance/admin
-- Priority: JWT claim 'role' -> profiles.role -> finance_users
CREATE OR REPLACE FUNCTION public.is_finance_or_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
WITH from_jwt AS (
  SELECT COALESCE(NULLIF(auth.jwt() ->> 'role', ''), '') AS jwt_role
),
from_profiles AS (
  SELECT p.role::text AS role
  FROM public.profiles p
  WHERE p.user_id = uid
),
role_union AS (
  SELECT
    COALESCE(NULLIF((SELECT jwt_role FROM from_jwt), ''), (SELECT role FROM from_profiles)) AS role_guess
)
SELECT
  CASE
    WHEN lower((SELECT role_guess FROM role_union)) IN ('finance','admin') THEN TRUE
    WHEN EXISTS (SELECT 1 FROM public.finance_users fu WHERE fu.user_id = uid) THEN TRUE
    ELSE FALSE
  END;
$$;

-- 2) Enable RLS on all target tables
ALTER TABLE public.cogs_monthly  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opex_monthly  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3) Drop existing permissive policies (if any) to avoid conflicts
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('cogs_monthly','opex_monthly','invoices','subscriptions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 4) Create strict policies (deny by default; allow only finance/admin)
-- SELECT
CREATE POLICY cogs_sel_finance
  ON public.cogs_monthly
  FOR SELECT
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY opex_sel_finance
  ON public.opex_monthly
  FOR SELECT
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY invoices_sel_finance
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY subs_sel_finance
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

-- INSERT
CREATE POLICY cogs_ins_finance
  ON public.cogs_monthly
  FOR INSERT
  TO authenticated
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY opex_ins_finance
  ON public.opex_monthly
  FOR INSERT
  TO authenticated
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY invoices_ins_finance
  ON public.invoices
  FOR INSERT
  TO authenticated
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY subs_ins_finance
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

-- UPDATE
CREATE POLICY cogs_upd_finance
  ON public.cogs_monthly
  FOR UPDATE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) )
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY opex_upd_finance
  ON public.opex_monthly
  FOR UPDATE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) )
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY invoices_upd_finance
  ON public.invoices
  FOR UPDATE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) )
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY subs_upd_finance
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) )
  WITH CHECK ( public.is_finance_or_admin(auth.uid()) );

-- DELETE
CREATE POLICY cogs_del_finance
  ON public.cogs_monthly
  FOR DELETE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY opex_del_finance
  ON public.opex_monthly
  FOR DELETE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY invoices_del_finance
  ON public.invoices
  FOR DELETE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

CREATE POLICY subs_del_finance
  ON public.subscriptions
  FOR DELETE
  TO authenticated
  USING ( public.is_finance_or_admin(auth.uid()) );

-- 5) Safety net: ensure no PUBLIC grants remain
REVOKE ALL ON public.cogs_monthly  FROM PUBLIC;
REVOKE ALL ON public.opex_monthly  FROM PUBLIC;
REVOKE ALL ON public.invoices      FROM PUBLIC;
REVOKE ALL ON public.subscriptions FROM PUBLIC;

-- Optional: ensure authenticated has no blanket privileges beyond policies
REVOKE ALL ON public.cogs_monthly  FROM authenticated;
REVOKE ALL ON public.opex_monthly  FROM authenticated;
REVOKE ALL ON public.invoices      FROM authenticated;
REVOKE ALL ON public.subscriptions FROM authenticated;

-- Note: service_role bypasses RLS via PostgREST; no policy needed for it.
