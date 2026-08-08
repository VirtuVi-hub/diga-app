-- =====================================================
-- DIGA - Add Onboarding Discussion Id (Module 4)
-- =====================================================
-- Every Knowledge Object requires a `discussionId` (Sprint 3.6A's own
-- architecture, deliberately not loosened — see Sprint 5.0's identical
-- decision for Revision Intelligence). One shared Discussion anchors every
-- Knowledge Object the Client Questionnaire produces for a project. Not a
-- Postgres FK: `Discussion` lives in the same in-memory mock repository
-- every intelligence sprint already uses, not a Postgres table.

ALTER TABLE public.project_onboarding
ADD COLUMN discussion_id TEXT;
