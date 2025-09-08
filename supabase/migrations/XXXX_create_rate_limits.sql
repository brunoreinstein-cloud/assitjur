BEGIN;
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '1 minute',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rate_limits_expires_idx on public.rate_limits (expires_at);
-- Política simples (RLS opcional, pois escrita será via função com service role ou RLS do usuário)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rate_limits_rw ON public.rate_limits;
CREATE POLICY rate_limits_rw ON public.rate_limits
  FOR ALL USING (true) WITH CHECK (true);
COMMIT;
