# Features Package

Feature-level React modules live here. **`apps/web`** and **`apps/mobile`** stay thin: they compose exports from `packages/features/<name>/` inside pages and screens. See [thin-app-architecture.md](../../../documentation/client/thin-app-architecture.md).

## Feature list (examples)

```
packages/features/
├── saved/          # Saved homes, documents, tabs
├── dashboard/      # Shared dashboard shell; agent client hub lives in agent
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
- ❌ **Cannot import from**: Other feature packages by default (to prevent circular dependencies)

### Cross-feature exceptions

Prefer **composition** over shared modules that import both features.

| Pattern | When to use | Example |
| ------- | ----------- | ------- |
| **A — Shell + children** | Generic layout lives in one feature; domain-specific panels are composed by the parent screen | `MessagingSidebarShell` (messaging) + `AgentMessagingClientList` (agent) wired in `AgentMessaging` |
| **B — Narrow chrome barrel** | Messaging needs a single agent-only sidebar panel | Import only from `agent/components/messaging/chrome` (e.g. `ConnectionRequestsInboxSidebar`), not `agent/components/index` or the full modals barrel |

**Ownership (messaging vs agent):**

- **messaging** — threads, messages, `MessagingSidebarShell`, client conversation list, unified input/list chrome
- **agent** — agent client list sidebar, connection-request inbox, `messagingConfig`, attachment menu, search/calendar modals used from messaging

**Documented messaging → agent edges** (not sidebar; narrow over time):

- `agent/components/messaging/screen/messagingConfig` — mode copy and styling
- `agent/components/messaging/menus/AttachmentMenu` — composer attachments
- `agent/components/modals` — search/home/document/calendar modals shell
- `agent/hooks/data` — `useAgentClients`, `useConnectionRequests`, `useEventRequests`

Audit cross-feature imports: `pnpm audit:cross-feature-imports:json` (from `Client/`).

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
