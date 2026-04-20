# Shared UI Package (Option 2: The Monorepo Route)

This document originally described **Option 2** for cross-platform UI: a shared **`packages/ui`** so Web and Mobile can share the same design system. **That package now exists** at **`Client/packages/ui/`**; web and features import it today. Keep this doc for **rationale and migration patterns**; where the text below says “all UI in apps/web” or “no `.tsx` in packages,” treat that as **historical** unless marked otherwise.

## Context: The Fork in the Road

Historically, many teams kept **all `.tsx` in `apps/web/`** and **logic in `packages/`**, which limited UI sharing with React Native. SilverKey moved the design system and feature UI into **`packages/`** so both apps compose the same modules.

- **Option 1 (Duplicate UI):** Leave `apps/web` as-is. Build `apps/mobile` with its own React Native components. Two separate UI libraries; brand/primitive changes must be done in both places.
- **Option 2 (Shared UI):** Extract the base design system into **`packages/ui`** with platform-specific implementations (`.web.tsx` / `.native.tsx`). One design system; Web and Mobile both consume `@silverkey/ui`.

This document details **Option 2** only.

---

## Current State vs Target State

### Current state (repository)

- **`packages/ui/`** — Shared primitives, design-system components, and `packages/ui/styles/` (web CSS). Platform splits use `.web.tsx` / `.native.tsx` where needed.
- **`packages/features/`** — Feature screens and feature-specific components; composed by thin `apps/web/pages/` and `apps/mobile` screens.
- **`apps/web` / `apps/mobile`** — Routing, providers, and thin composition only (see `thin-app-architecture.md`).

### Target state (fully aligned cross-platform)

- **Ongoing:** Expand native implementations and adapters so Mobile reaches parity with Web using the same `packages/ui` APIs.
- **Platform variants:** Bundlers resolve `.web` vs `.native` (Vite vs Metro).

```
/packages
  /ui          # Design system (shared .tsx + platform variants)
  /features    # Feature modules
  /hooks, /store, /config, …
/apps
  /web         # Thin pages + shell
  /mobile      # Thin screens + shell
```

---

## Why a Shared `packages/ui`?

| Goal | Effect |
|------|--------|
| **Single source of truth** | One place for primitives (Button, Text, Input, etc.). Brand or behavior changes (e.g. primary color olive → blue) are done once. |
| **Design rules** | UI component standards (see `ui-components.mdc`) can be enforced in one package and reused on both platforms. |
| **Faster mobile rollout** | Mobile reuses the same “brain” (hooks, store, API) and the same **component API**; only the implementation (DOM vs RN primitives) differs. |
| **Consistent API** | Same props and semantics on web and native (e.g. `<Button variant="primary">`) so feature code is easier to share or mirror. |

---

## How to Make the Shift Efficiently (Incremental)

You do **not** need to move everything at once.

### 1. Create the package

- Add **`packages/ui/`** with its own **`package.json`** (e.g. `"name": "@silverkey/ui"`).
- Configure **exports** so that `Button` resolves to the correct entry (e.g. `./Button` → folder with `index.web.tsx` / `index.native.tsx`, or barrel `index.ts` that re-exports).
- Ensure **tsconfig** (and Vite/Metro) know about `packages/ui` and resolve `.web` / `.native` by platform.

### 2. Move primitives first

- When extracting **new** primitives, start with the **lowest-level** components in `packages/ui/`: e.g. **Button**, **Text**, **Input**, **Label**.
- Move each into `packages/ui/<ComponentName>/`.
- **Web:** Use **`.web.tsx`** (e.g. `Button.web.tsx` or `index.web.tsx` inside `Button/`) so Vite keeps using the web implementation.
- **Native:** Add **`.native.tsx`** (e.g. `Button.native.tsx` or `index.native.tsx`) that implements the same public API with React Native primitives (`Pressable`, `Text`, etc.). Initially these can be minimal (e.g. a simple `<Pressable>` + `<Text>`).

### 3. Update imports in `apps/web`

- Replace app-local UI imports with the shared package.
- **Before:** `import { Button } from "@/components/ui"` (or `from "../../components/ui"`).
- **After:** `import { Button } from "packages/ui"` (or `@/components/ui` / `@ui` aliases).
- Do this incrementally (e.g. one component at a time) and fix lint/type errors as you go.

### 4. Leave complex and app-specific UI in the app

- **Stay in `apps/web/`:** Page layouts, feature-specific components, modals that use DOM-only APIs, etc.
- **Stay in `apps/mobile/`:** Screen layouts, native-only components.
- Only the **design primitives** (and optionally small, highly reusable building blocks) live in `packages/ui`.

### 5. Document and enforce

- Update **.cursor/rules/frontend/frontend-architecture.mdc** and any **path alias** / layer docs to state that primitives come from `@silverkey/ui`.
- **Lint/architecture:** Optionally enforce that `apps/web` and `apps/mobile` do not define their own Button/Text/Input and instead import from `packages/ui`.

---

## File and Folder Conventions

- **Per-component folder:** e.g. `packages/ui/Button/`.
- **Platform entry points:**  
  - **Web:** `index.web.tsx` (or `Button.web.tsx`) — DOM/React for web.  
  - **Native:** `index.native.tsx` (or `Button.native.tsx`) — React Native.
- **Barrel:** A shared `index.ts` in the component folder can re-export the component; the bundler (Vite/Metro) will resolve `index.web.tsx` or `index.native.tsx` based on platform. Alternatively, the package’s root `index.ts` re-exports from each component folder (and resolution is again by platform).
- **Types:** Shared props and types can live in `Button.types.ts` (or similar) and be imported by both `.web.tsx` and `.native.tsx`.

Existing platform rules (e.g. `.cursor/rules/frontend/platform-file-extensions.mdc`) apply: use **`.native.tsx`** for React Native and **`.web.tsx`** for web-only or desktop-only implementations.

---

## Package and Build Configuration (Reference)

To make **Vite** (web) and **Metro** (React Native) both understand `@silverkey/ui` and resolve `.web` vs `.native`:

1. **`packages/ui/package.json`**
   - **`name`:** e.g. `"@silverkey/ui"`.
   - **`main` / `types` / `exports`:** Point to the right entry (e.g. `"."` → `"./index.ts"` and/or per-component subpaths). Ensure `exports` allow both web and native resolvers to find `.web` and `.native` entry points (tooling-dependent).
   - **`peerDependencies`:** e.g. `react`, `react-dom` for web and `react`, `react-native` for native, as appropriate.

2. **Workspace**
   - `packages/ui` must be part of the monorepo workspace (e.g. listed in root `package.json` `workspaces` or pnpm workspace) so that `apps/web` and `apps/mobile` can depend on it.

3. **Vite (web)**
   - Resolve `@silverkey/ui` to `packages/ui` (e.g. via workspace or `resolve.alias`).
   - Vite (or the plugin in use) must resolve `.web.tsx` when building for web (and ignore `.native.tsx`).

4. **Metro (React Native)**
   - Metro’s `resolver.resolveRequest` (or equivalent) must prefer `.native.tsx` over `.web.tsx` when building the mobile app.
   - Ensure the workspace package is visible to Metro (e.g. `watchFolders` / `nodeModules` include the monorepo packages).

5. **TypeScript**
   - **tsconfig** in `packages/ui` should extend the root/base config and include both `.web.tsx` and `.native.tsx` (or use separate configs if the project prefers). Apps that consume `@silverkey/ui` should see the correct types for their platform when the build resolves the right extension.

Exact `package.json` and `tsconfig.json` snippets are not included here; they depend on the current repo setup (pnpm/npm, Vite version, Metro version). The intent is to document **what** must be configured so that someone can add the exact fields when implementing Option 2.

---

## Summary

- **Option 2** = introduce **`packages/ui`** (`@silverkey/ui`) with shared primitives implemented as **`.web.tsx`** and **`.native.tsx`**.
- **Current:** All UI is in `apps/web`; no UI sharing with mobile.
- **Target:** Primitives in `packages/ui`; both apps import from `@silverkey/ui`; complex/app-specific UI remains in each app.
- **Migration:** Incremental — create package, move primitives (Button, Text, Input, etc.), add native stubs, update imports in `apps/web`, then expand as needed.
- **Config:** Package name, exports, workspace, Vite resolution for `.web`, and Metro resolution for `.native` must be set up so both builds work.

For TypeScript-only (`.ts`) layout, see [typescript-files.md](./typescript-files.md). For overall frontend architecture and layer rules, see `.cursor/rules/frontend/frontend-architecture.mdc`.
