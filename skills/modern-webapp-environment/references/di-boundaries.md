# DI Boundaries Module

Use this module when backend/server code should be testable without global stubs or hidden production defaults.

## Pattern

- Feature API or route modules are production composition roots.
- Usecases receive complete, non-optional dependency objects.
- Production defaults live in `src/features/<feature>/api/dependencies.ts` or route factories, not inside usecases.
- Inject side effects: database, repositories, fetch/client, clock, ID/random, crypto, and env.
- Import pure deterministic helpers directly.

## Red Flags

```bash
rg -n 'dependencies\\?:|dependencies\\s*=\\s*\\{|= \\{\\}\\)|\\?\\?\\s*(fetch|db|ENV|new Date|crypto|randomUUID)|stubGlobal\\(|vi\\.stubGlobal\\(' src tests
```

## Validation

```bash
vp run <package>#test -- --run
vp run <root-depcruise-script>
```
