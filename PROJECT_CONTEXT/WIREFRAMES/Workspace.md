# Delta Workspace

Status: Approved

Version: 2.0

---

# Purpose

This document defines the visual layout and interaction behaviour of the Delta workspace.

It complements `ARCHITECTURE/Workspace.md`.

Architecture defines **what** the navigation and workspace are.

This document defines **how** they look and behave.

---

# Navigation Layout

Two navigation levels are always available once a user is logged in.

## Global Navigation (Sidebar)

```
┌────────────┐
│ All Projects│
│ Settings    │
└────────────┘
```

Always visible. Does not depend on whether a project is open.

## Project Navigation

Appears once a project is open, alongside the persistent Sidebar.

```
Home | Project | Data | Knowledge Bank
```

`Home` is selected by default whenever a project is opened.

---

# All Projects Layout

```
┌────────────┬─────────────────────────────────────────────────────┐
│ Sidebar    │  Search        Create Project                        │
│            │                                                      │
│            │  [Project Card]  [Project Card]  [Project Card]      │
│            │  [Project Card]  [Project Card]  [Project Card]      │
└────────────┴─────────────────────────────────────────────────────┘
```

Simple content page. No Timeline, Delta, Project Journal, Knowledge Bank, or Data regions.

---

# Home Layout

Home is the only page that renders the full workspace.

```
┌────────────┬──────────┬──────────────────────────────────────────┬──────────────┐
│ Sidebar    │ Timeline │                                          │              │
│            │          │           Project Journal                │    Delta     │
│            │          │                                          │              │
└────────────┴──────────┴──────────────────────────────────────────┴──────────────┘
```

The workspace is always visible while inside Home.

Users should rarely navigate to a completely different page while working in Home.

---

# Project / Data / Knowledge Bank Layout

```
┌────────────┬─────────────────────────────────────────────────────┐
│ Sidebar    │  Project Navigation (Home | Project | Data | KB)     │
│            │                                                      │
│            │  Page content                                       │
└────────────┴─────────────────────────────────────────────────────┘
```

These pages carry the persistent Sidebar and Project Navigation, but not the Timeline, Project Journal, or Delta regions. They are reached deliberately from Home.

---

# Region A — Sidebar

Purpose

Global navigation only.

Contents

- All Projects
- Settings

Behaviour

- Always visible
- Fixed width
- Does not scroll with content
- May support collapse in the future

---

# Region B — Timeline (Home only)

Purpose

Display the project's chronological evolution.

Contents

- Meetings
- Document uploads
- Decisions
- Approvals
- Revisions
- Milestones

Behaviour

- Thin vertical strip
- Always visible while inside Home
- Newest items appear at the top
- Scrolls independently if needed
- Clicking an item updates the Journal

---

# Region C — Project Journal (Home only)

Purpose

The primary collaboration workspace.

Displays

- Topics
- Discussions
- Comments
- Meetings
- Documents in context
- Decision discussions
- Delta summaries

Behaviour

- Largest workspace region
- Independent scrolling
- Editorial cards, not chat bubbles
- Supports filtering by current context

---

# Region D — Delta (Home only)

Purpose

Project intelligence.

Delta provides

- Context-aware assistance
- Search
- Summaries
- Suggestions
- Reasoning

Behaviour

- Always aware of the active project
- Context changes automatically
- Remains docked to the workspace
- Never feels like a separate application

The UI label is simply:

Delta

---

# All Projects

Purpose

Landing page after login.

Contents

- Project cards
- Search
- Create Project
- Filters (future)

Behaviour

- Independent scrolling
- No secondary regions

---

# Project

Purpose

Administrative information page.

Contents

- Project information
- Agreement
- Brief
- BOQ
- Description
- Project metadata
- Recent activity
- Project statistics

Behaviour

- Not the primary workspace
- Visible only to Client (CL) and Lead Architect (LAr)

---

# Data

Purpose

Project evidence and files.

Contents

- Documents
- Drawings
- Photos
- Meetings
- Emails
- Uploaded files
- Revisions

---

# Knowledge Bank

Purpose

Approved project knowledge.

Contents

- Requirements
- Decisions
- Participants
- References
- Relationships
- Timeline View

---

# Navigation Behaviour

Selecting a project navigation item (Home, Project, Data, Knowledge Bank) changes the content area.

Within Home, changing context updates the Journal without a full page transition.

Moving between Home, Project, Data, and Knowledge Bank is a deliberate page change.

---

# Scrolling

Sidebar:
Independent

Project Navigation:
Fixed, does not scroll

Timeline (Home):
Independent

Journal (Home):
Independent

Delta (Home):
Independent

Page content (All Projects, Project, Data, Knowledge Bank):
Independent

No region should unintentionally scroll another.

---

# Empty States

Every region and page should provide meaningful guidance when empty.

Avoid blank screens.

Guide users toward the next action.

---

# Responsive Behaviour

Desktop is the primary target for this version.

Tablet and mobile layouts will be specified in future iterations.

---

# Interaction Principles

The workspace should feel:

- Continuous
- Calm
- Editorial
- Architectural
- Focused

Avoid:

- Chat application patterns
- Dashboard overload
- Multiple competing actions
- Modal-heavy workflows

---

# Success Criteria

A user should be able to spend an entire day working inside Home without feeling like they are navigating between different applications.

Moving to Project, Data, or Knowledge Bank should feel like a deliberate, simple step outside that continuous workspace, not a loss of context.
