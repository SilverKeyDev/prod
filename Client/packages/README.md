# Packages directory

Shared client behavior lives in **`Client/packages/`**. **`apps/web`** and **`apps/mobile`** compose these packages (routing, providers, thin pages/screens).

## Layout

```
packages/
├── api/             # API helpers barrel
├── config/          # Env, HTTP, React Query
├── contexts/        # React providers
├── design-tokens/   # Colors, spacing, breakpoints
├── email-templates/
├── features/        # Feature modules (primary UI + logic)
├── hooks/           # Shared React hooks
├── logger/
├── navigation/      # Path helpers (no react-router in features)
├── schemas/         # Shared TS types
├── services/        # HTTP, security, domain services
├── store/           # Zustand slices
├── types/           # Types barrel (+ OpenAPI generated)
├── ui/              # Primitives and design system
└── utils/           # Framework-agnostic helpers
```

Global styles: **`packages/ui/styles/`** (wired from `apps/web`).

## Import rules (summary)

| Layer | May import | Must not |
| ----- | ---------- | -------- |
| **Apps** | hooks, store, schemas, utils, contexts, navigation, ui, features, logger | `config/api/*`, business `services/*` directly |
| **Hooks** | `packages/api`, store, schemas, `services/http`, `services/security` | Business `services/*` (use `packages/api`) |
| **Services** | api, http, security, schemas | hooks, store |
| **Config** | http, security, schemas | Business services |

- **Canonical paths:** `packages/...` from anywhere under `Client/`.
- **`@/...`:** Only under **`apps/web/`**.
- **API barrel:** `packages/api` — [shared-packages.md](../../documentation/architecture/shared-packages.md#api-client-import-path-canonical).

## Package index

| Package | Role |
| ------- | ---- |
| `config/` | API clients, app configuration |
| `services/` | HTTP, security, orchestration (via hooks from apps) |
| `hooks/` | Data, store, UI hooks |
| `store/` | Zustand (prefer `hooks/store/*` for integration) |
| `schemas/` / `types/` | Shared types; OpenAPI-generated in `types/` |
| `contexts/` | Providers (theme, i18n, …) |
| `features/` | Feature modules — see [features/README.md](./features/README.md) |
| `ui/` | Cross-platform UI — [LINTING.md](../../documentation/reference/linting.md) |

## Patterns

- **Data:** components → `packages/hooks/*` → `packages/api` (not raw API imports in UI).
- **Errors:** `packages/utils/core/errorHandling`.
- **Exception:** `packages/services/data/` may use `QueryClient` for prefetch/polling.

## Further reading

- [Client/ARCHITECTURE.md](../ARCHITECTURE.md)
- [documentation/README.md](../../documentation/README.md)
- [shared-packages.md](../../documentation/architecture/shared-packages.md)
- [layered-architecture-imports.md](../../documentation/architecture/layered-architecture-imports.md)
- [frontend-architecture.mdc](../../.cursor/rules/frontend/frontend-architecture.mdc)
- [AGENTS.md](../../AGENTS.md)
