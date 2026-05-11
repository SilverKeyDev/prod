# Agent quickstart (SilverKey)

Use this file as the **first stop** for automated assistants working in this repository.

## Client frontend (React web + React Native)

1. **Architecture:** Thin `apps/` (composition + routing only), fat `packages/` (behavior, features, hooks, UI primitives). Read `Client/ARCHITECTURE.md` and `documentation/client/thin-app-architecture.md`.
2. **Layer rules:** Components → hooks → `packages/config/api` → HTTP. Apps must not import `packages/config/api` or business `packages/services` directly. Full rules: `.cursor/rules/frontend/frontend-architecture.mdc`.
3. **Where to put new code:**
   - Pages/screens: `Client/apps/web/pages/` or `Client/apps/mobile/app/screens/` — thin shells only.
   - Feature UI + feature hooks: `Client/packages/features/<feature>/`.
   - Shared hooks: `Client/packages/hooks/`.
   - API clients: `Client/packages/config/api/`.
   - Pure utilities: `Client/packages/utils/` (not under `apps/web/features` or `apps/web/components`).
4. **UI components:** Cross-platform primitives and design-system pieces live in **`Client/packages/ui/`**. The web app does not use a separate `apps/web/components/ui` tree; import via `packages/ui/...`, or the tsconfig aliases `@/components/ui` / `@ui` (see `Client/tsconfig.base.json`).
5. **Import paths (canonical):** Use **`packages/...`** for all shared code under `Client/packages/`. Use **`@/...`** only for paths under **`Client/apps/web/`** (e.g. `@/pages/...`, `@/app/...`). The alias `@/features/...` maps to `packages/features/...`; prefer **`packages/features/...`** in new code for consistency. Details: `documentation/client/typescript-files.md` and `Client/packages/README.md`.
6. **Docs index:** `documentation/client/README.md` — linting, TypeScript layout, shared packages, platform variants, mobile parity.
7. **Repo rules:** `.cursorrules` (e.g. no unsolicited markdown, lint bar). Skills and extra rules: `.cursor/skills/`, `.cursor/rules/`.

## Server / API

- Documentation index: `documentation/server/README.md`.
- OpenAPI is the contract: `.cursor/rules/shared/openapi-workflow.mdc`.

### Backend consolidation / refactor PR checklist

Before merging moves that consolidate helpers or reshuffle imports under `Server/app`:

1. **Circular imports:** from repo root, `python3 Server/scripts/lint_circular_imports.py` must exit `0`.
2. **Automated tests:** run targeted `pytest` for touched packages (for example `pytest Server/tests/unit/services/...`).
3. **API contract:** if HTTP routes or request/response shapes change, update OpenAPI sources and regenerate or align `Client/packages/types/api.generated.ts`; run contract tests such as `Server/tests/contract/test_openapi_contracts.py` where applicable.

Domain rotation prompts for duplication audits reference `Server/scripts/backend_dedup_rotation.json`.

## Checks (Client)

From `Client/`: `pnpm typecheck`, `pnpm lint`, `pnpm lint:cycles`, `pnpm format:check`, tests as configured in `Client/package.json`.

## Checks (repo-wide)

From repo root: `./scripts/run-all-linters.sh [client|server|all]` — Client runs `Client/scripts/run-client-linters.sh` (auto-executes executable `Client/scripts/lint.d/*.sh`, then `pnpm check`); Server runs every `Server/scripts/lint_*.py` then every executable `Server/scripts/lint_*.sh` (add new linters by adding a file; no edit to this script required).
