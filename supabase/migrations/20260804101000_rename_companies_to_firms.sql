-- =====================================================
-- DIGA - Rename Companies to Firms
-- =====================================================
-- docs/database/schema-review.md's own reviewed decision: "Rename the
-- business concept: companies to firms, to align with the approved
-- architecture. The structure of the table remains largely unchanged."
-- `companies` was schema-only prior to this sprint (no app code ever read
-- or wrote it), so renaming is safe. Existing trigger/policy names still
-- say "companies_*" — cosmetic only, left as-is rather than churning
-- objects that already work correctly.

ALTER TABLE public.companies RENAME TO firms;

ALTER TABLE public.firms
ADD COLUMN logo_url TEXT,
ADD COLUMN address_line1 TEXT,
ADD COLUMN address_line2 TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN postal_code TEXT,
ADD COLUMN country TEXT,
ADD COLUMN invite_code TEXT;

CREATE UNIQUE INDEX firms_invite_code_key
ON public.firms(invite_code)
WHERE invite_code IS NOT NULL;

COMMENT ON TABLE public.firms IS
'A Firm (organization/company). Renamed from companies (Sprint 5.3) — see docs/database/schema-review.md.';

COMMENT ON COLUMN public.firms.invite_code IS
'A shareable code a new member enters to join this Firm (Module 2 "Join Firm" placeholder — no real email delivery, per Sprint 5.3 scope).';
