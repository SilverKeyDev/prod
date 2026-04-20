# Features Package

Feature-level React modules live here. **`apps/web`** and **`apps/mobile`** stay thin: they compose exports from `packages/features/<name>/` inside pages and screens. See [thin-app-architecture.md](../../../documentation/client/thin-app-architecture.md).

## Feature list (examples)

```
packages/features/
├── saved/          # Saved homes, documents, tabs
├── dashboard/      # Client hub, calendar entrypoints, checklists
├── homeauth/       # Login, signup, onboarding, landing
├── search/         # Map, list, filters, reels on search
├── agent/          # Agent workspace, messaging, settings
├── profile/        # Profile, preferences, settings
├── documents/      # Documents, agreements, uploads
├── negotiate/      # Negotiation UI
├── calendar/       # Calendar shell, events, viewings
├── feed/           # Feed and reels
└── ...
```

## Structure inside each feature

Each feature subfolder (e.g. `saved/`, `dashboard/`, `agent/`) **may only** contain the following subfolders and the barrel file. No other direct children are allowed (enforced by ESLint rule `silverkey/package-module-allowed-children`).

| Subfolder         | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| **`api/`**        | Network requests and endpoint definitions for the feature. |
| **`components/`** | UI elements specific to this feature.                      |
| **`hooks/`**      | Custom React hooks for the feature.                        |
| **`store/`**      | Local state management (e.g. Zustand slice).               |
| **`types/`**      | TypeScript interfaces and models.                          |
| **`utils/`**      | Pure helper functions.                                     |
| **`index.ts`**    | The public API (barrel file).                              |

Example for one feature:

```
packages/features/saved/
├── api/          # Network requests and endpoint definitions
├── components/  # SavedLayout, SavedContent, etc.
├── hooks/       # useSavedHomes, useSavedTabs, etc.
├── store/       # saved slice or feature store
├── types/       # TypeScript interfaces and models
├── utils/       # saved-specific helpers
└── index.ts     # public API barrel
```

## Import Rules

Feature code in `packages/features/<name>/`:

- ✅ **Can import from** (within the same feature): the feature’s own `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`
- ✅ **Can import from** (shared packages): `packages/ui`, `packages/hooks`, `packages/store`, `packages/utils`, `packages/schemas`, `packages/navigation`, `packages/logger`, and other paths allowed by ESLint for feature modules
- ❌ **Cannot import from**: `apps/web/*` or `apps/mobile/*` (features are framework-agnostic)
- ❌ **Cannot import from**: Other feature packages (to prevent circular dependencies)

Apps (`apps/web/` and `apps/mobile/`) will import feature components from here:

```typescript
// CORRECT: app imports feature from packages
import { SavedLayout } from "packages/features/saved";

// WRONG: feature imports from app
import { SomeComponent } from "../../../apps/web/pages/...";
```

## Related Documentation

- [Thin App Architecture](../../../documentation/client/thin-app-architecture.md) - Overview of the thin app pattern
- [Frontend Architecture](../../../.cursor/rules/frontend/frontend-architecture.mdc) - Layer rules and import boundaries

## Status

New work belongs in `packages/features/<name>/` with thin shells in `apps/web/pages/` or `apps/mobile/app/screens/`. If you find legacy fat logic under `apps/web/`, move it into the appropriate package and keep the app file as composition only.
