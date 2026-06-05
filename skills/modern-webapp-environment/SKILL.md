---
name: modern-webapp-environment
description: Build or retrofit Codex-friendly TypeScript web application environments. Use when a user wants to add AGENTS.md rules, .agents/PLANS.md ExecPlan workflow, Vite+ command/toolchain patterns, TanStack Start scaffolding, Playwright Page Object Model E2E, Testcontainers PostgreSQL parallel E2E support, commitlint/git-hook governance, or review tooling such as similarity-ts, Knip, and dependency-cruiser.
---

# Modern Webapp Environment

Use this skill to turn a repository into a Codex-friendly modern webapp workspace. It is an environment construction skill, not an app feature skill.

## Workflow

1. Inspect the target repository first: package manager, app directories, existing `AGENTS.md`, existing `.agents`, package scripts, Vite/TanStack/Playwright/Testcontainers usage, and dirty git state.
2. If the user did not specify modules, present a checkbox-style module list in chat. If a structured UI input tool is available, use it; otherwise ask for comma-separated module ids and optional natural-language notes.
3. Read only the references for selected modules:
   - ExecPlans: `references/execplans.md`
   - Vite+: `references/vite-plus.md`
   - TanStack Start: `references/tanstack-start.md`
   - Playwright/Testcontainers E2E: `references/e2e-playwright-testcontainers.md`
   - Review tooling: `references/review-toolchain.md`
   - Commit governance: `references/commit-governance.md`
4. Run or adapt `scripts/apply-modern-webapp-environment.mjs`. Prefer `--dry-run` first on existing repositories.
5. Review generated files before finalizing. Keep existing local conventions when they are stronger than the template.
6. Run the validation commands suggested by the generated `AGENTS.md` and the selected module references.

## Module IDs

- `execplans`: create `AGENTS.md` guidance, `.agents/PLANS.md`, and `.agents/execplans/.gitkeep`.
- `vite-plus`: add Vite+ as the project command gateway and add baseline `vp` scripts/config when safe.
- `tanstack-start`: scaffold a TanStack Start app boundary when `--app-dir` is provided.
- `playwright-pom`: scaffold Playwright config, Page Object Model folders, and a smoke spec when `--app-dir` is provided.
- `testcontainers-e2e`: add dynamic-port E2E runner and Testcontainers PostgreSQL helper when `--app-dir` is provided.
- `review-toolchain`: add Knip, dependency-cruiser, and `similarity-ts` review guidance/config.
- `commit-governance`: add commitlint config, a `commit-msg` hook, and frequent-commit agent rules.

Recommended default:

```bash
node /path/to/skills/modern-webapp-environment/scripts/apply-modern-webapp-environment.mjs \
  --modules execplans,vite-plus,review-toolchain,commit-governance
```

For an app workspace:

```bash
node /path/to/skills/modern-webapp-environment/scripts/apply-modern-webapp-environment.mjs \
  --modules execplans,vite-plus,tanstack-start,playwright-pom,testcontainers-e2e,review-toolchain,commit-governance \
  --app-dir apps/web \
  --package-name @scope/web
```

## Safety Rules

- Do not overwrite an existing non-generated file just to match the template. If merge behavior is unclear, leave the file intact and write a note under `.agents/environment-setup-notes.md`.
- Use `vp` as the validation entrypoint when the Vite+ module is selected. Do not mix direct package-manager commands into AGENTS unless the target repository already requires them.
- Treat `similarity-ts` and Knip as review signals. Do not delete files, remove packages, or suppress similarities without manual classification.
- Keep E2E fixture creation outside Page Object classes. POM classes should drive and assert page behavior only.
- Make E2E parallel-safe: dynamic loopback ports, per-run result directories, isolated Testcontainers databases, and project-specific seed data when authentication is involved.
- When a design decision will outlive the task, record it in the relevant spec or project documentation with a dated revision note.

## Script

The bundled script is intentionally conservative and uses only Node built-ins. Run:

```bash
node scripts/apply-modern-webapp-environment.mjs --help
```

Run it from the target repository root. Use `--dry-run` to list changes without writing.
