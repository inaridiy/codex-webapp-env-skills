# Spec Governance Module

Use this module when durable design decisions should live in specs instead of chat, commits, or execution plans.

## Pattern

- Keep enduring architecture, API, data-model, security, testing, and deployment decisions under `docs/specs`.
- Use ExecPlans for task execution history and `docs/specs` for the current design ledger.
- Add dated revision notes for important changes:

```text
Revision note (2026-06-05): Production auth secrets must be provided explicitly; local defaults are development-only.
```

## Files

```text
docs/specs/README.md
docs/specs/01_scope_and_principles.md
docs/specs/02_architecture.md
```

## AGENTS Rule

Important design decisions must be recorded in the most relevant spec with a dated revision note. Do not hide enduring decisions only in chat, commits, PRs, or ExecPlans.

## Validation

```bash
rg -n "Revision note \\([0-9]{4}-[0-9]{2}-[0-9]{2}\\)" docs/specs
```
