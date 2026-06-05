# Workspace Supply-Chain Module

Use this module when a monorepo should centralize dependency versions and reduce supply-chain risk.

## Pattern

- Use `pnpm-workspace.yaml` catalog entries for shared dependency versions.
- Pin `packageManager` and minimum Node version in root `package.json`.
- Prefer `minimumReleaseAge`, `trustPolicy`, and `blockExoticSubdeps` when supported by the package manager.
- Do not scatter package-local version pins when a workspace catalog exists.

## Validation

```bash
vp install --frozen-lockfile
rg -n 'catalog:|minimumReleaseAge|trustPolicy|blockExoticSubdeps|packageManager' pnpm-workspace.yaml package.json
```
