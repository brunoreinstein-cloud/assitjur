-- Extension and table for rate limiting hits
create extension if not exists pgcrypto;

create schema if not exists assistjur;

create table if not exists assistjur.rate_limit_hits (
  id text not null,
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_id_route_created_at_idx
  on assistjur.rate_limit_hits (id, route, created_at);
