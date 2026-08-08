# DIGA Database Schema Review

Version: 1.0  
Status: In Progress  
Last Updated: July 2026

---

# Purpose

This document records the architectural review of the current Supabase database schema.

It is **not** a migration plan and **not** a database specification.

Its purpose is to document the decision made for every migration so that implementation work can proceed systematically.

Each reviewed migration is classified as:

- ✅ Keep
- 🔄 Modify
- ➕ Extend
- ❌ Replace
- ⏳ Pending Review

---

# Review Summary

| Migration | Status | Decision |
|------------|--------|----------|
| Foundation | ✅ Reviewed | Keep foundation, evolve `companies` into `firms`, redesign RLS |
| Create People | ✅ Reviewed | Keep people model, remove direct company relationship, integrate with authentication |

---

# Migration Review

---

## 20260722130000_foundation.sql

### Status

✅ Reviewed

### Purpose

Creates the shared database foundation including:

- Shared trigger functions
- Audit trigger functions
- Companies table
- Base indexes
- Initial Row Level Security policies

---

### Decision

**Keep with modifications.**

The migration establishes a solid technical foundation and should remain the basis for future development.

---

### Keep

- Shared trigger functions
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- Timestamp triggers
- Update triggers
- Audit approach
- Index strategy

---

### Modify

Rename the business concept:

```
companies
```

to

```
firms
```

to align with the approved architecture.

The structure of the table remains largely unchanged.

---

### Future Enhancements

Possible future attributes include:

- Address
- Country
- Timezone
- Logo
- Subscription information

These are enhancements rather than structural changes.

---

### Row Level Security

The current policies allow unrestricted access for all authenticated users.

These policies are suitable only during early development.

They will later be replaced with membership-based access using Firm Membership and Project Membership.

---

### Overall Decision

✅ Keep

🔄 Rename business entity

🔄 Replace RLS policies

---

## 20260722143000_create_people.sql

### Status

✅ Reviewed

### Purpose

Creates the People table containing professional profiles.

---

### Decision

**Keep with modifications.**

The concept of a dedicated People table is correct and aligns with the platform architecture.

---

### Keep

- Table name (`people`)
- First name
- Last name
- Email
- Phone
- Notes
- Active flag
- Audit columns
- Trigger strategy
- Last name index

---

### Remove

Remove:

```
company_id
```

A person should not belong directly to a single Firm.

---

### Replace With

Introduce a new table:

```
firm_members
```

which models the relationship:

```
Person

↓

Firm Membership

↓

Firm
```

This allows one person to belong to multiple Firms.

---

### Authentication

The People table should become the professional profile associated with Supabase Authentication.

Future design:

```
auth.users

↓

people

↓

firm_members

↓

project_team
```

One authenticated user owns one professional profile.

---

### Row Level Security

Current development policies allow unrestricted access.

These will later be replaced with policies based on Project Membership and Firm Membership.

---

### Overall Decision

✅ Keep

❌ Remove `company_id`

➕ Add authentication relationship

➕ Add Firm Membership model

🔄 Replace RLS

---

# Emerging Architecture Decisions

The review has already established several important architectural principles.

## Authentication

Authentication remains managed exclusively by Supabase.

Professional identity is managed within the `people` table.

---

## Professional Identity

Each authenticated user owns exactly one professional profile.

Professional identity is independent of Firm membership.

---

## Firm Membership

A person may belong to multiple Firms.

Membership will be represented through a dedicated `firm_members` table.

---

## Project Membership

Projects remain the primary security boundary.

Users gain access only through explicit Project membership.

---

## Security

The current permissive RLS policies are temporary.

Future RLS will be based on:

- Authentication
- Firm Membership
- Project Membership
- Project Role

---

# Review Progress

| Area | Status |
|------|--------|
| Foundation | ✅ Complete |
| People | ✅ Complete |
| Team Types | ⏳ Pending |
| Roles | ⏳ Pending |
| Project Team | ⏳ Pending |
| Projects | ⏳ Pending |
| Deliverables | ⏳ Pending |
| Documents | ⏳ Pending |
| Requirements | ⏳ Pending |
| Tags | ⏳ Pending |
| Revisions | ⏳ Pending |
| Approvals | ⏳ Pending |

---

# Guiding Principle

The goal of this review is evolutionary improvement.

Where existing schema aligns with the approved architecture, it will be retained.

Where the architecture has evolved, the schema will be extended or refactored while preserving existing functionality whenever practical.

---

End of Document
