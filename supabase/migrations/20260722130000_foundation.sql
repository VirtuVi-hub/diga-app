
-- ==========================================================
-- DIGA Database Foundation
-- Migration: Foundation
-- ==========================================================

create extension if not exists "pgcrypto";

-- ==========================================================
-- Shared Trigger Functions
-- ==========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create or replace function public.set_updated_by()
returns trigger
language plpgsql
security definer
as $$
begin
    new.updated_by = auth.uid();
    return new;
end;
$$;

comment on function public.set_updated_at()
is 'Automatically updates updated_at timestamp';

comment on function public.set_updated_by()
is 'Automatically updates updated_by user id';

-- ==========================================================
-- NOTE
-- This is the foundation portion only.
-- The remaining master data tables (people, team_types,
-- roles, project_team) should be added in subsequent
-- migrations to keep each migration reviewable.
-- ==========================================================

create table if not exists public.companies (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    short_name text,

    website text,
    email text,
    phone text,

    notes text,

    active boolean not null default true,

    created_at timestamptz not null default now(),
    created_by uuid references auth.users(id),

    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id)
);

create unique index if not exists companies_name_idx
    on public.companies (lower(name));

create index if not exists companies_active_idx
    on public.companies (active);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists companies_set_updated_by on public.companies;
create trigger companies_set_updated_by
before update on public.companies
for each row
execute function public.set_updated_by();

alter table public.companies enable row level security;

drop policy if exists "Authenticated users can view companies" on public.companies;
create policy "Authenticated users can view companies"
on public.companies
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert companies" on public.companies;
create policy "Authenticated users can insert companies"
on public.companies
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update companies" on public.companies;
create policy "Authenticated users can update companies"
on public.companies
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete companies" on public.companies;
create policy "Authenticated users can delete companies"
on public.companies
for delete
to authenticated
using (true);
