# Features Package

This directory is the **future home** for feature-level React components as part of SilverKey's Thin App (Fat Packages) architecture migration.

## Current State

Feature components live in `packages/features/<name>/` and are composed by `apps/web/pages/` and app routes. See [thin-app-architecture.md](../../../documentation/client/thin-app-architecture.md) for the Thin App (Fat Packages) pattern.

## Future Architecture Goal

### Target Structure

```
packages/features/
├── saved/          # Saved homes, documents, tabs
├── dashboard/      # Calendar, checklists, client list, client hub
├── auth/           # Login, signup, verification
├── search/         # Filters, list, map
├── agent/          # Agent dashboard, messaging, settings
├── profile/        # User profile, preferences, settings
├── documents/      # Document and agreement management (provider-agnostic)
├── negotiate/      # Negotiation strategies and tools
└── ...
```

### Structure inside each feature

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

### Migration Strategy

Feature components will be migrated incrementally following the **Hybrid approach** (Option D) outlined in the implementation strategy:

1. **Phase 1** - Primitives first: Move UI primitives to `packages/ui/`
2. **Phase 2** - Features: Move feature components here to `packages/features/<name>/`
3. **Phase 3** - Thin pages: Refactor pages in `apps/web/` to thin composition only

### Benefits

- **Cross-platform sharing**: Web and mobile apps compose the same feature components
- **Single source of truth**: Features implemented once, used everywhere
- **Easier testing**: Feature components can be tested independently
- **Clear boundaries**: Features depend only on packages (ui, hooks, store, utils, schemas)

## Import Rules

Once migrated, feature code in `packages/features/<name>/`:

- ✅ **Can import from** (within the same feature): the feature’s own `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`
- ✅ **Can import from** (shared packages): `packages/ui`, `packages/hooks`, `packages/store`, `packages/utils`, `packages/schemas`, `packages/platform`
- ❌ **Cannot import from**: `apps/web/*` or `apps/mobile/*` (features are framework-agnostic)
- ❌ **Cannot import from**: Other feature packages (to prevent circular dependencies)

Apps (`apps/web/` and `apps/mobile/`) will import feature components from here:

```typescript
// ✅ CORRECT: App imports feature from package
import { SavedLayout, SavedContent } from "@silverkey/features/saved";

// ❌ WRONG: Feature imports from app
import { SomeComponent } from "../../../apps/web/components/...";
```

## Related Documentation

- [Thin App Architecture](../../../documentation/client/thin-app-architecture.md) - Overview of the thin app pattern
- [Frontend Architecture](../../../.cursor/rules/frontend/frontend-architecture.mdc) - Layer rules and import boundaries

## Status

Feature components live in `packages/features/<name>/`; apps compose them via thin pages and routes. Remaining feature code in `apps/web/` continues to move here incrementally.
