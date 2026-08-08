# DIGA Engineering Contract

## Purpose

This document defines the engineering principles that every contributor, AI assistant, and developer must follow when working on DIGA.

The purpose of this contract is to ensure that the system remains scalable, maintainable, predictable, and architecturally consistent throughout its lifetime.

---

# Core Philosophy

The platform is built around reusable business capabilities.

Features must reuse existing infrastructure instead of creating duplicate implementations.

Every new module should extend the platform rather than bypass it.

---

# Layered Architecture

All application logic must follow this architecture.

```
Page
    ↓
Actions
    ↓
Services
    ↓
Repositories
    ↓
Supabase
```

Responsibilities:

## Pages

Responsible only for:

- UI
- Routing
- Rendering
- User interaction

Pages must never communicate directly with Supabase.

Pages must never contain business logic.

---

## Actions

Responsible for:

- receiving requests
- validation
- calling services

Actions coordinate work.

Actions do not contain business rules.

---

## Services

Responsible for business logic.

Examples:

- document creation
- revision rules
- permission decisions
- workflow execution

Services may call multiple repositories.

Services must not know about UI.

---

## Repositories

Repositories are the only layer allowed to access Supabase.

Repositories perform:

- queries
- inserts
- updates
- deletes

Repositories must not contain business rules.

---

## Supabase

Supabase is infrastructure.

No application logic belongs inside SQL except:

- constraints
- indexes
- triggers where absolutely necessary
- RLS
- storage
- atomic RPC operations

---

# Reuse Before Build

Before creating new functionality, check whether the platform already provides it.

Never duplicate:

- upload logic
- revision logic
- storage logic
- signed URL generation
- repository methods
- services

Extend existing infrastructure whenever possible.

---

# Document Engine

The Document Engine is generic.

It must never become specific to:

- Meetings
- RFIs
- Requirements
- Contract Package
- Drawings

Modules use the Document Engine.

The Document Engine does not know modules.

---

# Security

Security is enforced at multiple layers.

- Authentication
- Authorization
- RLS
- Services

Never bypass RLS.

Never expose service-role credentials to the client.

Never weaken security to simplify implementation.

---

# Database

Database changes must use migrations.

Never manually modify production schema.

Never rewrite historical migrations.

Use reconciliation migrations where appropriate.

---

# AI

AI assists users.

AI does not make business decisions.

AI may:

- extract knowledge
- compare revisions
- classify content
- propose relationships

AI never:

- chooses document identity
- modifies project knowledge automatically
- approves workflows

AI always produces proposals.

Users approve changes.

---

# Product Principles

Documents are evidence.

Knowledge is derived from evidence.

Business objects reference documents.

Documents do not belong to modules.

Modules reference documents.

---

# Validation

Every implementation must pass:

- TypeScript
- Production build

When appropriate, also validate:

- migrations
- permissions
- RLS
- repository behaviour

---

# Code Quality

Prefer:

small services

small repositories

clear interfaces

single responsibility

Avoid:

duplicate logic

large utility files

business logic in UI

tight coupling

---

# Long-Term Goal

Every implementation should move DIGA closer to becoming an AI-powered Project Knowledge Platform.

When choosing between a quick implementation and a reusable implementation, prefer the reusable implementation unless there is a compelling product reason not to.