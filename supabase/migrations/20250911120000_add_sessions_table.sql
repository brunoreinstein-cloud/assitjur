-- Create sessions table for contextual logins
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_label text,
  last_ip inet,
  last_seen timestamptz default now(),
  risk_score integer default 0,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

create policy "Users can view own sessions" on public.sessions
  for select using (auth.uid() = user_id);

create policy "Users can delete own sessions" on public.sessions
  for delete using (auth.uid() = user_id);

create policy "Users can update own sessions" on public.sessions
  for update using (auth.uid() = user_id);
