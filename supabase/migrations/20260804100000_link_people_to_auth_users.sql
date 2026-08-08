-- =====================================================
-- DIGA - Link People to Supabase Auth Users
-- =====================================================
-- Per docs/database/schema-review.md's own "Emerging Architecture
-- Decisions": each authenticated user owns exactly one professional
-- profile (a `people` row). Nullable because legacy/seeded people rows
-- (e.g. the Samir Vihar demo team) are not real authenticated users.

ALTER TABLE public.people
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX people_auth_user_id_key
ON public.people(auth_user_id)
WHERE auth_user_id IS NOT NULL;

COMMENT ON COLUMN public.people.auth_user_id IS
'Links a professional profile to its Supabase Auth account. One person, one auth account (docs/architecture/002-authentication-and-authorization.md).';
