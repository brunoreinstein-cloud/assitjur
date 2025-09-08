-- Rate limiting table and function
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_ms bigint
) returns boolean
language plpgsql
as $$
declare
  v_now timestamptz := now();
  v_reset timestamptz := v_now + (p_window_ms::text || ' milliseconds')::interval;
  v_row public.rate_limits;
begin
  select * into v_row from public.rate_limits where key = p_key for update;
  if not found then
    insert into public.rate_limits(key, count, reset_at)
    values (p_key, 1, v_reset);
    return true;
  end if;
  if v_row.reset_at <= v_now then
    update public.rate_limits set count = 1, reset_at = v_reset where key = p_key;
    return true;
  end if;
  if v_row.count < p_limit then
    update public.rate_limits set count = v_row.count + 1 where key = p_key;
    return true;
  end if;
  return false;
end;
$$;
