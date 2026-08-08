-- =====================================================
-- DIGA - Create Notifications (Sprint 5.9, Module 1)
-- =====================================================
-- The Notification Center's real, persisted store — distinct from the
-- in-memory Event Log (`lib/repositories/event-repository.ts`), which
-- exists for a different purpose (an append-only fact log the Timeline
-- projects over) and isn't pinned to survive across requests reliably.
-- A Notification is a per-recipient, per-project delivery record: who
-- should see it, what it says, and whether they've read it.
--
-- notification_type is an open string (e.g. "agreement_approved"),
-- growable like EVENT_TYPES/Event.eventType — not a CHECK-constrained
-- enum, matching this codebase's existing "open string, not a
-- closed-per-variant enum" convention.
--
-- Recipient privacy is enforced at the query layer (every read filters
-- `.eq("recipient_person_id", currentPersonId)`), not by RLS — the same
-- uniformly permissive RLS convention every other table in this codebase
-- already uses (no per-row ownership scoping anywhere; role assignment
-- only, no authorization enforcement, a documented limitation carried
-- forward from every prior sprint).

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES public.projects(id)
        ON DELETE CASCADE,

    recipient_person_id UUID NOT NULL
        REFERENCES public.people(id)
        ON DELETE CASCADE,

    notification_type TEXT NOT NULL,

    title TEXT NOT NULL,
    body TEXT NOT NULL,

    primary_action_label TEXT,
    primary_action_url TEXT,
    secondary_action_label TEXT,

    source_event_type TEXT,
    -- A de-dup key preventing the same situation from spamming the same
    -- recipient twice (e.g. "waiting_for_approval" firing from more than
    -- one trigger event) — NULL for types that don't need de-dup.
    dedup_key TEXT,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS
'Per-person, per-project notifications (Sprint 5.9, Module 1) — real, persisted delivery, distinct from the in-memory Event Log. Recipient privacy is enforced at the query layer, not RLS, matching this codebase''s uniformly permissive-RLS convention.';

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_person_id, created_at DESC);
CREATE INDEX idx_notifications_project ON public.notifications(project_id);
CREATE UNIQUE INDEX idx_notifications_dedup ON public.notifications(dedup_key) WHERE dedup_key IS NOT NULL;

ALTER TABLE public.notifications
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (true);

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, service_role;
