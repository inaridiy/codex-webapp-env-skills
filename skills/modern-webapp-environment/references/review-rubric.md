# Review Rubric Module

Use this module when a repository needs a project-specific review skill in addition to mechanical tools.

## Pattern

- Keep prose review values in `docs/review-points.md`.
- Convert those values into `.agents/skills/project-code-review/SKILL.md`.
- Use the skill before reviews/refactors, then run mechanical tools.
- Ask a fresh reviewer/subagent for large or self-authored changes when available.

## Generic Review Priorities

- Hidden side effects and production defaults inside usecases.
- Optional/default dependency objects that make tests misleading.
- Global stubs for code that should accept explicit dependencies.
- Large files, vague utility placement, and inconsistent folder ownership.
- `any`, casual `unknown`, broad casts, and weak domain modeling.
- Hand-rolled parsers/crypto/protocol state machines where proven libraries exist.

## Validation

```bash
rg -n 'dependencies\\?:|dependencies\\s*=\\s*\\{|stubGlobal\\(|vi\\.stubGlobal\\(|\\bany\\b|\\bunknown\\b' src tests
find src -type f \\( -name '*.ts' -o -name '*.tsx' \\) -print0 | xargs -0 wc -l | sort -nr | head -40
```
