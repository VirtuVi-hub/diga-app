-- =====================================================
-- DIGA - Extend Projects for the Creation Wizard
-- =====================================================
-- Module 4 (Project Creation Wizard) and docs/architecture/002's Project
-- Owner concept ("The Lead Architect who creates a Project automatically
-- becomes its Project Owner"). `type` already exists and is reused
-- directly as the wizard's "Building Type" field — no redundant column.
-- All new columns are nullable: existing rows (e.g. the Samir Vihar demo
-- project, created before this sprint) simply have no Firm/owner/scope
-- recorded, which is honest, not a migration-time fabrication.

ALTER TABLE public.projects
ADD COLUMN firm_id UUID REFERENCES public.firms(id) ON DELETE SET NULL,
ADD COLUMN owner_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
ADD COLUMN created_by UUID REFERENCES public.people(id) ON DELETE SET NULL,
ADD COLUMN scope TEXT,
ADD COLUMN timeline TEXT,
ADD COLUMN budget NUMERIC;

CREATE INDEX idx_projects_firm ON public.projects(firm_id);

COMMENT ON COLUMN public.projects.owner_id IS
'The Project Owner (docs/architecture/002-authentication-and-authorization.md) — the person who created this project via the wizard. Ownership transfer/deletion rights are not implemented this sprint (no permission engine).';
