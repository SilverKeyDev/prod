# embla-carousel-react (Web → React Native)

## Web

- **Package:** `embla-carousel-react` (in `Client/apps/web/package.json`).
- **Role:** Carousel/slider built on DOM; used for image carousels, cards carousels, and horizontal scrolling sections.
- **Where used:** Components under `apps/web/` and `packages/` that render carousels (e.g. property galleries, media carousels, card strips).

## React Native

- **Replacement options:**
  1. **react-native-reanimated-carousel** — Reanimated-based carousel; good for smooth, gesture-driven behavior.
  2. **FlatList** with `horizontal={true}` and paging — Built-in; no extra dependency; suitable for simple horizontal lists with snap.
  3. **react-native-pager-view** — Native pager; useful for full-screen or heavy carousels.
- **Implementation:**
  - **Where:** Any shared component that uses `embla-carousel-react` on web must have a **`.native.tsx`** that uses one of the above. Web implementation stays in `.web.tsx` or in shared `.tsx` that is only used by web (with Embla in a `.web`-only subtree). Prefer a single carousel abstraction (e.g. `MediaCarousel`) with `MediaCarousel.web.tsx` (Embla) and `MediaCarousel.native.tsx` (FlatList or reanimated-carousel).
  - **API:** No 1:1 Embla API on RN. Map “slide count,” “current index,” “on change” to the chosen RN component’s props and callbacks.
- **Package:** Add `react-native-reanimated-carousel` and/or use `FlatList` only. Do not add `embla-carousel-react` to `apps/mobile/package.json`.

## Package (RN)

- **Add to `apps/mobile/package.json` (optional):** `react-native-reanimated-carousel` if you want parity with Embla’s UX. Otherwise implement with `FlatList` (no new dependency).

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | embla-carousel-react | react-native-reanimated-carousel or FlatList |
| Where | .web.tsx or shared with .native | .native.tsx |
