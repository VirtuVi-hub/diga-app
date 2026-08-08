-- =====================================================
-- DIGA - Extend Projects for Onboarding (Module 1)
-- =====================================================
-- Step 1 "Project Details" fields not already covered by Sprint 5.3's
-- wizard columns (`client`/`location`/`type`/`scope`/`timeline`/`budget`
-- already exist and are reused directly).

ALTER TABLE public.projects
ADD COLUMN project_stage TEXT,
ADD COLUMN gross_floor_area NUMERIC,
ADD COLUMN target_completion_date DATE,
ADD COLUMN time_zone TEXT;
