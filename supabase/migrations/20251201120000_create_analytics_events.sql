-- Create analytics_events table for tracking user actions
create table if not exists public.analytics_events (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  ts timestamptz not null default timezone('utc', now())
);

-- Index for querying by event type
create index if not exists analytics_events_event_idx
  on public.analytics_events(event);

-- Enable RLS and add policies ensuring consent and admin visibility
alter table public.analytics_events enable row level security;

-- Users can insert their own events only if analytics consent is granted
create policy "Users can insert analytics events with consent"
  on public.analytics_events for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.lgpd_consent c
      where c.user_id = auth.uid() and c.analytics = true
    )
  );

-- Admins may read events for metrics
create policy "Admins can view analytics events"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid() and p.role = 'ADMIN'
    )
  );
