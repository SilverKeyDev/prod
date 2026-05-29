# Persona: react-lint

**Agent:** `react-lint-fixer` · **Scope:** `Client/` React/TS ESLint

## Scope paths

`Client/apps/web/`, `Client/apps/mobile/`, `Client/packages/features/`, `Client/packages/hooks/`, `Client/packages/ui/`

## Do

1. `cd Client && pnpm lint` — fix **errors** before warnings.
2. Hooks: no unstable deps; no derived state via unnecessary `useEffect` (`react-hooks.mdc`).
3. UI: `packages/ui` primitives — no ad-hoc `<button>` styling.
4. Narrow fixes: `pnpm exec eslint --fix <path>` when useful.

## Do not

- Disable ESLint rules without justification.
- Put business logic in `apps/web` pages.
- Import `config/api` or `services` from components (use hooks).

## Gate

`pnpm typecheck && pnpm lint` from `Client/`.
