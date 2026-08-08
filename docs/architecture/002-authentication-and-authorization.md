# DIGA Authentication & Authorization

Version: 1.0
Status: Approved
Last Updated: July 2026

---

# Purpose

This document defines how users authenticate, how they become members of Firms, how they are assigned to Projects, and how DIGA determines access permissions.

Authentication confirms identity.

Authorization determines access.

These two concepts are intentionally separated.

---

# Authentication

Authentication answers one question:

Who is this person?

Authentication is provided by Supabase Authentication.

Each person has one authentication account.

Authentication only proves identity.

It grants no access to any Firm or Project.

---

# Registration

Any person may register for DIGA.

Registration creates:

- Authentication account
- Professional profile

Registration does not create:

- Firm membership
- Project membership
- Administrative privileges
- Lead Architect status
- Co-Authenticator status

A newly registered user has no access to project information.

---

# Professional Profile

Every registered user maintains a professional profile.

Typical information includes:

- Full name
- Email
- Profession
- Discipline
- Company (optional)
- Qualifications
- Experience
- Portfolio
- Professional registrations
- Contact details

The professional profile belongs to the individual.

It is independent of any Firm.

---

# Initial Login

After registration and login, users who have not yet been assigned to any projects are shown:

"You have not yet been assigned to any projects."

No Firm information is displayed.

No Project information is displayed.

No search capability is available.

---

# Invitation Workflow

After completing their profile, the user may generate a secure invitation link.

The invitation link represents the user's professional profile.

The user sends this link directly to a Lead Architect.

Examples include:

- Email
- Microsoft Teams
- WhatsApp
- Internal company communication

The invitation process occurs outside DIGA.

---

# Invitation Link

Each invitation link:

- is unique
- is securely generated
- expires after a configurable period
- may be revoked
- is auditable

The invitation does not grant access.

It simply allows a Lead Architect to review the professional profile.

---

# Lead Architect Review

When the Lead Architect opens the invitation link, DIGA displays the applicant's professional profile.

The Lead Architect reviews:

- Name
- Profession
- Qualifications
- Experience
- Portfolio
- Contact details

The Lead Architect then selects:

Firm

Project

Project Role

Optional:

Co-Authenticator

---

# Assignment

When the Lead Architect confirms the assignment, DIGA automatically:

Associates the person with the selected Firm.

Adds the person to the selected Project.

Assigns the selected Project Role.

Applies any delegated permissions.

Invalidates the invitation token.

---

# Firm Membership

Firm membership is independent of project membership.

A person may belong to multiple Firms.

Each Firm controls only its own membership.

Membership in one Firm grants no access to another Firm.

---

# Project Membership

Project membership controls access.

Users may belong to multiple Projects.

Projects may belong to different Firms.

Access is evaluated separately for every Project.

---

# Dashboard

After login, users are presented with:

My Projects

Every project displays:

Project Name

Firm Name

Project Role

Example:

Hospital Extension
GDDB
Architect

Airport Expansion
Foster + Partners
BIM Manager

The Firm name is informational only.

Users do not change workspaces.

---

# Lead Architect

A Lead Architect is appointed by another existing Lead Architect.

Users cannot promote themselves.

Lead Architects may:

Create Projects.

Invite people.

Assign people to Projects.

Assign project roles.

Appoint Co-Authenticators.

Transfer Project ownership.

---

# Co-Authenticator

A Co-Authenticator is appointed by the Project Owner.

A Project may have multiple Co-Authenticators.

Co-Authenticators assist with administration.

Their authority is limited to delegated project administration.

---

# Project Owner

The Lead Architect who creates a Project automatically becomes its Project Owner.

Only the Project Owner may:

Transfer ownership.

Delete the Project.

Appoint Co-Authenticators.

Remove Co-Authenticators.

---

# Authorization

Authorization answers one question:

May this user perform this action?

Authorization depends entirely on Project membership.

No Project membership means no access.

---

# Access Evaluation

Every request follows the same sequence:

Authenticate user.

Locate professional profile.

Determine Project membership.

Determine Project Role.

Determine delegated permissions.

Authorize or deny the request.

---

# Security Principles

Users never choose their own permissions.

Users never assign themselves to Projects.

Users never assign themselves to Firms.

Users never promote themselves to Lead Architect.

Users never promote themselves to Co-Authenticator.

All permissions originate from an existing Lead Architect.

---

# Audit Trail

Every security-related action is recorded.

Examples include:

User invited.

Invitation accepted.

Project assigned.

Role changed.

Co-Authenticator appointed.

Project ownership transferred.

Membership removed.

These records form the permanent security audit history.

---

# Guiding Principle

Authentication identifies the person.

Authorization identifies the Projects.

Project membership determines access.

Nothing else grants permission.

---

End of Document
