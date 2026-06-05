---
name: modern-webapp-environment
description: Build or retrofit Codex-friendly TypeScript web application environments. Use when a user wants to add AGENTS.md rules, .agents/PLANS.md ExecPlan workflow, Vite+ command/toolchain patterns, TanStack Start scaffolding, Playwright Page Object Model E2E, Testcontainers PostgreSQL parallel E2E support, commitlint/git-hook governance, review tooling such as similarity-ts/Knip/dependency-cruiser, project-local skill lifecycle and prompt evaluation, repository-specific review rubrics, license-safe extraction rules, typed env config, DI boundaries, test factories, spec governance, generated-code boundary governance, validation gates, or workspace supply-chain policy.
---

# Modern Webapp Environment

Use this skill to turn a repository into a Codex-friendly modern webapp workspace. It is an environment construction skill, not an app feature skill.

## Workflow

1. Before module selection or file edits, run `git status --short`.
   - If there are staged, unstaged, or untracked files, warn the user and stop. Ask them to commit, stash, or otherwise resolve the worktree before continuing.
   - Do not inspect around the dirty state by guessing ownership. This skill changes repository-wide setup files, so a clean baseline is required.
2. Inspect the target repository: package manager, app directories, existing `AGENTS.md`, existing `.agents`, package scripts, Vite/TanStack/Playwright/Testcontainers usage, generated-file conventions, formatting/lint conventions, and current validation commands.
3. Determine whether modules were explicitly selected.
   - Treat modules as selected only when the user names module ids, says `all`, or gives an unambiguous natural-language request that maps to specific modules.
   - Generic requests such as "set this repo up", "make it good", "give this repo a nice setup", or "modern webapp environment" are not explicit module selections.
   - If the user did not explicitly select modules, stop before applying anything and ask what to install. Present a checkbox-style module list in chat. If a structured UI input tool is available, use it; otherwise ask for comma-separated module ids and optional natural-language notes.
   - Do not silently choose the recommended default. Use recommended modules only after the user chooses "recommended", presses Enter in the bundled script prompt, or otherwise confirms that default set.
   - On an interactive terminal, running the bundled script without `--modules` or `--all` is acceptable because the script prompts for module selection.
4. Read only the references for selected modules:
   - ExecPlans: `references/execplans.md`
   - Vite+: `references/vite-plus.md`
   - TanStack Start: `references/tanstack-start.md`
   - Playwright/Testcontainers E2E: `references/e2e-playwright-testcontainers.md`
   - Review tooling: `references/review-toolchain.md`
   - Commit governance: `references/commit-governance.md`
   - Spec governance: `references/spec-governance.md`
   - Typed env: `references/typed-env.md`
   - DI boundaries: `references/di-boundaries.md`
   - Test factories: `references/test-factories.md`
   - Skill lifecycle: `references/skill-lifecycle.md`
   - Review rubric: `references/review-rubric.md`
   - Generated boundaries: `references/generated-boundaries.md`
   - Validation gates: `references/validation-gates.md`
   - Workspace supply-chain: `references/workspace-supply-chain.md`
   - License-safe extraction: `references/license-safe-extraction.md`
5. Run or adapt `scripts/apply-modern-webapp-environment.mjs`. Prefer `--dry-run` first on existing repositories.
6. Review generated files before finalizing.
   - Check whether generated files fit the repository's package manager, script names, app layout, path aliases, formatting style, naming conventions, test layout, docs layout, and existing tool configuration.
   - If a generated file conflicts with an existing convention, adapt the generated content to the local convention rather than forcing the template.
   - If a file already exists, merge narrowly into the established structure. Do not duplicate sections, create parallel config styles, or overwrite stronger local rules.
   - Record unresolved fit issues in `.agents/environment-setup-notes.md` before finalizing.
7. Run the validation commands suggested by the generated `AGENTS.md` and the selected module references.
8. Before the final response, report the selected modules, what was changed, which module acceptance checks passed, and any blocked checks.

## Module IDs

- `execplans`: create `AGENTS.md` guidance, `.agents/PLANS.md`, and `.agents/execplans/.gitkeep`.
- `vite-plus`: add Vite+ as the project command gateway and add baseline `vp` scripts/config when safe.
- `tanstack-start`: scaffold a TanStack Start app boundary when `--app-dir` is provided.
- `playwright-pom`: scaffold Playwright config, Page Object Model folders, and a smoke spec when `--app-dir` is provided.
- `testcontainers-e2e`: add dynamic-port E2E runner and Testcontainers PostgreSQL helper when `--app-dir` is provided.
- `review-toolchain`: add Knip, dependency-cruiser, and `similarity-ts` review guidance/config.
- `commit-governance`: add commitlint config, a `commit-msg` hook, and frequent-commit agent rules.
- `spec-governance`: add `docs/specs` decision-ledger templates and dated revision-note rules.
- `typed-env`: add Zod server/public env templates when `--app-dir` is provided.
- `di-boundaries`: add explicit dependency-injection/composition-root templates when `--app-dir` is provided.
- `test-factories`: add pure test factory templates when `--app-dir` is provided.
- `skill-lifecycle`: add project-local skill lifecycle and prompt-evaluation skill templates.
- `review-rubric`: add a generic repository-specific review rubric and review skill template.
- `generated-boundaries`: add generated/vendored code boundary rules shared by review tools.
- `validation-gates`: add aggregate and focused validation gate rules.
- `workspace-supply-chain`: add pnpm workspace catalog/trust-policy scaffold when safe.
- `license-safe`: add license-safe extraction rules for skills, prompts, vendored snippets, and external templates.

## Module Acceptance Checks

For every selected module, verify the corresponding acceptance condition before finalizing:

- `execplans`: `AGENTS.md` points to `.agents/PLANS.md`, `.agents/PLANS.md` exists, and `.agents/execplans/` exists.
- `vite-plus`: `vp` is the documented command gateway, package scripts/config do not conflict with existing package-manager conventions, and the intended `vp check`/`vp test` commands are documented.
- `tanstack-start`: app files are under the selected `--app-dir`, route/server-only boundaries match the existing app layout, and no server-only dependency is imported directly into client-facing routes.
- `playwright-pom`: Playwright config, specs, and Page Object classes exist in the repository's test layout, and POM classes do not create fixtures or seed data.
- `testcontainers-e2e`: E2E support uses dynamic ports, isolated database/container setup, and per-run output paths suitable for parallel runs.
- `review-toolchain`: similarity review, Knip, and dependency-boundary commands are documented through the repository's command gateway, and generated/vendored exclusions are explicit.
- `commit-governance`: commitlint/hook guidance exists, generated hook files are executable when applicable, and the guidance says not to stage unrelated user changes.
- `spec-governance`: `docs/specs` exists with dated revision-note guidance and a clear split between specs, ExecPlans, and agent workflow rules.
- `typed-env`: server/public env boundaries exist, production secrets have no unsafe defaults, and env access is kept in composition roots.
- `di-boundaries`: usecases receive explicit dependency objects and composition roots are separated from pure application logic.
- `test-factories`: factories are pure builders with overrides and do not perform database, network, repository, or global side effects.
- `skill-lifecycle`: project-local skill guidance exists, forward-testing/evaluation is required, and external skills are installed/locked rather than copied when licensing is unclear.
- `review-rubric`: review guidance prioritizes concrete findings, side-effect boundaries, type-safety, test sufficiency, and dependency-boundary drift.
- `generated-boundaries`: generated/vendored inventories are named, protected from accidental deletion, and shared across review tooling where practical.
- `validation-gates`: aggregate and focused validation commands are documented, including how to record blockers for Docker, browsers, or external services.
- `workspace-supply-chain`: workspace version/trust policy is documented without weakening existing package-manager protections.
- `license-safe`: distributable assets exclude secrets, customer data, proprietary prompts, private docs, and project-specific service identifiers; license/notice obligations are preserved when external material is used.

Recommended default, only after the user confirms it:

```bash
node /path/to/skills/modern-webapp-environment/scripts/apply-modern-webapp-environment.mjs \
  --modules execplans,vite-plus,generated-boundaries,validation-gates,review-toolchain,commit-governance,license-safe
```

For an app workspace:

```bash
node /path/to/skills/modern-webapp-environment/scripts/apply-modern-webapp-environment.mjs \
  --modules execplans,vite-plus,spec-governance,typed-env,di-boundaries,test-factories,tanstack-start,playwright-pom,testcontainers-e2e,generated-boundaries,validation-gates,review-toolchain,review-rubric,skill-lifecycle,commit-governance,license-safe \
  --app-dir apps/web \
  --package-name @scope/web
```

## Safety Rules

- Do not overwrite an existing non-generated file just to match the template. If merge behavior is unclear, leave the file intact and write a note under `.agents/environment-setup-notes.md`.
- Use `vp` as the validation entrypoint when the Vite+ module is selected. Do not mix direct package-manager commands into AGENTS unless the target repository already requires them.
- Treat `similarity-ts` and Knip as review signals. Do not delete files, remove packages, or suppress similarities without manual classification.
- Do not copy external skill bodies, proprietary prompts, or third-party templates into the target repo unless the license permits it and the notice/attribution obligations are preserved. Prefer original summaries plus installer commands.
- Keep E2E fixture creation outside Page Object classes. POM classes should drive and assert page behavior only.
- Make E2E parallel-safe: dynamic loopback ports, per-run result directories, isolated Testcontainers databases, and project-specific seed data when authentication is involved.
- When a design decision will outlive the task, record it in the relevant spec or project documentation with a dated revision note.

## Script

The bundled script is intentionally conservative and uses only Node built-ins. Run:

```bash
node scripts/apply-modern-webapp-environment.mjs --help
```

Run it from the target repository root. Use `--dry-run` to list changes without writing.
