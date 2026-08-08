-- =====================================================
-- DIGA - Reconcile Document Status Read Permissions
-- =====================================================
-- RLS policies on document_statuses already permit authenticated reads, but
-- PostgreSQL table privileges must also grant SELECT before RLS is evaluated.

GRANT SELECT ON public.document_statuses TO authenticated;
