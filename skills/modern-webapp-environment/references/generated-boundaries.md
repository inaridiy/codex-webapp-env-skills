# Generated And Vendored Boundaries Module

Use this module when generated files, vendored references, submodules, or UI inventories should be protected consistently across tools.

## Pattern

- Name ignore groups in config instead of scattering ad hoc excludes.
- Reuse the same groups for format, lint, test, Knip, dependency-cruiser, and similarity review.
- Treat generated code and UI inventories as intentional unless the owning generator/package says otherwise.

## Common Ignore Groups

```ts
const generatedIgnorePatterns = ["**/routeTree.gen.ts"];
const shadcnComponentIgnorePatterns = ["**/components/ui/**"];
const referenceIgnorePatterns = ["docs/references/**/*"];
const localToolingIgnorePatterns = [".pnpm-store/**/*"];
```

## AGENTS Rule

Do not delete, rewrite, or format generated/vendored/submodule files because a review tool reports them as unused, duplicate, or unformatted. First verify the owner and update the shared ignore set if needed.
