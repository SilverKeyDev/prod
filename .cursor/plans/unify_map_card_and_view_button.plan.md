# Unify map card with sidebar card + ViewDetailsButton changes

## Overview

1. **Map card unification**: Have the map popup card reuse the same presentational component as the normal home card, with the bottom triangle as the only map-specific addition.
2. **Map: no unlock button**: Remove the unlock/view-details button from the map implementation entirely.
3. **ViewDetailsButton**: Default button text becomes "View"; move the button component to `packages/features/search/components/core` and name it `ViewDetailsButton`.

---

## Part A: Unify map card with sidebar card (triangle-only addition)

### Current state

- **HomeCard** ([Client/packages/ui/components/cards/HomeCard.tsx](Client/packages/ui/components/cards/HomeCard.tsx)): Renders **HomeCardView** (wrapper + TrianglePointer when `isOnMap` + PropertyCard + optional modal).
- **MapHomeCard** ([Client/packages/features/search/components/cards/MapHomeCard.tsx](Client/packages/features/search/components/cards/MapHomeCard.tsx)): Duplicates that layout with different callbacks (onFocus, onUnlock). Used on the map via MapPropertyCard.

### Approach

- Extract a shared **SearchHomeCardView** in packages/ui that accepts `topContent`, `bottomContent`, `isOnMap`, and optional modal props.
- **HomeCard** uses SearchHomeCardView with `bottomContent` = view-details button (via new ViewDetailsButton).
- **MapHomeCard** uses SearchHomeCardView with **no** `bottomContent` (unlock button removed from map) and `isOnMap={true}` (triangle only addition).

### Steps

1. In [HomeCard.tsx](Client/packages/ui/components/cards/HomeCard.tsx), extract **SearchHomeCardView** (same UI as current HomeCardView), accept `topContent` / `bottomContent` / modal props; HomeCard uses it. Export SearchHomeCardView from [Client/packages/ui/components/cards/index.ts](Client/packages/ui/components/cards/index.ts).
2. In [MapHomeCard.tsx](Client/packages/features/search/components/cards/MapHomeCard.tsx), replace duplicated layout with SearchHomeCardView; pass `isOnMap={true}`, no `bottomContent` (map has no unlock/view button), same `topContent` (heart). Omit modal props.
3. Single **HomeDescription** source: keep and export from packages/ui; MapHomeCard imports it from ui.

---

## Part B: Remove unlock button from map

- Map card will not render any bottom CTA. In the refactored MapHomeCard, **do not pass** `bottomContent` to SearchHomeCardView (or pass `undefined` / omit). No ViewDetailsButton or CardViewDetailsButton on the map.

---

## Part C: ViewDetailsButton in search/components/core, default text "View"

### Current state

- **CardViewDetailsButton** lives in [Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx](Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx).
- Default text uses `t("common.unlock")` ("Unlock"). Used by: HomeCard, MapHomeCard (removed in Part B), SavedHomesContent, ClientSavedHomes, RemainingLikedHomes.

### Approach

- Add **ViewDetailsButton** under `packages/features/search/components/core/`, default text **"View"** (use `t("common.view")` — already in [stringsPart1a.ts](Client/packages/contexts/translations/stringsPart1a.ts)).
- Migrate all non-map usages from CardViewDetailsButton to ViewDetailsButton; map does not show the button.

### Steps

1. **Create** [Client/packages/features/search/components/core/ViewDetailsButton.tsx](Client/packages/features/search/components/core/ViewDetailsButton.tsx).
   - Implement the same behavior as CardViewDetailsButton (async onClick, loading state, sizes, variants, fullWidth, optional icon, etc.) with **default text** `t("common.view")` ("View").
   - Export type `ViewDetailsButtonProps` (same shape as CardViewDetailsButtonProps where applicable).
2. **Create** [Client/packages/features/search/components/core/index.ts](Client/packages/features/search/components/core/index.ts) exporting `ViewDetailsButton` and `ViewDetailsButtonProps`.
3. **Update consumers** to use ViewDetailsButton from search and default or explicit text "View":
   - [HomeCard.tsx](Client/packages/ui/components/cards/HomeCard.tsx): Import ViewDetailsButton from search; use as `bottomContent` with `text="View"` (or rely on default). Use in SearchHomeCardView.
   - [SavedHomesContent.tsx](Client/packages/features/saved/components/SavedHomesContent.tsx): Import ViewDetailsButton from search; use with `text="View"` (or default) where the unlock/view action is appropriate.
   - [ClientSavedHomes.tsx](Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.tsx): Same.
   - [RemainingLikedHomes.tsx](Client/packages/features/compare/components/CompareHomesModal/grid/RemainingLikedHomes.tsx): Same.
4. **Clean up packages/ui**: Remove or deprecate CardViewDetailsButton from [Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx](Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx) and from [buttons/index.ts](Client/packages/ui/components/cards/base/buttons/index.ts) and [base/index.ts](Client/packages/ui/components/cards/base/index.ts) / [base/index.web.ts](Client/packages/ui/components/cards/base/index.web.ts). If any remaining references exist (e.g. other packages), either update them to ViewDetailsButton or keep a thin re-export in ui that delegates to ViewDetailsButton from search (only if needed to avoid circular deps; prefer updating imports to search).

---

## Files to touch (summary)

| File | Change |
|------|--------|
| [Client/packages/ui/components/cards/HomeCard.tsx](Client/packages/ui/components/cards/HomeCard.tsx) | Extract SearchHomeCardView; use ViewDetailsButton from search as bottomContent with "View". |
| [Client/packages/ui/components/cards/index.ts](Client/packages/ui/components/cards/index.ts) | Export SearchHomeCardView. |
| [Client/packages/features/search/components/cards/MapHomeCard.tsx](Client/packages/features/search/components/cards/MapHomeCard.tsx) | Use SearchHomeCardView, isOnMap=true, no bottomContent. |
| [Client/packages/features/search/components/core/ViewDetailsButton.tsx](Client/packages/features/search/components/core/ViewDetailsButton.tsx) | **New.** ViewDetailsButton, default text t("common.view"). |
| [Client/packages/features/search/components/core/index.ts](Client/packages/features/search/components/core/index.ts) | **New.** Export ViewDetailsButton. |
| [Client/packages/features/saved/components/SavedHomesContent.tsx](Client/packages/features/saved/components/SavedHomesContent.tsx) | Use ViewDetailsButton from search, text "View". |
| [Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.tsx](Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.tsx) | Use ViewDetailsButton from search, text "View". |
| [Client/packages/features/compare/components/CompareHomesModal/grid/RemainingLikedHomes.tsx](Client/packages/features/compare/components/CompareHomesModal/grid/RemainingLikedHomes.tsx) | Use ViewDetailsButton from search, text "View". |
| [Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx](Client/packages/ui/components/cards/base/buttons/CardViewDetailsButton.tsx) | Remove or replace with re-export after migration. |
| [Client/packages/ui/components/cards/base/buttons/index.ts](Client/packages/ui/components/cards/base/index.ts) | Remove CardViewDetailsButton export (or re-export ViewDetailsButton). |
| [Client/packages/ui/components/cards/base/index.ts](Client/packages/ui/components/cards/base/index.web.ts) | Stop exporting CardViewDetailsButton (or re-export from search). |

---

## Result

- One canonical presentational card (SearchHomeCardView); map uses it with only the triangle added and **no bottom button**.
- View/details action is a single **ViewDetailsButton** in search/components/core with default label **"View"**.
- Map implementation no longer shows the unlock button; sidebar and other surfaces use ViewDetailsButton with "View".
