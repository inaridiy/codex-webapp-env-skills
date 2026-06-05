# Test Factories Module

Use this module when tests need consistent typed data without hidden side effects.

## Pattern

- Create `buildXxx(overrides)` functions under `tests/support/factories`.
- Factories return typed objects only.
- Factories must not open databases, start containers, call repositories, mutate globals, or depend on wall-clock time unless the caller passes it.
- Use side-effecting fixture helpers only for real cross-test workflows.

## Structure

```text
tests/support/factories/index.ts
tests/support/factories/example.ts
tests/support/mock-repositories.ts
```

## Validation

```bash
vp run <package>#test -- --run
rg -n 'build[A-Z][A-Za-z0-9]+\\(|insert into|\\.execute\\(sql|seed[A-Z]' tests
```
