# Review Toolchain Module

Use this module when the target repository should have repeatable review and refactor checks.

## Tools

- `similarity-ts`: semantic duplicate and near-duplicate detection. It is a review signal, not an automatic failure.
- `knip`: unused files, unlisted imports, and stale project references. Do not treat it as automatic package pruning.
- `dependency-cruiser`: executable architecture boundary rules. Error violations are blockers unless already documented.

## AGENTS Rules

When reviewing or refactoring, run:

```bash
similarity-ts src --exclude routeTree.gen.ts --exclude components/ui --threshold 0.9 --types --classes --suggest
vp run knip
```

For app-specific boundaries, add a package script such as:

```json
{
  "scripts": {
    "depcruise": "depcruise --config dependency-cruiser.config.cjs --output-type err src"
  }
}
```

Then root can expose:

```json
{
  "scripts": {
    "depcruise:web": "vp run @scope/web#depcruise"
  }
}
```

## Review Interpretation

- Analyze duplicate code before refactoring. Some parallel policy checklists are intentionally duplicated for auditability.
- Do not remove packages just because Knip reports them. Verify runtime, build-time, tooling, generated-code, and framework roles first.
- Prefer fixing dependency direction over adding broad dependency-cruiser ignores.
