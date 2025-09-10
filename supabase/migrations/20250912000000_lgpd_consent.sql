-- Create table for storing LGPD consent with audit trail
create table if not exists public.lgpd_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analytics boolean default false,
  marketing boolean default false,
  sharing boolean default false,
  retention_period_days integer default 365,
  legal_basis text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- History table for auditing changes
create table if not exists public.lgpd_consent_history (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  analytics boolean,
  marketing boolean,
  sharing boolean,
  retention_period_days integer,
  legal_basis text,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.log_lgpd_consent_changes() returns trigger as $$
begin
  insert into public.lgpd_consent_history(user_id, analytics, marketing, sharing, retention_period_days, legal_basis, updated_at)
  values(old.user_id, old.analytics, old.marketing, old.sharing, old.retention_period_days, old.legal_basis, old.updated_at);
  return new;
end;
$$ language plpgsql;

create trigger lgpd_consent_audit
after update or delete on public.lgpd_consent
for each row execute function public.log_lgpd_consent_changes();
