-- Create table to persist rate limiting counters
create table if not exists public.rate_limits (
  identifier text primary key,
  request_count integer not null default 0,
  window_start timestamptz not null default now()
);
