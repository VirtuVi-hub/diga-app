# DIGA Platform Architecture

Version: 1.0
Status: Approved
Last Updated: July 2026

---

# Purpose

This document defines the core architecture of the DIGA platform.

It is the highest-level architectural document for the system and serves as the foundation for all future database design, application development, security, permissions, and workflows.

All future architectural decisions must remain consistent with this document.

---

# Vision

DIGA is an intelligent collaboration platform for the Architecture, Engineering and Construction (AEC) industry.

Its primary objective is to provide a secure environment where multidisciplinary project teams collaborate around project information throughout the project lifecycle.

Projects are the centre of DIGA.

People collaborate through projects.

Access is granted only through project assignment.

---

# Core Principles

DIGA follows these principles:

1. Security by default.
2. Least privilege access.
3. Project-first collaboration.
4. Firm data isolation.
5. Professional identity independent of employer.
6. Lead Architect controlled project access.
7. Complete auditability.
8. Scalable multi-firm architecture.

---

# Platform Structure

The hierarchy of DIGA is:

Platform
    ↓
Firm
    ↓
Projects
    ↓
Project Team
    ↓
Project Information

---

# Firm

A Firm represents an architectural practice, engineering consultancy, contractor or other organisation using DIGA.

Examples:

- GDDB
- Foster + Partners
- Gensler
- AECOM

Each Firm owns:

- Projects
- Standards
- Libraries
- Templates
- Members

A Firm cannot access another Firm's information.

---

# Person

A Person exists only once in DIGA.

A Person has:

- Authentication account
- Professional profile
- Qualifications
- Experience
- Contact information

A Person may belong to multiple Firms.

Professional identity is global.

Project access is not.

---

# Project

Every Project belongs to exactly one Firm.

Examples:

- Hospital
- Airport
- School
- Office Tower

Projects contain:

- Team
- Requirements
- Documents
- Deliverables
- Reviews
- Approvals
- Disciplines
- Tags

---

# Project Visibility

Projects are never publicly visible.

Users cannot browse Firms.

Users cannot browse Projects.

Users only see Projects to which they have been explicitly assigned.

---

# Login Experience

After login, a user sees:

My Projects

Each project displays:

- Project Name
- Firm Name
- User Role

Example:

Hospital Extension
GDDB
Structural Engineer

Airport Terminal
Foster + Partners
BIM Manager

The Firm name is displayed only for identification.

Users do not switch between Firm workspaces.

---

# Lead Architect

Lead Architect is both:

- the professional role
- the administrative authority

The Lead Architect may:

- Create Projects
- Invite users
- Assign users
- Assign project roles
- Remove users
- Appoint Co-Authenticators
- Remove Co-Authenticators
- Transfer Project Ownership

The title remains "Lead Architect" throughout DIGA.

No separate administrative title exists.

---

# Project Owner

When a Lead Architect creates a Project, they automatically become its Project Owner.

Only the Project Owner may:

- Delete a Project
- Transfer ownership
- Appoint Co-Authenticators
- Remove Co-Authenticators

Ownership may be transferred to another Lead Architect.

---

# Co-Authenticator

A Co-Authenticator is a trusted delegate appointed by the Project Owner.

A Project may have zero, one or many Co-Authenticators.

They assist with administration.

Typical responsibilities include:

- Assigning users
- Assigning project roles
- Managing project membership
- Approving invitations

Co-Authenticators cannot:

- Delete Projects
- Remove the Project Owner
- Transfer ownership

---

# Team Members

Team members are assigned by the Lead Architect or a Co-Authenticator.

Each Team Member has:

- Project Role
- Project permissions

Team Members only access projects to which they are assigned.

---

# Registration

Anyone may register for DIGA.

Registration creates:

- Authentication account
- Professional profile

Registration does NOT create:

- Firm membership
- Project access
- Administrative permissions

---

# Joining a Project

After registration, a user has no project access.

The user generates a secure profile invitation link.

The link is sent to a Lead Architect.

The Lead Architect reviews the profile and assigns:

- Firm
- Project
- Role

Only after assignment does the user gain access.

---

# Multi-Firm Membership

A professional may collaborate with multiple Firms.

Example:

John Smith

GDDB
    Hospital

Foster + Partners
    Airport

AECOM
    Bridge

The same professional profile is reused.

Each Firm only controls its own Projects.

---

# Security Principles

DIGA follows these security rules:

- No anonymous project access.
- No public project listings.
- No public firm listings.
- No cross-firm visibility.
- No access without explicit assignment.
- All permissions are auditable.

---

# Guiding Rule

Everything in DIGA is based on one principle:

A user may only access information belonging to Projects to which they have been explicitly assigned.

No exceptions.

---

End of Document
