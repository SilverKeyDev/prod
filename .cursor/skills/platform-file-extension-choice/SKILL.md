---
name: platform-file-extension-choice
description: Choose the correct platform file extension (.tsx vs .web.tsx) when creating or renaming files under apps/web. Use when adding new files under apps/web, deciding whether to use .web, or when the user asks about platform extensions.
---

# Platform File Extension Choice (Web vs .web)

When creating or renaming files under `apps/web/`, choose the right extension so that only truly web-only (unmapped) files use `.web`.

## Default: use `.tsx` or `.ts`

- **Default:** Use **`.tsx`** or **`.ts`** (no `.web` suffix) for all new files under `apps/web/`.
- Use **`.web.tsx`** or **`.web.ts`** only when **all** of the following are true:
  - The file **will not** be mapped to mobile (desktop-only layout, DOM-only, or explicitly excluded from mobile), and
  - The file is not the single/default implementation of a shared API (e.g. icon map, generic form components that could have a native variant).

## Quick check

**"Could mobile use this same file or the same API with a `.native` variant?"**  
If yes → do **not** use `.web`.

## When to use `.web`

Use `.web` only when **either** condition holds:

1. **Web-only package or API** – The file imports or uses something not available on React Native (e.g. `react-dom`, `react-router-dom`, `window`/`document`, `HTMLInputElement`, `htmlFor`, `@headlessui/react`, `react-virtuoso`).
2. **Desktop / large-screen only** – The file is layout or UI for desktop/large viewport and mobile has or will have a different implementation (e.g. sidebar, desktop search header, desktop reels).

Canonical list and reasons: `Client/MOBILE_MIGRATION_DESKTOP_FILES.md`.

## When to use `.tsx` / `.ts` (no suffix)

Use plain `.tsx` / `.ts` for:
- Shared code or the default web implementation that mobile could use as-is or override later with `Component.native.tsx`.
- Files that use only React + shared packages (no DOM-specific APIs).
- Single implementation of a shared API (e.g. `iconMap.tsx` for `getIcon(name)`; mobile can add `iconMap.native.tsx` later if needed).

## Enforcement

- **ESLint:** `silverkey/platform-allowed-imports` – `.web.*` files must not import React Native-only packages (e.g. `react-native`, `@react-navigation/native`); `.native.*` files must not import web-only packages (e.g. `react-dom`, `react-router-dom`, `@headlessui/react`, `react-virtuoso`). Shared packages (`packages/*`, `logger`) are allowed on both.

## References

- **Cursor rule:** `.cursor/rules/frontend/platform-file-extensions.mdc`
- **Architecture:** `Client/ARCHITECTURE.md` (Platform file conventions)
- **Desktop-only list:** `Client/MOBILE_MIGRATION_DESKTOP_FILES.md`
