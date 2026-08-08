-- =====================================================
-- DIGA - Refactor Document Statuses
-- Remove hard-coded approval booleans
-- =====================================================

ALTER TABLE public.document_statuses
DROP COLUMN IF EXISTS requires_lead_architect_approval;

ALTER TABLE public.document_statuses
DROP COLUMN IF EXISTS requires_client_approval;