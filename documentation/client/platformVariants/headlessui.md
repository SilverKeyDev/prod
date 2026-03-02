# @headlessui/react (Web → React Native)

## Web

- **Package:** `@headlessui/react` (in `Client/apps/web/package.json`).
- **Role:** Unstyled, accessible UI primitives (Dialog, Listbox, Menu, Popover, Transition, etc.) built on DOM.
- **Where used:** Components under `apps/web/` and `packages/` that need dropdowns, modals, popovers, or disclosure UIs — e.g. `SearchFiltersSheet.web.tsx`, `ConfirmationDialog.web.tsx`, `OtherFilterDropdown.web.tsx`, `SearchFiltersPanel.web.tsx`, and other `.web.tsx` files that use Headless UI.

## React Native

- **No direct port.** Headless UI is DOM-based; there is no official React Native version.
- **Implementation:**
  - **Strategy:** Use React Native primitives and/or a native UI library. For modals use RN `Modal`; for dropdowns/popovers use a bottom sheet, a native-style picker, or a custom overlay built with `View`/`Pressable`.
  - **Where:** Any shared component that uses `@headlessui/react` on web must have a **`.native.tsx`** in the same feature/component folder (or under `apps/mobile/`) that implements the same UX with RN components. Web-only usage stays in `.web.tsx` and is not imported by the mobile app.
  - **Optional packages (RN):** Consider `@gorhom/bottom-sheet` for sheet-style filters, or build dropdowns with `Modal` + `Pressable` + `View`. Add any such dependency to `Client/apps/mobile/package.json`.

## Package (RN)

- Do **not** add `@headlessui/react` to `apps/mobile/package.json`. Add only RN-compatible UI packages (e.g. bottom sheet, native picker) as needed for the native implementations.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | @headlessui/react | None; RN Modal, View, Pressable, optional bottom-sheet lib |
| Where | .web.tsx in apps/web and packages | .native.tsx in same module or apps/mobile |
