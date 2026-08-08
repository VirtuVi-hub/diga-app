-- ==========================================================
-- Fix Projects Permissions
-- ==========================================================

-- Allow authenticated users to access the table
grant usage on schema public to authenticated;

grant select, insert, update, delete
on table public.projects
to authenticated;

-- Enable Row Level Security
alter table public.projects enable row level security;

-- Remove old policies if they exist
drop policy if exists "Authenticated users can view projects"
on public.projects;

drop policy if exists "Authenticated users can insert projects"
on public.projects;

drop policy if exists "Authenticated users can update projects"
on public.projects;

drop policy if exists "Authenticated users can delete projects"
on public.projects;

-- Create policies
create policy "Authenticated users can view projects"
on public.projects
for select
to authenticated
using (true);

create policy "Authenticated users can insert projects"
on public.projects
for insert
to authenticated
with check (true);

create policy "Authenticated users can update projects"
on public.projects
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete projects"
on public.projects
for delete
to authenticated
using (true);