-- =====================================================
-- DIGA - Backfill People for Pre-Existing Auth Users
-- =====================================================
-- Root cause of the "Profile not found" regression on /firm: the migration
-- that introduced `people.auth_user_id` (20260804100000_link_people_to_
-- auth_users.sql) only added the column — it never backfilled a `people`
-- row for any `auth.users` row that already existed before that column (and
-- the whole registration/profile-linking system, Sprint 5.3) did. One real
-- account (created 2026-07-22, 13 days before that migration) predates the
-- entire architecture and never went through `registerUser()` — the only
-- code path that calls `ensurePersonForAuthUser()` — so it was never given
-- a profile. This is a one-time historical-data reconciliation, not a
-- runtime fallback: it reuses the exact same "full name, else email"
-- derivation `ensurePersonForAuthUser()` already applies at registration
-- time (lib/auth/current-person.ts), just expressed once in SQL for rows
-- that predate that function ever running for them.
--
-- Idempotent: only inserts for an `auth.users` row that has no matching
-- `people.auth_user_id` yet, so re-running this migration (or it coexisting
-- with any future real registration) can never create a duplicate profile.

INSERT INTO public.people (auth_user_id, first_name, last_name, email)
SELECT
    u.id,
    COALESCE(NULLIF(split_part(trim(u.raw_user_meta_data->>'full_name'), ' ', 1), ''), u.email) AS first_name,
    CASE
        WHEN trim(u.raw_user_meta_data->>'full_name') IS NULL OR position(' ' IN trim(u.raw_user_meta_data->>'full_name')) = 0
            THEN ''
        ELSE substring(trim(u.raw_user_meta_data->>'full_name') FROM position(' ' IN trim(u.raw_user_meta_data->>'full_name')) + 1)
    END AS last_name,
    u.email
FROM auth.users u
LEFT JOIN public.people p ON p.auth_user_id = u.id
WHERE p.id IS NULL;
