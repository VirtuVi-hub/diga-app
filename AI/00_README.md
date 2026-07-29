# DIGA AI Workspace

Welcome.

This repository is developed using multiple AI coding assistants.

Current AI tools include:

- Claude Code
- OpenAI Codex
- GitHub Copilot Agent / VS AI

Every AI assistant must treat these documents as the authoritative source of truth.

Do not make architectural or product decisions without consulting these files.

---

## Reading Order

Always read the files in this order before implementing significant changes.

1. 01_PRODUCT.md
2. 02_ARCHITECTURE.md
3. 03_DESIGN_SYSTEM.md
4. 04_PRODUCT_DECISIONS.md
5. 05_ROADMAP.md

Only after understanding these documents should implementation begin.

---

## Development Philosophy

Product design decisions are made outside the coding assistant.

The coding assistant is responsible for implementation.

If an implementation detail is ambiguous:

- Preserve existing behavior.
- Avoid introducing new product concepts.
- Prefer asking for clarification over making assumptions.

---

## General Rules

Do not redesign the application unless explicitly instructed.

Do not rename features unless specified in PRODUCT_DECISIONS.md.

Do not introduce duplicate components.

Prefer refactoring over rewriting.

Reuse existing components whenever possible.

Use design tokens instead of hardcoded values.

Preserve TypeScript safety.

Keep components small and reusable.

---

## Validation

Before completing any implementation, ensure:

- npm run lint
- npx tsc --noEmit
- npm run build

All should pass successfully.

---

## Communication

When implementing work:

1. Briefly summarize your understanding.
2. List the files that will be modified.
3. Implement only the requested scope.
4. Summarize what changed.
5. Report validation results.

Do not perform unrelated refactoring.

Do not modify unrelated files.

Keep changes focused and reviewable.