# Validation Gates Module

Use this module when a repository needs clear aggregate and focused validation commands.

## Pattern

- Provide one aggregate command for final readiness.
- Provide focused commands by touched area.
- Keep the command map in `AGENTS.md` so agents do not rediscover validation every task.

## Example

```json
{
  "scripts": {
    "ready": "vp run fmt && vp lint && vp run test -r && vp run build -r"
  }
}
```

## AGENTS Rule

Run the aggregate readiness command before signoff when practical. Also run focused validation for touched areas such as backend usecases, route/auth flows, E2E browser journeys, dependency boundaries, Storybook, or deployment artifacts. Record exact blockers when Docker, browsers, or external services are unavailable.
