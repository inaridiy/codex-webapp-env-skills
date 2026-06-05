# Skill Lifecycle Module

Use this module when project-local agent skills should preserve reusable knowledge and be evaluated before finalization.

## Pattern

- Store project-local skills under `.agents/skills/<skill-name>/SKILL.md`.
- Keep generated UI metadata under `.agents/skills/<skill-name>/agents/openai.yaml` when useful.
- Store external skill pins in `skills-lock.json`.
- When a skill is created or heavily revised, forward-test it with a fresh agent or record why evaluation is blocked.
- Evaluate the skill by giving the fresh agent a realistic task, a fixed checklist, and no hidden expected answer.

## License Safety

Do not copy external skill bodies into project-local skills unless the license permits it. Prefer original project-specific guidance and installation instructions for upstream skills.

## Validation

```bash
find .agents/skills -maxdepth 2 -name SKILL.md -print
rg -n '^---|^name:|^description:' .agents/skills/*/SKILL.md
rg -n 'computedHash|source|skillPath' skills-lock.json
```
