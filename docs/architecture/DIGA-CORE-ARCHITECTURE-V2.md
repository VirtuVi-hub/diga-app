# DIGA Core Architecture v2

## Event-Driven Design Intelligence Platform

Version: 2.0
Status: Proposed
Supersedes: `002_ARCHITECTURE.md` (PROJECT_CONTEXT) as the long-term target architecture; does not replace `001-platform-architecture.md`, `002-authentication-and-authorization.md`, or `003-database-architecture.md`, which remain authoritative for tenancy, identity, and data ownership.
Last Updated: 2026-08-02

---

# 0. Why This Document Exists

Phase 1 (Sprints 4.0–4.4) built five real, working systems: a generic Knowledge Graph, a Comprehension Engine, an Intelligence Engine, an Evidence-based Reasoning Engine, and a Knowledge Capture Engine. Across five sprints, the same shape kept reappearing without ever being named: **something happens → intelligence understands it → intelligence proposes something → a human approves it → the graph changes.**

That shape is an event pipeline. It has been built, so far, out of direct function calls, React state, and synchronous request/response — not because that was wrong, but because Phase 1's job was to prove the *reasoning* was sound before paying for the *plumbing*. It succeeded. Phase 2's job is to stop simulating an event system and build the real one, before the plumbing (see `HomeWorkspace.tsx`'s accumulating state machines) collapses under its own weight.

This document defines the architecture Phase 2 builds toward. It is deliberately opinionated about what DIGA is not, as much as what it is.

---

# 1. Vision

DIGA is an **event-driven design intelligence platform** for architecture, engineering, and construction projects.

It continuously converts fragmented project activity — conversations, decisions, documents, drawings, meetings, approvals — into structured, connected, explainable knowledge, and it does this the same way regardless of which channel the activity arrived through or which human eventually needs to act on it.

DIGA does not manage projects. It does not schedule tasks. It does not replace email, WhatsApp, BIM, or CAD tools. It sits *above* all of them as the intelligence layer that understands what happened, proposes what should be recorded, and lets humans decide.

---

# 2. Philosophy

## 2.1 Facts First, Interpretation Second

Everything that happens in a project is, first, a fact: a message was sent, a document was uploaded, a decision was reached, a person approved something. Facts are recorded before they are interpreted. Interpretation (Intelligence) is a *consumer* of facts, never their source.

## 2.2 AI Proposes, Humans Approve — Structurally, Not by Convention

This has been a stated principle since the Engineering Contract and enforced by hand in every sprint since 4.2 (`requiresApproval: true`, Approve/Edit/Cancel screens, never auto-creating a Knowledge Object). Phase 2 makes this a property of the *event model itself*: an event that mutates the Knowledge Graph must carry a real human `actor`. An AI-originated event can only ever be a proposal. This is not a UI convention to remember — it is a constraint the architecture cannot violate even by accident.

## 2.3 Everything Emerges, Nothing Is Bolted On

Notifications, Timeline, Attention, and Automation are not independent systems competing with the Knowledge Graph for the truth. They are *views* over the same event history. When in doubt about whether something is a new system or a projection, it is a projection — until proven otherwise by a concrete requirement that a projection genuinely cannot satisfy (see §9, sagas).

## 2.4 Generic at the Edge, Specific at the Node

Sprint 4.0's defining decision — one generic `Relationship` edge type, no per-entity relationship classes — is correct and must be preserved permanently. But genericity at the edge does not mean genericity at the node. Knowledge Objects have historically shared one thin shape; that was acceptable for Phase 1's five text-based types and is not acceptable once Drawings, BIM elements, or rich domain objects join the graph. The architecture must support type-specific internal schemas while keeping every external connection uniform.

## 2.5 Optimize for Ten Years, Not Ten Weeks

Every foundational decision in this document is chosen for maintainability a decade out, even where a shortcut would ship faster this quarter. Where Phase 1 already demonstrated this pays off (Sprint 4.4's generic Knowledge Capture Engine only being possible *because* Sprint 4.0 refused to special-case relationships four sprints earlier), Phase 2 continues the pattern deliberately.

---

# 3. Core Principles

1. **One append-only Event Log is the backbone of the platform.** Every domain-state change is recorded as an event, in the same transaction as the state change itself.
2. **Relational tables remain the source of truth for current state.** This is a transactional-outbox architecture, not full event sourcing. State is never solely reconstructable-by-replay unless a specific subsystem chooses that tradeoff deliberately.
3. **Every event is immutable and Project-scoped.** No exceptions, matching `001-platform-architecture.md`'s own absolute rule for data access.
4. **No pillar bypasses another.** Intelligence never writes to the Knowledge Graph directly; it publishes proposal events. People never gain access outside Project membership. Relationships never encode entity-specific business rules.
5. **Reuse before build, at the event level too.** Before defining a new event type, check whether an existing one already describes the fact. Before building a new projection, check whether Timeline/Notifications/Attention already subscribe to what's needed.
6. **Channels are adapters, not architecture.** Journal text, voice, email, WhatsApp, meeting transcripts, and API calls are all equally valid ways for a fact to enter the system. None of them may become a special case inside Intelligence.
7. **Confidence and provenance travel with every proposal.** Nothing Intelligence produces is presented without a confidence level and a traceable reason, exactly as established in Sprint 4.3.

---

# 4. The Five Pillars

## 4.1 Knowledge

Requirements, Decisions, Actions, Issues, Risks, Discussions, and Evidence. Curated, versioned, provenance-tracked. Knowledge is never created automatically — it is always the recorded output of an approved proposal.

**Correction from Phase 1:** Knowledge Objects require type-specific schemas, not one shared shape. The uniform shell (id, title, description, priority, status, revisions) remains the common contract; type-specific payload fields are additive per type.

## 4.2 Relationships

One generic, directional-or-bidirectional edge (`nodeA`, `relationshipType`, `nodeB`) connecting any two nodes in the system. This model is proven across five sprints and must never be special-cased per entity type. Relationships are the *only* way two pieces of Knowledge, People, or Evidence are connected — there is no second connection mechanism anywhere in the platform.

**Standing risk to actively manage:** denormalized display labels on edges go stale when the source entity changes (documented since Sprint 4.0, never fixed). Phase 2 must resolve this before the graph is depended on at scale — either live resolution at read time, or an event-driven label-sync subscriber.

## 4.3 Events

The new pillar. An append-only, immutable, versioned log of every fact that has occurred in a Project. Every other pillar publishes to it and may subscribe to it. See §6 for the full model.

Events are not a replacement for the Knowledge Graph's role as source of truth for *current state* — they are the record of *how* current state came to be, and the mechanism by which every other capability (notifications, timeline, automation, future intelligence modules) reacts without the publisher needing to know who's listening.

## 4.4 People

Person, Firm, Project, Project Team, Role — already specified in `001-platform-architecture.md` and `002-authentication-and-authorization.md`, and the least-implemented pillar today (no real authentication exists; every user is currently hardcoded as Lead Architect). People is the pillar every event's `actor` field ultimately resolves to, and the pillar every authorization check ultimately depends on. Phase 2 cannot proceed far without implementing this pillar for real — it is a foundation, not a later nicety.

## 4.5 Intelligence

Comprehension → Context → Orchestration → Evidence → Confidence → Reasoning → Knowledge Capture. Intelligence is both a publisher (proposals, classifications, confidence scores) and a subscriber (reacts to facts published by any channel or pillar) of Events. It never mutates the Knowledge Graph directly and never publishes an event that represents human approval.

## 4.6 What Is Not a Pillar (and Must Not Become One)

Two concerns are cross-cutting axioms, not pillars, and must be enforced at every pillar boundary rather than owned by one:

- **Tenancy and Authorization** — every Knowledge Object, Relationship, Event, and Intelligence computation is scoped to a Project, which belongs to a Firm, per `001`/`002`. This is not "part of People" — it is a property every pillar must independently respect.
- **Time and Audit** — immutability and append-only history apply to Evidence (already an approved product decision), to Knowledge revisions (already implemented), and now to Events (this document). It is a discipline threaded through every pillar, not a sixth pillar.

Timeline, Notifications, Attention, Tasks, and Automation are, correspondingly, not pillars either — they are projections or subscribers over the five pillars (see §8).

---

# 5. System Architecture

```
        Channels (adapters, not architecture)
  Journal · Voice · Email · WhatsApp · Meeting · API · Plugin
                        │
                        ▼
              Normalized Ingestion Event
                        │
                        ▼
                 ┌─────────────┐
                 │  Event Log  │◄──────────────┐
                 └─────────────┘               │
                   │        ▲                  │
        subscribes │        │ publishes        │ publishes
                   ▼        │                  │
            ┌───────────────────────┐          │
            │   Intelligence Engine  │──────────┘
            │ Comprehension→Context  │
            │ →Orchestration→Evidence│
            │ →Confidence→Reasoning  │
            │ →Knowledge Capture     │
            └───────────────────────┘
                   │
                   ▼
            Proposal (Draft, Suggestion)
                   │
                   ▼
          ┌──────────────────┐        Approve/Edit/Cancel
          │   Human (People)  │◄───────────────────────────
          └──────────────────┘
                   │ approved
                   ▼
     ┌─────────────────────────────┐
     │ Knowledge + Relationships    │   (durable, transactional)
     │  (source of truth for state) │───► also appends approval Event
     └─────────────────────────────┘
                   │
                   ▼
        Projections (subscribers of the Event Log)
   Timeline · Notifications · Attention · Automation · Tasks(=Action KOs)
```

**Layering discipline** (extends the existing Engineering Contract's Page → Actions → Services → Repositories → Supabase chain, unchanged for CRUD-shaped work):

- Channels never call Intelligence directly. They publish an ingestion event.
- Intelligence never writes to Knowledge/Relationships directly. It publishes proposal events and renders review UI.
- Only an explicit human action (Approve, Continue Existing, Create New) causes a write to the Knowledge Graph — and that write and its corresponding event are one transaction.
- Projections never write back to the pillars they read from.

This is a strictly stronger separation than Phase 1's, but it is not a discontinuous rewrite — Sprint 4.2's Orchestrator ("decides, never performs") and Sprint 4.4's Approve/Edit/Cancel gate are already this pattern, minus the event log connecting them.

---

# 6. Event Model

## 6.1 Envelope

Every event carries:

| Field | Purpose |
|---|---|
| `id` | Unique identifier; enables idempotent delivery and dedup. |
| `type` | Namespaced, versioned string, e.g. `knowledge.requirement.drafted.v1`. Never bare verbs. |
| `occurredAt` | When the fact became true — distinct from when it was recorded or processed. |
| `projectId` | Every event is Project-scoped. No exceptions, matching `001-platform-architecture.md`. |
| `firmId` | Denormalized for isolation checks and audit without a join. |
| `actor` | `{ type: "person" \| "system" \| "integration", id: string \| null }` — the audit backbone of "AI proposes, humans approve." |
| `subject` | A reference shaped like the existing `RelationshipNodeRef` (`{id, type}`) — reused, not reinvented. |
| `payload` | Type-specific, versioned data. |
| `correlationId` | Ties together a causally related chain (ingestion → comprehension → draft → approval). |
| `causationId` | The single event that directly produced this one — finer-grained than correlation. |
| `confidence` | Present only on Intelligence-originated events; reuses the existing `ConfidenceLevel` vocabulary. |
| `schemaVersion` | Payload version, independent of the semantic version embedded in `type`. |

## 6.2 What Must Never Appear in an Event

- **Full object snapshots or large blobs.** Reference documents/drawings by id; never copy their content into an event. (This is Sprint 4.0's stale-label mistake, at a scale that would make it unfixable if repeated.)
- **Mutable state.** An event is immutable history. Corrections are new, compensating events — never edits to a past event.
- **UI/presentation hints.** That is the Response Planner's job (established since Sprint 4.2) and must stay separate.
- **Cross-Project references,** even by id — an absolute violation of the platform's tenancy principle.
- **Secrets, credentials, or unnecessary personal data** — events may eventually be visible to third-party plugin subscribers (§9).

## 6.3 Two Classes of Event

- **Proposal events** (`*.drafted`, `*.suggested`, `*.classified`) — may be published autonomously by Intelligence. Never imply a Knowledge Graph mutation.
- **Recorded events** (`*.created`, `*.approved`, `*.revised`) — may only be published as the direct, same-transaction consequence of a genuine human action. `actor.type` must be `"person"` for every event in this class that touches the Knowledge Graph.

This distinction is what makes "AI never approves" a structural guarantee rather than a code-review convention.

## 6.4 Delivery Model

Transactional outbox, not full event sourcing: a domain write and its event are committed atomically to durable storage (Supabase/Postgres). Subscribers (projections, Intelligence, future sagas) consume the log asynchronously. Current state is always read from the relational tables that own it — never reconstructed purely by replaying events — unless a specific future subsystem deliberately opts into that tradeoff for a stated reason.

---

# 7. Intelligence Model

Intelligence remains the pipeline proven across Sprints 4.1–4.4 — Comprehension → Context → Orchestration → Evidence → Confidence → Reasoning → Knowledge Capture — unchanged in internal shape. What changes is its boundary:

- **Subscribes** to a normalized ingestion event, regardless of which channel published it. This is what makes Meeting Intelligence, Voice, Email, and WhatsApp "just another publisher" rather than a new pipeline (§10).
- **Publishes** proposal events for every stage worth reacting to elsewhere — a classified destination, a generated draft, a detected duplicate, a low-confidence result worth flagging to a human before it's even reviewed (this is the concrete mechanism that finally implements the Attention panel, static since Sprint 3.6A).
- **Never** publishes a Recorded event (§6.3). Its output is always a proposal, gated by the same Approve/Edit/Cancel pattern Sprint 4.4 already built — generalized to every future capability, not re-invented per capability.

Each module inside Intelligence keeps its existing constructor-injection swappability (a future embeddings-backed `EvidenceEngine`, a future LLM-backed `IntentClassifier`) — this document does not change that pattern, it only changes how Intelligence receives input and reports output.

---

# 8. Knowledge Lifecycle

```
Fact occurs (any channel)
        ↓
Ingestion Event published
        ↓
Intelligence subscribes → understands → proposes
        ↓
Proposal Event published (draft, suggestion, classification)
        ↓
Human reviews (Approve / Edit / Cancel) — never automatic
        ↓
Approved
        ↓
Knowledge Graph mutated (Knowledge Objects, Relationships)
   + Recorded Event published, same transaction
        ↓
Projections update (Timeline, Notifications, Attention, Automation, Task views)
```

This is a direct formalization of Sprint 4.4's Knowledge Capture Engine flow, generalized to be the *only* lifecycle any capability uses to create or change knowledge — not a special case for Requirements/Decisions/Issues/Actions, and not a separate lifecycle for a future Drawing or BIM capability either.

**Tasks, specifically:** per the standing, already-approved product decision that Delta is not a task manager, no new "Task" entity is introduced. The existing **Action** Knowledge Object type is the durable record; assignment, completion, and reminders are events on that object; worklists are projections. This applies the "reuse before build" principle to the roadmap itself, not just to code.

**Approvals, specifically:** a single approve/reject is a Recorded event. Where a Knowledge Object requires multiple named approvers (`approvalRequiredFrom`, already a field on the type), an approval *aggregate* — built from approval events, not a competing store — tracks whether the requirement is satisfied.

---

# 9. Extension Architecture

Constructor injection (Sprints 4.1–4.4's pattern) is necessary but not sufficient for a real extension architecture. It lets a developer swap one module at compile time. It does not let a third party register a plugin at runtime, scoped to specific Projects, with specific capabilities.

Phase 2's extension model, layered on top of the Event Log:

- **Subscriptions are capability-scoped, not global.** A plugin or integration is granted the right to subscribe to specific event *types*, for specific *Projects* it has been assigned to (mirroring `002-authentication-and-authorization.md`'s Project-membership model exactly — extension access follows the same rule as human access).
- **Publishing is similarly scoped.** An integration may publish only the event types its installation permits (e.g., a Meeting Intelligence integration may publish ingestion events, not approval events).
- **No plugin ever bypasses the Knowledge Lifecycle (§8).** A plugin proposing knowledge follows exactly the same propose → human-approves path as Delta's own Intelligence. There is no privileged write path.
- **A saga/process-manager layer is deliberately deferred**, not pre-built. Raw events handle "something happened, N things react" cleanly. They do not, by themselves, guarantee "step B only after step A, with a timeout." Build a thin, stateful process manager — subscribing to and emitting events, with its own minimal state — only when a genuine multi-step, multi-approver chain is a real requirement, not speculatively. This avoids re-introducing the workflow-engine complexity this document argues against, except exactly where it is actually earned.

This is what makes Drawing Intelligence, Revision Comparison, Meeting Intelligence, Voice, Mobile, BIM, Email, WhatsApp, API, and Plugins integrate *cleanly* rather than each requiring a bespoke integration path — with two honest exceptions: BIM requires real domain-schema work (rich Knowledge Object payloads, §4.1) that no amount of event-plumbing substitutes for, and API/Plugins specifically require real authentication (§10, item 2) before they can be safely exposed at all.

---

# 10. Long-Term Roadmap

Platform foundations, in dependency order — not a feature list.

1. **Durable persistence.** Replace in-memory mock stores (Discussions, Knowledge Objects, Relationships) with real Supabase tables. Nothing else below is buildable on top of a module-level mutable array.
2. **Real authentication and authorization**, against the already-designed target model (`001`, `002`). Gates real `actor` identity for every event and real per-Project isolation enforcement.
3. **The canonical Event Log**, transactional-outbox style, introduced together with (1) — every domain write appends an event in the same transaction.
4. **Channel-agnostic ingestion boundary.** Extract Intelligence from direct client-component imports into a real server-side entry point every channel calls uniformly, publishing/subscribing through the Event Log rather than being invoked as a plain function from React.
5. **Projections for Notifications, Timeline, and Attention** — replacing placeholders that have been "future work" since Sprint 3.6A, and the first concrete proof that "everything emerges from events" pays off in the product, not just on paper.
6. **Semantic search / embeddings** for Evidence collection and duplicate matching — removing the confidence ceiling documented in every sprint since 4.3, and unifying the three ad hoc duplicate-matching calibrations built across Sprints 4.3.1–4.4 into one tunable capability.
7. **Rich, type-specific Knowledge Object schemas** — closing the already-acknowledged "one shared vocabulary across five types" gap, and the prerequisite for Drawing Intelligence and BIM.
8. **A minimal process-manager/saga layer** — built only once a genuine multi-step approval chain is a real requirement, on top of (not instead of) the Event Log.
9. **Extension/plugin capability model** — event-scoped access per installation, sequenced last because it depends on (2) and (3) already being trustworthy.

---

# 11. Closing Note

Every engine built in Sprints 4.0–4.4 already follows this document's spirit: generic over specific, propose over decide, reuse over duplicate. Phase 2 is not a departure from Phase 1's engineering culture — it is the removal of the one piece Phase 1 never had time to build for real: the fact that all of this has been an event pipeline all along.

---

End of Document
