# Typed Environment Module

Use this module when a webapp needs typed runtime environment variables with local defaults and production assertions.

## Pattern

- Parse server env with Zod in `src/config/env.ts`.
- Keep browser-public env in `src/config/public-env.ts`.
- Allow local development defaults, but reject production defaults for secrets, origins, and database URLs.
- Put direct `ENV()` calls in composition roots. Usecases should receive `Pick<ServerEnv, ...>` or explicit config fields.

## Files

```text
src/config/env.ts
src/config/public-env.ts
src/config/env.test.ts
.env.example
```

## Validation

```bash
vp run <package>#test -- --run src/config
NODE_ENV=production vp run <package>#build
```
