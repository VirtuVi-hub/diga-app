-- =====================================================
-- DIGA - Seed Onboarding Document Types (Module 3)
-- =====================================================
-- `lib/document-classification.ts`'s `isAdministrativeDocumentType()` has
-- referenced "Brief" and "BOQ" as document type names since before this
-- sprint, but `20260726113000_seed_document_reference_data.sql` never
-- actually seeded either — a pre-existing gap this sprint's onboarding
-- Documents step (Module 3) needs closed, since "Client Brief" and "BOQ"
-- are two of its explicit upload categories.

INSERT INTO public.document_types (name, description, active)
VALUES
    ('Brief', 'Client brief and requirements documents.', TRUE),
    ('BOQ', 'Bill of Quantities.', TRUE)
ON CONFLICT (name) DO NOTHING;
