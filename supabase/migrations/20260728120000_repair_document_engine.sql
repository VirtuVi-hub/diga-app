-- =====================================================
-- DIGA - Repair Document Engine
-- =====================================================

-- Provision the private bucket used by document revisions.
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public;

-- Atomically create a document and its first, current revision. PostgreSQL
-- rolls back all writes in this function if any statement raises an error.
CREATE OR REPLACE FUNCTION public.create_document_with_initial_revision(
    p_project_id UUID,
    p_document_name TEXT,
    p_document_type_name TEXT,
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
    v_document_type_id UUID;
    v_document_status_id UUID;
    v_revision_id UUID;
BEGIN
    SELECT id
    INTO v_document_type_id
    FROM public.document_types
    WHERE name = p_document_type_name
      AND active = TRUE;

    IF v_document_type_id IS NULL THEN
        RAISE EXCEPTION 'Active document type "%" does not exist', p_document_type_name;
    END IF;

    SELECT id
    INTO v_document_status_id
    FROM public.document_statuses
    WHERE code = 'DRAFT'
      AND active = TRUE;

    IF v_document_status_id IS NULL THEN
        RAISE EXCEPTION 'The active DRAFT document status does not exist';
    END IF;

    INSERT INTO public.documents (
        project_id,
        document_type_id,
        name,
        created_by,
        updated_by
    )
    VALUES (
        p_project_id,
        v_document_type_id,
        p_document_name,
        p_created_by,
        p_created_by
    )
    RETURNING id INTO v_document_id;

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
        '1.0',
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
    SET is_current = TRUE
    WHERE id = v_revision_id;

    RETURN v_document_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_document_with_initial_revision(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT, UUID
) TO authenticated;
