# Commit Governance Module

Use this module when the target repository should enforce conventional commit messages and instruct agents to commit at meaningful stopping points.

## Files

```text
commitlint.config.cjs
.vite-hooks/commit-msg
```

Commitlint config:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

Commit hook:

```sh
#!/usr/bin/env sh
vp exec commitlint --edit "$1"
```

Root `package.json` should install hooks through:

```json
{
  "scripts": {
    "prepare": "git config core.hooksPath .vite-hooks || true"
  }
}
```

## AGENTS Rules

- Commit frequently after coherent milestones.
- Do not stage unrelated user changes.
- Use conventional commit messages such as `docs(execplan): add setup plan`, `test(web): add parallel e2e harness`, or `chore(tooling): add commitlint hook`.
- If the worktree is mixed, stage explicit paths rather than `git add -A`.
