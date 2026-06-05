# Codex Webapp Environment Skills

Reusable Codex skills for setting up modern web app development environments.

## Install

```bash
python "$CODEX_HOME/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo inaridiy/codex-webapp-env-skills \
  --path skills/modern-webapp-environment
```

Restart Codex after installing.

## Included Skill

- `modern-webapp-environment`

It can scaffold or document patterns for:

- `AGENTS.md` and `.agents/PLANS.md` ExecPlan workflows
- Vite+ projects
- TanStack Start apps
- Playwright POM E2E tests
- Testcontainers-backed parallel E2E tests
- review tooling such as `similarity-ts`, Knip, and dependency boundaries
- commit governance, skill lifecycle, and license-safe extraction rules

