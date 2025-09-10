-- Create table for analytics events
create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  event text not null,
  metadata jsonb,
  ts timestamptz not null default timezone('utc', now())
);

-- Indexes to optimize queries
create index if not exists analytics_events_ts_idx on public.analytics_events(ts);
create index if not exists analytics_events_event_idx on public.analytics_events(event);

-- Aggregate function to summarize events between two timestamps
create or replace function public.analytics_events_summary(start_ts timestamptz, end_ts timestamptz)
returns table(event text, count bigint) language sql stable as $$
  select event, count(*)::bigint
  from public.analytics_events
  where ts between start_ts and end_ts
  group by event;
$$;
