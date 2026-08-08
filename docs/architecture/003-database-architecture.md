# DIGA Database Architecture

Version: 1.0
Status: Approved
Last Updated: July 2026

---

# Purpose

This document defines the logical database architecture of DIGA.

It specifies the primary entities, their relationships, ownership rules, and the guiding principles that govern the database design.

This document does not define SQL implementation details. Those are documented separately in database migrations.

---

# Design Principles

The database shall follow these principles:

- Normalize data where appropriate.
- Avoid duplicate professional profiles.
- Separate authentication from business data.
- Separate Firms from Projects.
- Separate Projects from Permissions.
- Record complete audit history.
- Enforce security through Row Level Security (RLS).
- Maintain referential integrity.

---

# Primary Entities

The core entities of DIGA are:

Platform

↓

Person

↓

Firm

↓

Project

↓

Project Team

↓

Project Information

---

# Person

A Person represents a professional.

Examples:

- Architect
- Structural Engineer
- Interior Designer
- BIM Manager

A Person exists only once within DIGA.

A Person may participate in multiple Firms.

---

# Authentication

Authentication is managed by Supabase.

Business tables never store passwords.

Business tables reference authenticated users.

---

# Firm

A Firm represents an organisation.

Examples:

- GDDB
- Foster + Partners
- AECOM

A Firm owns:

- Projects
- Standards
- Libraries
- Members

A Firm never owns professional identities.

---

# Firm Membership

Firm membership associates a Person with a Firm.

Membership includes:

- Status
- Join date
- Audit history

Membership does not automatically grant access to Projects.

---

# Project

A Project belongs to exactly one Firm.

A Project has:

- One Project Owner
- Zero or more Co-Authenticators
- Zero or more Team Members

---

# Project Owner

The Project Owner is always a Lead Architect.

Responsibilities include:

- Project creation
- Ownership transfer
- Team administration
- Co-Authenticator management

Only one Project Owner exists per Project.

---

# Project Team

The Project Team associates:

Person

↓

Project

↓

Project Role

Project membership determines access.

---

# Project Roles

Examples include:

- Lead Architect
- Architect
- Structural Engineer
- BIM Manager
- Quantity Surveyor
- Contractor
- Client Representative

Roles describe professional responsibility.

Roles are independent of authentication.

---

# Co-Authenticator

A Co-Authenticator is a delegated project administrator.

There may be multiple Co-Authenticators.

They are associated with a Project.

They never replace the Project Owner.

---

# Requirements

Requirements belong to Projects.

Requirements never belong directly to:

- Firms
- People

---

# Documents

Documents belong to Projects.

Document revisions belong to Documents.

---

# Deliverables

Deliverables belong to Projects.

---

# Disciplines

Disciplines classify work.

Examples:

- Architecture
- Structural
- Mechanical
- Electrical

Disciplines are reusable reference data.

---

# Tags

Tags provide additional categorisation.

Tags may be shared across Projects within the same Firm.

---

# Reference Data

Reference tables include:

Roles

Disciplines

Document Statuses

Requirement Categories

Deliverable Types

Reference data is centrally managed.

---

# Audit History

All important changes are recorded.

Examples:

Project created

Team member added

Role changed

Invitation accepted

Requirement approved

Document revised

Audit records are immutable.

---

# Security Model

Security is enforced through Project membership.

Firm membership alone never grants Project access.

Authentication alone never grants Project access.

Project membership is always required.

---

# Data Ownership

Professional profile

↓

Owned by Person

Project

↓

Owned by Firm

Documents

↓

Owned by Project

Requirements

↓

Owned by Project

Deliverables

↓

Owned by Project

---

# Relationships

One Person

↓

Many Firm Memberships

↓

Many Projects

↓

Many Documents

↓

Many Requirements

↓

Many Deliverables

---

# Future Expansion

The database architecture supports future modules including:

- BIM integration
- AI assistants
- External reviewers
- Consultants
- Contractors
- Regulatory authorities
- Multi-office firms
- Mobile applications
- Public APIs

without requiring structural redesign.

---

# Guiding Principle

The database models professional collaboration.

Projects are the centre of collaboration.

People collaborate through Projects.

Everything else supports that objective.

---

End of Document