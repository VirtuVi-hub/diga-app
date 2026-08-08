-- ==========================================================
-- Fix Requirements Permissions
-- ==========================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.requirements
to authenticated;

alter table public.requirements enable row level security;

drop policy if exists "Authenticated users can view requirements"
on public.requirements;

drop policy if exists "Authenticated users can insert requirements"
on public.requirements;

drop policy if exists "Authenticated users can update requirements"
on public.requirements;

drop policy if exists "Authenticated users can delete requirements"
on public.requirements;

create policy "Authenticated users can view requirements"
on public.requirements
for select
to authenticated
using (true);

create policy "Authenticated users can insert requirements"
on public.requirements
for insert
to authenticated
with check (true);

create policy "Authenticated users can update requirements"
on public.requirements
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete requirements"
on public.requirements
for delete
to authenticated
using (true);