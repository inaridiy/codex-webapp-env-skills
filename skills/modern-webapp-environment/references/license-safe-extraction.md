# License-Safe Extraction Module

Use this module when converting project practices, external skills, snippets, templates, or docs into reusable setup modules.

## Rules

- Write new original guidance instead of copying third-party text.
- If you vendor third-party code or templates, include the license and required notices.
- If a skill comes from another repository, prefer installing it with `$skill-installer` and recording the source in `skills-lock.json`.
- Do not copy proprietary prompts, private docs, customer data, secrets, or unpublished internal material into distributable skills.
- Keep generated scaffolding generic. Remove project-specific service names, secrets, customer identifiers, and domain-only logic.
- Document assumptions and attribution in a setup note when material is derived from an external source.

## Validation

```bash
find . -iname 'LICENSE*' -o -iname 'NOTICE*'
rg -n 'Copyright|Licensed under|SPDX|source:|computedHash|secret|token|password' .agents skills docs package.json
```
