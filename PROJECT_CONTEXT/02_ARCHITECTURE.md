# DELTA Architecture

This document describes the architectural principles of Delta.

It is not a description of the current code.

It is the target architecture that all future development should move towards.

---

# Architectural Philosophy

Delta is built around knowledge.

The application architecture should mirror the product architecture.

Never organize code around screens alone.

Organize around business domains.

---

# Knowledge Flow

The application follows this pipeline.

Evidence

↓

Knowledge Review

↓

Knowledge Objects

↓

Knowledge Evolution

↓

Knowledge Graph

↓

Project Intelligence

Every feature should naturally fit somewhere within this flow.

---

# Primary Workspace

The primary user experience is one continuous workspace.

The workspace consists of four permanent regions.

Sidebar

↓

Evolution Strip

↓

Project Journal

↓

Delta Assistant

Users should rarely leave this workspace.

Prefer contextual panels over page navigation.

---

# Core Domains

Delta consists of the following major domains.

## Evidence

Responsible for:

Meetings

Emails

Documents

Drawings

Images

Specifications

Client Messages

Site Photos

Evidence ingestion

Evidence indexing

Evidence metadata

---

## Knowledge Review

Responsible for:

Review Packages

Approval workflow

Knowledge extraction

Conflict detection

Merge process

Knowledge validation

---

## Knowledge

Responsible for:

Requirements

Decisions

Concepts

Spaces

Constraints

Risks

Assumptions

Agreements

Knowledge relationships

Knowledge versioning

---

## Evolution

Responsible for:

Knowledge milestones

Project history

Timeline

Historical evolution

Milestones represent verified knowledge changes.

Evolution is historical only.

No future planning.

No scheduling.

No project management.

---

## Knowledge Graph

Responsible for:

Relationships

Navigation

Connections

Knowledge exploration

Context discovery

The Knowledge Graph is the primary intelligence layer.

---

## Delta Assistant

Responsible for:

Search

Summaries

Recommendations

Context

Reasoning

Natural language interaction

The assistant should never contain business logic.

It is only an interface to the knowledge model.

---

# Component Philosophy

Prefer:

Small reusable components.

Composable layouts.

Single responsibility.

Avoid:

Large page components.

Duplicate UI.

Copy-pasted logic.

---

# State Management

Business state should remain independent of UI.

Components should display state.

Hooks should encapsulate behaviour.

Avoid unnecessary global state.

---

# Styling

Use design tokens.

Avoid hardcoded colors.

Avoid inline styles.

Maintain Atelier design language.

---

# Routing

Pages should become entry points.

Most interactions should happen inside the workspace.

Avoid creating new pages when a panel or contextual view is sufficient.

---

# Data Principles

Evidence is immutable.

Knowledge is curated.

Relationships are explicit.

Evolution is historical.

The Knowledge Graph is the source of truth.

---

# Performance

Prefer:

Lazy loading

Code splitting

Virtualization for large lists

Memoization where appropriate

Avoid premature optimization.

---

# Validation

Every completed implementation should pass:

npm run lint

npx tsc --noEmit

npm run build

before being considered complete.

---

# Long-Term Vision

Delta should evolve into a modular architecture where each domain is independently maintainable while contributing to one unified knowledge model.

Every architectural decision should strengthen:

- Maintainability
- Reusability
- Performance
- Knowledge-centric design