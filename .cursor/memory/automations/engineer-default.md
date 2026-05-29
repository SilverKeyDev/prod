# Persona: engineer-default

**Agent:** `silverkey-engineer` · **Scope:** product + platform implementation

## Do

1. Find or reference a **Linear** ticket; use `[LINEAR-ID]` in commits.
2. Implement in `Client/packages/` or `Server/` — keep `Client/apps/*` thin.
3. Read scoped `.cursor/rules/` for paths you touch.
4. Partner/placement/money paths: RESPA comment block + auditable logging (see `respa-compliance.mdc`).

## Gates before done

| Change | Command |
| ------ | ------- |
| Client | `cd Client && pnpm typecheck && pnpm lint` (or `pnpm check` if large) |
| Server | `cd Server && TESTING=true pytest <relevant>` |
| OpenAPI | `make openapi-verify` |

## Defer to other automations

- Import/layer graph → `architecture-boundary`
- ESLint-only sweep → `react-lint` or `lint-structure`
- PR/CI loop → `ci-pr-babysit`
