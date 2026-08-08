-- =====================================================
-- DIGA - Create Document Revision
-- =====================================================
-- This is the Document Engine's atomic revision operation. The document row
-- lock serializes concurrent uploads and the function transaction rolls back
-- both the current-revision change and new metadata on any failure.

CREATE OR REPLACE FUNCTION public.create_document_revision(
    p_project_id UUID,
    p_document_id UUID,
    p_storage_path TEXT,
    p_original_filename TEXT,
    p_file_extension TEXT,
    p_mime_type TEXT,
    p_file_size BIGINT,
    p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_document_id UUID;
    v_document_status_id UUID;
    v_revision_id UUID;
    v_revision_count INTEGER;
BEGIN
    SELECT id
    INTO v_document_id
    FROM public.documents
    WHERE id = p_document_id
      AND project_id = p_project_id
      AND active = TRUE
    FOR UPDATE;

    IF v_document_id IS NULL THEN
        RAISE EXCEPTION 'Active document "%" does not belong to project "%"',
            p_document_id, p_project_id;
    END IF;

    SELECT id
    INTO v_document_status_id
    FROM public.document_statuses
    WHERE code = 'DRAFT'
      AND active = TRUE;

    IF v_document_status_id IS NULL THEN
        RAISE EXCEPTION 'The active DRAFT document status does not exist';
    END IF;

    SELECT COUNT(*)
    INTO v_revision_count
    FROM public.document_revisions
    WHERE document_id = v_document_id;

    INSERT INTO public.document_revisions (
        document_id,
        revision,
        document_status_id,
        storage_path,
        original_filename,
        file_extension,
        mime_type,
        file_size,
        is_current,
        created_by,
        updated_by
    )
    VALUES (
        v_document_id,
        format('1.%s', v_revision_count),
        v_document_status_id,
        p_storage_path,
        p_original_filename,
        p_file_extension,
        p_mime_type,
        p_file_size,
        FALSE,
        p_created_by,
        p_created_by
    )
    RETURNING id INTO v_revision_id;

    UPDATE public.document_revisions
    SET is_current = FALSE
    WHERE document_id = v_document_id
      AND is_current = TRUE;

    UPDATE public.document_revisions
    SET is_current = TRUE
    WHERE id = v_revision_id;

    RETURN v_revision_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_document_revision(
    UUID, UUID, TEXT, TEXT, TEXT, TEXT, BIGINT, UUID
) TO authenticated;
