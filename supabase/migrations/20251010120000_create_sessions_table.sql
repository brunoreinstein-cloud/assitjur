create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    device_label text,
    last_ip text,
    last_seen timestamptz default now(),
    risk_score int default 0
);
