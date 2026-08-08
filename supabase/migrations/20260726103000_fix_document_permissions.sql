-- =====================================================
-- DIGA - Fix Document Permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.documents
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.document_revisions
TO authenticated;

GRANT SELECT
ON public.document_types
TO authenticated;

ALTER TABLE public.documents
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.document_revisions
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.document_types
ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view documents"
ON public.documents;

CREATE POLICY "Authenticated users can view documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert documents"
ON public.documents;

CREATE POLICY "Authenticated users can insert documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update documents"
ON public.documents;

CREATE POLICY "Authenticated users can update documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete documents"
ON public.documents;

CREATE POLICY "Authenticated users can delete documents"
ON public.documents
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view document revisions"
ON public.document_revisions;

CREATE POLICY "Authenticated users can view document revisions"
ON public.document_revisions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert document revisions"
ON public.document_revisions;

CREATE POLICY "Authenticated users can insert document revisions"
ON public.document_revisions
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update document revisions"
ON public.document_revisions;

CREATE POLICY "Authenticated users can update document revisions"
ON public.document_revisions
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete document revisions"
ON public.document_revisions;

CREATE POLICY "Authenticated users can delete document revisions"
ON public.document_revisions
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can view document types"
ON public.document_types;

CREATE POLICY "Authenticated users can view document types"
ON public.document_types
FOR SELECT
TO authenticated
USING (true);