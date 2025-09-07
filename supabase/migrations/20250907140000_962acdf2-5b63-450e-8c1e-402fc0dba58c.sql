-- Create tables processos, testemunhas, usuarios
create table if not exists public.processos (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null,
    numero text not null,
    classe text not null,
    segredo_justica boolean default false,
    created_at timestamptz default now()
);

create table if not exists public.testemunhas (
    id uuid primary key default gen_random_uuid(),
    processo_id uuid references public.processos(id) on delete cascade,
    nome text not null,
    email text,
    telefone text,
    risco_sensibilidade int
);

create table if not exists public.usuarios (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null,
    role text
);

-- Enable row level security
alter table public.processos enable row level security;
alter table public.testemunhas enable row level security;
alter table public.usuarios enable row level security;

-- Policies: usuarios only read rows from same org
create policy "org_read_processos"
    on public.processos
    for select
    using (auth.jwt() ->> 'org_id' = org_id::text);

create policy "org_read_usuarios"
    on public.usuarios
    for select
    using (auth.jwt() ->> 'org_id' = org_id::text);

create policy "org_read_testemunhas"
    on public.testemunhas
    for select
    using (
        exists (
            select 1 from public.processos p
            where p.id = testemunhas.processo_id
            and auth.jwt() ->> 'org_id' = p.org_id::text
        )
    );

-- View with masked names when processo is under segredo de justiça
create or replace view public.vw_testemunhas_publicas as
select
    t.id,
    t.processo_id,
    case when p.segredo_justica then left(t.nome,1) || repeat('*', greatest(length(t.nome)-1,0)) else t.nome end as nome,
    t.email,
    t.telefone,
    t.risco_sensibilidade
from public.testemunhas t
join public.processos p on p.id = t.processo_id;
