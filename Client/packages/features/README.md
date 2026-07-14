# Features Package

Feature-level React modules live here. **`apps/web`** and **`apps/mobile`** stay thin: they compose exports from `packages/features/<name>/` inside pages and screens. See [thin-app-architecture.md](../../../documentation/architecture/thin-app-architecture.md).

## Feature modules (current)

```
packages/features/
├── admin/              # Super-admin and dev persona sections
├── agent/              # Agent workspace, clients, messaging chrome
├── brokerage/          # Brokerage workspace shell
├── calendar/           # Calendar and events
├── checklists/         # Transaction checklists and roadmap
├── compare/            # Property comparison (uses search research APIs)
├── dashboard/          # Shared dashboard shell composition
├── documents/          # Documents, agreements, DocuSign
├── feed/               # Feed and reels
├── homeauth/           # Login, signup, onboarding, landing
├── integrationPartner/ # Integration-partner workspace shell
├── messaging/          # Threads, sidebar shell, client conversations
├── negotiate/          # Negotiation UI
├── partners/           # Partner marketplace / placement (RESPA-scoped)
├── profile/            # Profile, preferences, onboarding registry
├── propertyDetails/    # Property detail modal and sections
├── saved/              # Saved homes and tabs
├── search/             # Map, list, filters, search UX
├── seller/             # Seller workspace shell
└── workspace/          # Workspace switcher and placeholder shells
```

Orchestrator hubs (compose other features): `dashboard`, `saved`, `agent`, `checklists`, `search`, `messaging`. See [cross-feature-composition.md](../../../documentation/architecture/cross-feature-composition.md).

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

## Import rules

Feature code in `packages/features/<name>/`:

- ✅ **Same feature:** `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`
- ✅ **Shared packages:** `packages/ui`, `packages/hooks`, `packages/store`, `packages/utils`, `packages/schemas`, `packages/navigation`, `packages/logger`, and other ESLint-allowed paths
- ✅ **Other features (Tier 1–2):** provider **barrel** (`packages/features/<provider>`) or a **documented subpath**—see [cross-feature-composition.md](../../../documentation/architecture/cross-feature-composition.md)
- ❌ **Apps:** `apps/web/*` or `apps/mobile/*` (features stay framework-agnostic)
- ⚠️ **Other feature `utils/`:** value imports warn under `silverkey/no-cross-feature-utils-imports`—lift to `packages/utils` or use the provider barrel

**Canonical policy:** [cross-feature-composition.md](../../../documentation/architecture/cross-feature-composition.md) (tiers, orchestrator hubs, audit edge matrix, decision tree).

**Audit (visibility, not CI):** `pnpm audit:cross-feature-imports:json` from `Client/`.

### Example: messaging ↔ agent (Pattern A / B)

Prefer **composition** over duplicating modules. Full policy is in the doc above; messaging↔agent is one documented case:

| Pattern | When to use | Example |
| ------- | ----------- | ------- |
| **A — Shell + children** | Generic layout in one feature; domain panels composed by parent | `MessagingSidebarShell` (messaging) + `AgentMessagingClientList` (agent) in `AgentMessaging` |
| **B — Narrow chrome barrel** | Single panel from another feature | `agent/components/messaging/chrome` (not the full modals barrel) |

**Ownership (messaging vs agent):**

- **messaging** — threads, messages, `MessagingSidebarShell`, client conversation list, unified chrome
- **agent** — client list sidebar, connection-request inbox, `messagingConfig`, attachment menu, search/calendar modals from messaging

**Messaging → agent subpaths** (narrow over time): `messagingConfig`, `AttachmentMenu`, `components/modals`, `hooks/data` (`useAgentClients`, `useConnectionRequests`, `useEventRequests`).

Apps (`apps/web/` and `apps/mobile/`) will import feature components from here:

```typescript
// CORRECT: app imports feature from packages
import { SavedLayout } from "packages/features/saved";

// WRONG: feature imports from app
import { SomeComponent } from "../../../apps/web/pages/...";
```

## Related Documentation

- [Cross-feature composition](../../../documentation/architecture/cross-feature-composition.md) - Import tiers, orchestrators, audit edges
- [Thin App Architecture](../../../documentation/architecture/thin-app-architecture.md) - Overview of the thin app pattern
- [Layered architecture imports](../../../documentation/architecture/layered-architecture-imports.md) - config vs hooks vs services vs features
- [Frontend Architecture](../../../.cursor/rules/frontend/frontend-architecture.mdc) - Layer rules and import boundaries

## Status

New work belongs in `packages/features/<name>/` with thin shells in `apps/web/pages/` or `apps/mobile/app/screens/`. If you find legacy fat logic under `apps/web/`, move it into the appropriate package and keep the app file as composition only.
