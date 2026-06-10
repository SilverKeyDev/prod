# Client Architecture

## Overview

The SilverKey client is a **cross-platform frontend** built with React (web) and React Native (mobile), following a **Thin App (Fat Packages)** architecture where apps are composition layers and all logic lives in shared packages.

## Directory Structure

```
Client/
├── apps/
│   ├── web/                    # Web app (Vite + React Router)
│   │   ├── pages/              # Page components (thin shells)
│   │   ├── app/layouts/        # Layout and shell components (web-specific where needed)
│   │   ├── main.tsx            # Entry point
│   │   ├── vite.config.js      # Main Vite configuration
│   │   └── vite.config.resolve.js  # Vite resolve configuration (extracted to reduce file size)
│   └── mobile/                 # React Native app (Metro + Expo)
│       ├── app/screens/        # Screen components (thin shells)
│       ├── app/providers/      # Platform-specific providers
│       └── App.tsx             # Expo entry → AppRoot.native.tsx
├── packages/
│   ├── features/               # Feature modules (auth, search, profile, etc.)
│   │   ├── <feature>/
│   │   │   ├── api/            # Network requests
│   │   │   ├── components/     # Feature UI components
│   │   │   ├── hooks/          # Feature-specific hooks
│   │   │   ├── store/          # Feature state (Zustand)
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── utils/          # Feature utilities
│   │   │   └── index.ts        # Public API (barrel)
│   ├── ui/                     # Shared UI primitives
│   ├── hooks/                  # Shared React hooks
│   │   ├── data/               # TanStack Query hooks (API data)
│   │   ├── store/              # Store integration hooks
│   │   └── ui/                 # UI state hooks
│   ├── store/                  # Zustand slices (global state)
│   ├── utils/                  # Pure utility functions
│   ├── config/                 # API clients and configuration
│   ├── services/               # Business logic services
│   ├── contexts/               # React Context providers
│   └── schemas/                # Shared type definitions
```

Long-form client docs live at repo root in **`documentation/client/`** (see [documentation/client/architecture/](../documentation/client/architecture/)).

### `packages/utils` top-level domains

Shared pure helpers live under `Client/packages/utils/` with many **top-level sibling folders**. Use this map when choosing where to add or find code (subfolders inside each domain carry the detail):

| Folder | Typical contents |
| --- | --- |
| affordability | Home price and financing calculators |
| agent | Public URLs, slugs, pending agent connect |
| agreement | Agreement status and agenda accent helpers |
| array | Small array helpers |
| auth | Legacy auth utilities |
| calendar | Calendar-adjacent helpers (feature code usually lives in `packages/features/calendar`) |
| date | Locale and display dates |
| documents | Forms library filters and document mapping |
| dom | DOM escaping |
| domain | Cross-cutting domain labels; profile field helpers and scales |
| errorHandling | Error types and user-facing messages |
| format | Currency, addresses, match scores, property display |
| layout | Dashboard modal inset and layout config |
| maps | Map styling helpers |
| media | Default avatar, remote image prefetch |
| navigation | Deep link resolve, URL parsing, post-auth redirect |
| perf | Shell / route load tracing |
| platform | Dimensions, linking adapters (web/native) |
| property | Property/listing mapping |
| propertyDetails | Analysis sections, commute destinations, media helpers |
| routing | Routing helpers |
| saved | Universal saved-home mapping |
| scheduling | Event-request availability |
| search | Scoring, sorting, autocomplete, polygon/places helpers, share payloads |
| share | Web Share API helpers |
| storage | Platform storage abstraction |
| tour | Product tour steps and targets |
| typeGuards | Unknown coercion and guards |
| ui | Tiny UI-adjacent helpers (non-components) |
| verification | Verification code input helpers |
| web | Web-only helpers (e.g. settings scroll) |

### Where UI components live

- **Shared primitives and design system** — `Client/packages/ui/` (buttons, text, modals, cards, layout primitives, and `packages/ui/styles/` for CSS). This is what ESLint/UI rules refer to as the standardized component set.
- **TypeScript aliases** — `Client/tsconfig.base.json` maps `@/components/ui` and `@ui` to `packages/ui/components` so existing imports stay short; **`packages/ui/...`** is the preferred spelling for new code (see `documentation/client/architecture/typescript-files.md`).
- **Web app** — `apps/web` has **no** parallel `components/ui` tree; pages and `app/` layouts compose `packages/features/*` and `packages/ui`.

## Thin App (Fat Packages) Pattern

### Apps are Composition Layers

**`apps/web/` and `apps/mobile/`** contain:

- ✅ Routing and navigation setup
- ✅ Page/screen shells (compose packages)
- ✅ Entry points (`main.tsx`, `App.tsx`)
- ✅ Platform-specific configuration (Vite, Metro, `app.json`)
- ✅ Only `.tsx` and barrel `index.ts` (no standalone `.ts` logic)

**Apps MUST NOT contain:**

- ❌ Business logic
- ❌ Standalone `.ts` utility files (→ `packages/utils/`)
- ❌ Data fetching logic (→ `packages/hooks/data/`)
- ❌ State management (→ `packages/store/`)

### Packages are Implementation

**`packages/`** contains all implementation:

- Business logic, hooks, state, UI primitives, utilities
- Feature modules with clear public APIs (barrel files)
- Cross-platform by default (`.tsx`/`.ts`)

## Layered Architecture

```
┌─────────────────────────────────────┐
│  apps/web/ or apps/mobile/          │  Composition layer
│  (Pages, screens, routing)          │
├─────────────────────────────────────┤
│  packages/hooks/                    │  React hooks
│  (useX data, useY UI state)         │
├─────────────────────────────────────┤
│  packages/api/                      │  API clients (canonical barrel)
│  (authApi, userApi, feature api/)   │
├─────────────────────────────────────┤
│  packages/services/                 │  Infrastructure
│  (HTTP client, security, logging)   │
└─────────────────────────────────────┘
```

**Import matrix and layer rules:** [documentation/client/architecture/layered-architecture-imports.md](../documentation/client/architecture/layered-architecture-imports.md). Enforced in CI via `.cursor/rules/frontend/frontend-architecture.mdc` and ESLint `silverkey/no-restricted-imports-architecture`.

## Platform File Extensions

### Default: Shared (`.tsx` / `.ts`)

Use `.tsx`/`.ts` for files that work on both web and mobile (90%+ of code).

### Platform-Specific Only When Necessary

- **`.web.tsx`/`.web.ts`**: Web-only (DOM APIs, react-router-dom, web-specific layouts)
- **`.native.tsx`/`.native.ts`**: Mobile-only (React Native APIs, native modules)

**Rule:** If mobile can use the same file, don't add `.web`.

**Examples:**

```typescript
// ✅ Shared component (no suffix)
packages/ui/components/Button.tsx;

// ✅ Web-only layout
apps/web/app/layouts/sidebar/Sidebar.web.tsx;

// ✅ Mobile-only screen
apps/mobile/app/screens/DashboardScreen.native.tsx;
```

See: `.cursor/rules/frontend/platform-file-extensions.mdc`

## State Management

- **Server cache:** TanStack Query in `packages/hooks/data/*` — calls `packages/api` (or legacy `packages/config/http/api` re-exports).
- **Global UI state:** Zustand slices in `packages/store/`; components use integration hooks from `packages/hooks/store/*` when server cache and store must stay in sync.

See: `.cursor/rules/frontend/state-boundaries.mdc`

## Cross-Platform Strategy

### Maximum Component Reuse

**Default:** Web and mobile use the **same components** from `packages/`.

**Platform-specific only when:**

1. Uses web-only APIs (DOM, `window`, `react-router-dom`)
2. Uses native-only APIs (React Native modules, native navigation)
3. Fundamentally different UX (desktop sidebar vs mobile tabs)

### Shared Primitives

Use layout and UI primitives that work across platforms:

```typescript
// ✅ Shared primitive
import { Box, Text, Button } from "packages/ui/primitives";

// ❌ Platform-specific elements (avoid in shared code)
import { div } from "react"; // Web-only
import { View } from "react-native"; // Native-only
```

See: `.cursor/rules/shared/cross-platform-component-reuse.mdc`

## React Hooks and UI Components

- **Hooks:** Loop prevention, async effects, and Zustand selector patterns — `.cursor/rules/frontend/react-hooks.mdc`, `.cursor/rules/frontend/async-cancellation.mdc`; examples in [documentation/client/patterns/react-hooks-patterns.md](../documentation/client/patterns/react-hooks-patterns.md).
- **UI:** All buttons and text use **`Client/packages/ui/`** primitives — `.cursor/rules/frontend/ui-components.mdc`.

## Build and Tooling

Run from **`Client/`** with **pnpm 9** (see root `AGENTS.md`).

| Target | Command |
| ------ | ------- |
| Web dev | `pnpm dev:web` |
| Mobile dev | `pnpm dev:mobile` |
| Typecheck | `pnpm typecheck` |
| Lint + cycles | `pnpm lint && pnpm lint:cycles` |
| Full client gate | `pnpm check` |

Web: `apps/web/vite.config.js` (+ `vite.config.resolve.js`). Mobile: `apps/mobile/metro.config.js`, `app.json`. Config reference: [documentation/client/tooling/config-files-reference.md](../documentation/client/tooling/config-files-reference.md).

Custom ESLint rules in `packages/config/eslint/` enforce architecture patterns. See: `.cursor/rules/shared/ci-gates.mdc`, `.cursor/rules/shared/linting.mdc`

## Testing

### Unit Tests (Vitest)

Located in `packages/` next to source files:

```typescript
// packages/hooks/data/user/useUserData.test.ts
import { renderHook } from "@testing-library/react";
import { useUserData } from "./useUserData";

test("loads user data", async () => {
  const { result } = renderHook(() => useUserData());
  expect(result.current.isLoading).toBe(true);
});
```

**Coverage target:** ≥80% for shared packages

### Browser E2E

There is **no** Playwright or Cypress suite in this repo. Use the QA runbooks under `documentation/client/qa/` for release verification. Optional **visual parity** scripts under `Client/scripts/visual-parity/` use the `playwright` package’s `chromium` launcher (`pnpm parity:web:*` from `Client/package.json`).

See: `.cursor/rules/shared/testing-tiers.mdc`

## Code Organization

### File Size Guidelines

- **Target:** <400 lines per file
- **When to split:** Complexity (cyclomatic) > Line count
- **Avoid fragmentation:** Don't split just for line count; split when clear concerns emerge

### Naming Conventions

- **Descriptive names:** `profileFormSync.ts` > `utils.ts`
- **Domain-based:** `packages/utils/product/search/`, `packages/utils/profile/`
- **No redundancy:** Not `types/types.ts` → `documentTypes.ts`

### Where to Put New Code

| Type          | Location                                         |
| ------------- | ------------------------------------------------ |
| Feature UI    | `packages/features/<feature>/components/`        |
| Feature logic | `packages/features/<feature>/hooks/` or `utils/` |
| Shared UI     | `packages/ui/components/`                        |
| Utilities     | `packages/utils/<domain>/` (NOT under `apps/`)   |
| API calls     | `packages/api/` (canonical; see `packages/features/*/api/`) |
| React hooks   | `packages/hooks/`                                |
| Types         | `packages/schemas/` or feature `types/`          |

See: `.cursor/rules/shared/code-organization.mdc`, `.cursor/rules/shared/folder-decomposition.mdc`

## Asset Strategy

### Icons

Use a single icon entry point:

```typescript
// ✅ CORRECT: Import from single entry
import { Search, User, Home } from "packages/ui/icons";

// ❌ AVOID: Direct imports scattered across files
import { Search } from "lucide-react";
```

### Images

Import from assets module, not arbitrary paths:

```typescript
// ✅ CORRECT: Import from assets module
import { logo } from "@/assets";

// ❌ AVOID: Arbitrary image imports
import logo from "../../logo.png";
```

See: `.cursor/rules/frontend/assets-and-icons.mdc`

## Documentation

- **This file:** Client architecture overview
- **Thin App Pattern:** `documentation/client/architecture/thin-app-architecture.md`
- **Shared Packages:** `documentation/client/architecture/shared-packages.md`
- **Mobile Structure:** `documentation/client/platform/mobile-app-structure.md`
- **Cross-Platform:** `documentation/client/platform/react-vs-react-native-packages.md`
- **Frontend Rules:** `.cursor/rules/frontend/`
- **Shared Rules:** `.cursor/rules/shared/`

## Contributing

1. **Follow Thin App pattern:** Logic in `packages/`, not in `apps/`
2. **Use standardized UI:** Button, Title, BodyText from `packages/ui/`
3. **Respect layers:** Apps → Hooks → `packages/api` → Services
4. **Test locally:** Run `pnpm check` before committing
5. **Document patterns:** Update rules or docs for architectural changes

## Further Reading

- **Root Architecture:** `/ARCHITECTURE.md`
- **Server Architecture:** `/Server/ARCHITECTURE.md`
- **Documentation Index:** `documentation/README.md`
- **How We Document:** `documentation/HOW_WE_DOCUMENT.md`
