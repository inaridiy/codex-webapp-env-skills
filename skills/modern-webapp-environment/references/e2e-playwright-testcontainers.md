# Playwright POM And Testcontainers E2E Module

Use this module when the target app needs browser E2E with realistic dependencies and parallel-safe local runs.

## Structure

```text
tests/e2e/pages/
tests/e2e/specs/
tests/e2e/support/
tests/support/
playwright.config.ts
```

## Rules

- Page Object Model classes drive page-local behavior and assertions.
- POM classes must not create fixtures, seed databases, call server functions, or reach into implementation internals.
- Specs orchestrate user journeys with POMs and test fixtures.
- E2E support starts external dependencies, allocates dynamic ports, seeds data, and exposes readiness.
- Use role/name/test-id selectors before CSS or DOM-depth selectors.
- Avoid real OAuth providers in E2E. Use seeded password or test-only auth boundaries.

## Parallel-Safe Harness

- A runner script chooses loopback ports before Playwright config loads.
- `playwright.config.ts` reads `E2E_APP_ORIGIN`, `E2E_APP_PORT`, and `E2E_TEST_RESULTS_DIR`.
- `webServer.url` points at a readiness endpoint when one exists; otherwise it points at the app origin.
- Testcontainers PostgreSQL exposes container port `5432` and uses the mapped host port in `DATABASE_URL`.
- Each run writes results under `test-results/<run-id>`.

## Production Preview Default

Prefer building once and serving with preview for normal E2E:

```text
E2E_APP_SERVER_MODE=production -> vp build, then vp preview
E2E_APP_SERVER_MODE=development -> vp dev for debugging only
```

Build with production env when required, but runtime may still use `NODE_ENV=test` for test-only readiness and fixtures.
