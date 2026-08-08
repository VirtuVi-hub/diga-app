-- =====================================================
-- DIGA - Fix Firm/People/Project Permissions
-- =====================================================
-- Discovered live during Sprint 5.3's own end-to-end verification: this
-- project's `auto_expose_new_tables` behavior (see supabase/config.toml)
-- means RLS policies alone are not sufficient — a table also needs an
-- EXPLICIT grant, exactly the pattern
-- `20260723107000_fix_projects_permissions.sql` and
-- `20260725100000_fix_application_permissions.sql` already established for
-- `projects`/`requirements`. Those two migrations never covered
-- `people`/`firms`/`roles`/`team_types`/`project_team` (or `service_role`
-- at all — `createServiceSupabaseClient()` was unused infrastructure until
-- this sprint's registration flow became the first real caller). A real
-- `42501 permission denied for table people` error surfaced this while
-- testing `ensurePersonForAuthUser()` against the real hosted project —
-- fixed here, not worked around.

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firms TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_members TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.firm_invitations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_types TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_team TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated, service_role;
