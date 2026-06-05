# Vite+ Module

Use this module when the target repository should use `vp` as the single command gateway for install, dev, build, format, lint, type checking, and tests.

## Intended Shape

- Root `package.json` has scripts such as `ready`, `dev`, `knip`, and `prepare`.
- Workspace packages define their own scripts, and root scripts call them with `vp run <package>#<task>`.
- Root `vite.config.ts` owns global fmt/lint/test ignore patterns and baseline test environment.
- `AGENTS.md` tells agents to use `vp install`, `vp check`, `vp test`, and `vp run <script>`.

## Baseline Root Scripts

```json
{
  "scripts": {
    "ready": "vp run fmt && vp lint && vp run test -r && vp run build -r",
    "knip": "knip",
    "prepare": "git config core.hooksPath .vite-hooks || true"
  }
}
```

Use only the scripts that correspond to selected modules. For example, do not add `knip` unless review tooling is selected.

## Baseline Root Vite+ Config

```ts
import { defineConfig } from "vite-plus";

const generatedIgnorePatterns = ["**/routeTree.gen.ts"];
const shadcnComponentIgnorePatterns = ["**/components/ui/**"];
const referenceIgnorePatterns = ["docs/references/**/*"];

export default defineConfig({
  fmt: {
    ignorePatterns: [
      ...generatedIgnorePatterns,
      ...shadcnComponentIgnorePatterns,
      ...referenceIgnorePatterns,
    ],
  },
  lint: {
    ignorePatterns: [
      ...generatedIgnorePatterns,
      ...shadcnComponentIgnorePatterns,
      ...referenceIgnorePatterns,
    ],
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    passWithNoTests: true,
  },
});
```

If a `vite.config.ts` already exists, inspect and adapt it instead of replacing it.
