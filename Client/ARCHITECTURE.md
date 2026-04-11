# Client Architecture

## Overview

The SilverKey client is a **cross-platform frontend** built with React (web) and React Native (mobile), following a **Thin App (Fat Packages)** architecture where apps are composition layers and all logic lives in shared packages.

## Directory Structure

```
Client/
├── apps/
│   ├── web/                    # Web app (Vite + React Router)
│   │   ├── pages/              # Page components (thin shells)
│   │   ├── app/layouts/        # Layout components
│   │   ├── components/ui/      # Standardized UI components (Button, Title, etc.)
│   │   ├── main.tsx            # Entry point
│   │   ├── vite.config.js      # Main Vite configuration
│   │   └── vite.config.resolve.js  # Vite resolve configuration (extracted to reduce file size)
│   └── mobile/                 # React Native app (Metro)
│       ├── app/screens/        # Screen components (thin shells)
│       ├── app/providers/      # Platform-specific providers
│       └── App.tsx             # Entry point
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
└── documentation/              # Client-specific documentation
```

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
│  packages/config/api/               │  API clients
│  (Thin wrappers: authApi, userApi)  │
├─────────────────────────────────────┤
│  packages/services/                 │  Infrastructure
│  (HTTP client, security, logging)   │
└─────────────────────────────────────┘
```

### Import Rules

| From                            | Can Import                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apps/web/*` or `apps/mobile/*` | `packages/hooks/*`, `packages/store/*`, `packages/ui/*`, `packages/utils/*`, `packages/contexts/*` |
| `packages/hooks/data/*`         | `packages/config/api/*`, `packages/store/*`, `packages/services/http/*`                            |
| `packages/hooks/store/*`        | `packages/hooks/data/*`, `packages/store/*`                                                        |
| `packages/config/api/*`         | `packages/services/http/*`, `packages/services/security/*`                                         |

**Forbidden:**

- ❌ Apps → `packages/config/api/*` or `packages/services/*` (use hooks instead)
- ❌ Hooks → Business logic services (use `config/api/*`)
- ❌ Services → Hooks or React (services are framework-agnostic)

See: `.cursor/rules/frontend/frontend-architecture.mdc`

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
packages / ui / components / Button.tsx;

// ✅ Web-only layout
apps / web / app / layouts / sidebar / Sidebar.web.tsx;

// ✅ Mobile-only layout
apps / mobile / app / components / BottomNav.native.tsx;
```

See: `.cursor/rules/frontend/platform-file-extensions.mdc`

## State Management

### Server Cache: TanStack Query (React Query)

For **server data** (users, properties, preferences, etc.):

```typescript
// packages/hooks/data/useUserData.ts
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../config/api/user";

export const useUserData = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => userApi.getProfile(),
  });

  return { user: data, isLoading };
};
```

**Benefits:**

- Automatic caching, refetching, and invalidation
- Loading/error states
- Cancellation on unmount

### UI State: Zustand

For **global UI state** (modals, sidebar open, filters, etc.):

```typescript
// packages/store/slices/ui/sidebar.slice.ts
import { create } from "zustand";

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
}));
```

**Integration hooks** (in `packages/hooks/store/`) sync server cache → Zustand when UI needs global access.

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

## React Hooks Best Practices

### Avoid Infinite Loops

**Most common bug:** `useEffect` with unstable dependencies

```typescript
// ❌ WRONG: New object every render → effect every render
useEffect(() => {
  setX(...)
}, [{ foo: bar }]);

// ✅ CORRECT: Memoize objects
const filter = useMemo(() => ({ foo: bar }), [bar]);
useEffect(() => {
  setX(...)
}, [filter]);

// ✅ BETTER: Derive instead of storing
const x = useMemo(() => compute(bar), [bar]);
```

### No Async useEffect

```typescript
// ❌ WRONG: Async effect
useEffect(async () => {
  const data = await fetch(...);
}, []);

// ✅ CORRECT: Use React Query
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: () => fetch(...),
});

// ✅ CORRECT: Explicit async with cleanup
useEffect(() => {
  const ac = new AbortController();
  (async () => {
    const data = await fetch(..., { signal: ac.signal });
    if (!ac.signal.aborted) setData(data);
  })();
  return () => ac.abort();
}, []);
```

See: `.cursor/rules/frontend/react-hooks.mdc`, `.cursor/rules/frontend/async-cancellation.mdc`

## UI Components

### Standardized Components

All buttons and text MUST use standardized components from `apps/web/components/ui/`:

```typescript
import { Button, CancelButton, CloseButton, Title, BodyText, Label } from "../ui";

// ✅ CORRECT
<Button variant="primary" size="md">Save</Button>
<Title size="lg">Settings</Title>
<BodyText size="sm" muted>Description text</BodyText>

// ❌ WRONG: Custom button with inline styles
<button className="px-4 py-2 bg-blue-500">Save</button>

// ❌ WRONG: Direct text size classes
<h2 className="text-xl font-bold">Settings</h2>
```

### Color System

- **Primary/CTA**: Olive (via `brand-accent`)
- **Secondary/Cancel**: Gray
- **Danger**: Rose
- **Success**: Brand secondary

Never use brown for buttons. Use semantic variants (primary, secondary, danger) instead of direct colors.

See: `.cursor/rules/frontend/ui-components.mdc`

## Build and Tooling

### Web (Vite)

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

Configuration: `apps/web/vite.config.js` (with helpers in `vite.config.resolve.js`)

### Mobile (Metro)

- **Dev**: `npm run start` (Expo)
- **iOS**: `npm run ios`
- **Android**: `npm run android`

Configuration: `apps/mobile/metro.config.js`, `app.json`

### Linting and Type Checking

```bash
# Lint (ESLint + custom rules)
npm run lint

# Format check (Prettier)
npm run format:check

# Type check (TypeScript)
npm run typecheck

# Run all checks
npm run check:all
```

Custom ESLint rules in `packages/config/eslint/` enforce architecture patterns.

See: `.cursor/rules/shared/ci-gates.mdc`, `.cursor/rules/shared/linting.mdc`

## Testing

### Unit Tests (Vitest)

Located in `packages/` next to source files:

```typescript
// packages/hooks/data/useUserData.test.ts
import { renderHook } from "@testing-library/react";
import { useUserData } from "./useUserData";

test("loads user data", async () => {
  const { result } = renderHook(() => useUserData());
  expect(result.current.isLoading).toBe(true);
});
```

**Coverage target:** ≥80% for shared packages

### E2E Tests (Playwright)

Located in `apps/web/tests/e2e/`:

```typescript
// apps/web/tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("user can log in", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "user@example.com");
  // ...
});
```

**Run:** `npm run test:e2e`

See: `.cursor/rules/shared/testing-tiers.mdc`

## Code Organization

### File Size Guidelines

- **Target:** <400 lines per file
- **When to split:** Complexity (cyclomatic) > Line count
- **Avoid fragmentation:** Don't split just for line count; split when clear concerns emerge

### Naming Conventions

- **Descriptive names:** `profileFormSync.ts` > `utils.ts`
- **Domain-based:** `packages/utils/search/`, `packages/utils/profile/`
- **No redundancy:** Not `types/types.ts` → `documentTypes.ts`

### Where to Put New Code

| Type          | Location                                         |
| ------------- | ------------------------------------------------ |
| Feature UI    | `packages/features/<feature>/components/`        |
| Feature logic | `packages/features/<feature>/hooks/` or `utils/` |
| Shared UI     | `packages/ui/components/`                        |
| Utilities     | `packages/utils/<domain>/` (NOT under `apps/`)   |
| API calls     | `packages/config/api/`                           |
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
- **Thin App Pattern:** `documentation/client/thin-app-architecture.md`
- **Shared Packages:** `documentation/client/shared-packages.md`
- **Mobile Structure:** `documentation/client/mobile-app-structure.md`
- **Cross-Platform:** `documentation/client/react-vs-react-native-packages.md`
- **Frontend Rules:** `.cursor/rules/frontend/`
- **Shared Rules:** `.cursor/rules/shared/`

## Contributing

1. **Follow Thin App pattern:** Logic in `packages/`, not in `apps/`
2. **Use standardized UI:** Button, Title, BodyText from `components/ui/`
3. **Respect layers:** Apps → Hooks → Config/API → Services
4. **Test locally:** Run `npm run check:all` before committing
5. **Document patterns:** Update rules or docs for architectural changes

## Further Reading

- **Root Architecture:** `/ARCHITECTURE.md`
- **Server Architecture:** `/Server/ARCHITECTURE.md`
- **Documentation Index:** `documentation/README.md`
- **How We Document:** `documentation/HOW_WE_DOCUMENT.md`
