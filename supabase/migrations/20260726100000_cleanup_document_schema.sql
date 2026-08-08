-- =====================================================
-- DIGA - Cleanup Document Schema
-- =====================================================
--
-- Purpose
-- -------
-- Align the document schema with the final DIGA architecture.
--
-- A Document is a business object.
-- A Document Revision owns the physical file.
--
-- This migration:
--   1. Removes duplicated file metadata from documents.
--   2. Ensures only one current revision exists.
--
-- =====================================================

--------------------------------------------------------
-- Remove duplicated metadata from documents
--------------------------------------------------------

ALTER TABLE public.documents
DROP COLUMN IF EXISTS version;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS original_filename;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS storage_path;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS file_extension;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS mime_type;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS file_size;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS checksum;

ALTER TABLE public.documents
DROP COLUMN IF EXISTS uploaded_at;

--------------------------------------------------------
-- Ensure only one current revision per document
--------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_document_current_revision
ON public.document_revisions (document_id)
WHERE is_current = TRUE;

-- =====================================================
-- End
-- =====================================================