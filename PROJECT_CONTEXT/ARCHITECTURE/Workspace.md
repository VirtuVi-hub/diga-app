# Delta Workspace v3

Status: Approved

Version: 3.0

---

# Purpose

Workspace v3 defines the permanent navigation architecture of Delta and the structure of the project workspace.

It describes how architects move through the product and how they interact with project knowledge once inside a project.

This document is the architectural blueprint for all workspace and navigation implementation.

Sprint documents implement this specification.

---

# Design Philosophy

Delta separates two experiences.

All Projects is a simple landing page.

Home is a continuous project workspace.

Project, Data, and Knowledge Bank are focused destination pages reached deliberately from Home.

Architects should never feel like they are navigating software while inside Home.

Every interface decision should reduce unnecessary context switching within Home.

The workspace must feel calm, editorial, and knowledge-first.

---

# Core Principles

• Knowledge-first

• Home is a continuous workspace

• Data drives knowledge

• AI supports work but never dominates it

• Progressive disclosure

• Minimal navigation

• Editorial presentation

• Preserve user context

---

# Navigation Architecture

Delta has two levels of navigation.

---

## Global Navigation

Always available, regardless of whether a project is open.

- All Projects
- Settings

---

## Project Navigation

Available once a project is open.

- Home
- Project
- Data
- Knowledge Bank

---

# Workflow

Login

↓

All Projects

↓

Select Project

↓

Home (Project Journal)

↓

Navigate to:

- Project
- Data
- Knowledge Bank

The workspace should reinforce this workflow.

---

# All Projects

Purpose

The landing page after login.

Browse all projects assigned to the user.

Contents

- Project cards
- Search
- Create Project
- Filters (future)

This page is intentionally simple.

No Timeline.

No Delta.

No Project Journal.

No Knowledge Bank.

No Data.

---

# Home

Purpose

Home is the Project Journal.

It is the default page whenever a project is opened.

This is where users spend most of their time.

Home is the only page that renders the full workspace.

## Home — Workspace Regions

---

## Region A

### Sidebar

Purpose

Global navigation only.

Contains

- All Projects
- Settings

The sidebar remains visible throughout the workspace.

---

## Region B

### Timeline

Purpose

Display the project's chronological evolution.

Contents

- Meetings
- Document uploads
- Decisions
- Approvals
- Revisions
- Milestones

Characteristics

- Thin vertical strip
- Newest items appear at the top
- Click to inspect an item
- Does not become the primary workspace

---

## Region C

### Project Journal

Purpose

The primary collaboration workspace.

Everything ultimately appears here.

Contains

- Topics
- Discussions
- Comments
- Meetings
- Documents in context
- Decision discussions
- Delta summaries

The Journal is the center of the workspace.

---

## Region D

### Delta

Purpose

Project intelligence.

Delta provides

- Context-aware assistance
- Search
- Summaries
- Suggestions
- Reasoning

The product never refers to this area as "Assistant."

Users only see:

Delta

Delta should feel embedded into the workspace rather than existing as a separate application.

---

# Project

Purpose

The administrative information page for a project.

This page is not the primary workspace.

Contents

- Project information
- Agreement
- Brief
- BOQ
- Description
- Project metadata
- Recent activity
- Project statistics

Permissions

Only visible to:

- Client (CL)
- Lead Architect (LAr)

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

# Workspace Behaviour

The Sidebar remains persistent.

Project Navigation (Home, Project, Data, Knowledge Bank) remains persistent once a project is open.

Within Home, the Timeline remains persistent and the Journal changes according to the selected context.

Within Home, Delta adapts to the current context.

Project, Data, and Knowledge Bank are reached deliberately and do not carry the Timeline, Journal, or Delta regions.

The user should rarely experience a full page transition while inside Home.

---

# Visual Principles

The workspace should feel:

- Calm

- Editorial

- Minimal

- Architectural

- Spacious

Avoid:

- Chat application appearance

- Dashboard appearance

- Excessive colours

- Excessive chrome

- Multiple competing panels

---

# Design Constraints

Do not introduce new pages unless absolutely necessary.

Avoid modal-heavy workflows.

Avoid duplicated navigation.

Keep components reusable.

Preserve user context.

Avoid unnecessary scrolling.

Maintain visual consistency.

---

# Future Expansion

Workspace v3 should support future capabilities without structural redesign.

Examples

- Knowledge Bank improvements

- Meeting intelligence

- Decision tracking

- Timeline improvements

- Search

- Collaboration

These should fit naturally inside the existing navigation architecture.

---

# Relationship to Sprint Documents

Workspace_v3 defines:

WHAT the navigation architecture and workspace are.

Sprint documents define:

HOW individual parts are implemented.

Workspace_v3 is the architectural source of truth.

Sprint documents must not contradict this specification.
