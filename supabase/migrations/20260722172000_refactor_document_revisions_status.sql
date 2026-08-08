-- =====================================================
-- DIGA - Refactor Document Revisions Status
-- =====================================================

-- Remove the old free-text status column if it exists
ALTER TABLE public.document_revisions
DROP COLUMN IF EXISTS status;

-- Add the new foreign key column (initially nullable)
ALTER TABLE public.document_revisions
ADD COLUMN document_status_id UUID;

-- Create the foreign key relationship
ALTER TABLE public.document_revisions
ADD CONSTRAINT fk_document_revisions_document_status
FOREIGN KEY (document_status_id)
REFERENCES public.document_statuses(id)
ON UPDATE CASCADE
ON DELETE RESTRICT;

-- Index for faster lookups
CREATE INDEX idx_document_revisions_document_status_id
ON public.document_revisions(document_status_id);

COMMENT ON COLUMN public.document_revisions.document_status_id IS
'References the workflow status of this document revision.';