# ExecPlan Module

Use this module when the target repository should support long-running, resumable implementation plans.

## What To Add

- A top-level `# ExecPlans` section near the top of `AGENTS.md`.
- This exact trigger sentence in `AGENTS.md`: `When writing complex features or significant refactors, use an ExecPlan (as described in .agents/PLANS.md) from design to implementation.`
- `.agents/PLANS.md` with the required ExecPlan contract.
- `.agents/execplans/.gitkeep` so plan files have a stable home.

Do not weaken this into "use `.agents/PLANS.md` for significant features" or bury it only inside generic working rules. The phrase should make `ExecPlan` itself the action.

## Pattern

An ExecPlan is a self-contained implementation specification. It must be understandable by a novice who only has the current working tree and the plan file. It must maintain these sections:

- `Purpose / Big Picture`
- `Progress`
- `Surprises & Discoveries`
- `Decision Log`
- `Outcomes & Retrospective`
- `Context and Orientation`
- `Plan of Work`
- `Concrete Steps`
- `Validation and Acceptance`
- `Idempotence and Recovery`
- `Artifacts and Notes`
- `Interfaces and Dependencies`

Plan filenames must start with an ISO UTC datetime and a descriptive name, for example:

```text
.agents/execplans/2026-06-05T170041Z_feature-name.md
```

Progress entries should include timestamps:

```text
- [x] (2026-06-05 17:00Z) Read relevant project configuration and wrote the first plan draft.
- [ ] Implement the first milestone and update this plan before stopping.
```

## Agent Rule

When writing AGENTS.md, preserve the canonical ExecPlan trigger even when adapting the rest of the file to a specific repository, language, or framework.

When implementing an ExecPlan, do not ask for next steps after each milestone. Continue, update the plan at every stopping point, and keep validation evidence in the plan.
