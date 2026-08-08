-- =====================================================
-- DIGA - Create Governance Rules (Sprint 5.7, Module 11)
-- =====================================================
-- Module 11 "Automatic Governance": users never manually choose
-- approvers. Delta determines governance automatically from Creator,
-- Object Type, Impact Analysis, Project Governance Rules, and
-- Delegations. This table is the generalized, wired version of the
-- pre-existing but never-wired `document_status_approval_requirements`
-- pattern (role_id x status x order x required) — same "which role(s)
-- must act" idea, generalized from document statuses to any governed
-- object type.
--
-- `object_type` is deliberately an open string (e.g. 'requirement',
-- 'decision', 'agreement', 'drawing_revision', 'constraint', 'preference',
-- 'risk'), never an enum — matches this codebase's existing
-- EVENT_TYPES/DesignChangeType "open dictionary, adding a value is a data
-- change not an architecture change" convention. This is also what makes
-- the engine extensible to future object types (Meetings/RFIs/Site
-- Instructions, Module 11's own "future workflow" framing) without a
-- schema migration — just new rows.
--
-- `requirement_kind` is exactly 'approver' or 'notify' — Module 10
-- explicitly bans "Optional Approver", so there is no third value.
--
-- `trigger = 'on_impact'` rules only apply when Impact Analysis finds an
-- `impact` relationship for the object being governed (see
-- lib/governance/governance-roster.ts). Known limitation, documented here
-- and in the sprint doc: there is no per-discipline tag on `impact`
-- relationships yet, so an `on_impact` rule cannot distinguish a
-- structural impact from an MEP one — every on_impact role for that
-- object_type fires together.

CREATE TABLE public.governance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    object_type TEXT NOT NULL,

    required_role_id UUID NOT NULL
        REFERENCES public.roles(id)
        ON DELETE RESTRICT,

    requirement_kind TEXT NOT NULL
        CHECK (requirement_kind IN ('approver', 'notify')),

    trigger TEXT NOT NULL DEFAULT 'always'
        CHECK (trigger IN ('always', 'on_impact')),

    sort_order INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT governance_rules_unique_rule
        UNIQUE (object_type, required_role_id, requirement_kind)
);

COMMENT ON TABLE public.governance_rules IS
'Module 11: which role(s) must approve or be notified for a given governed object type, and whether that requirement always applies or only when Impact Analysis finds an impact relationship. Read by lib/governance/governance-roster.ts::computeGovernanceRoster(), a pure function computed live at read time -- this table is data, not a workflow engine.';

CREATE INDEX idx_governance_rules_object_type ON public.governance_rules(object_type);

ALTER TABLE public.governance_rules
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view governance rules"
ON public.governance_rules
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert governance rules"
ON public.governance_rules
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update governance rules"
ON public.governance_rules
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_rules TO authenticated, service_role;
