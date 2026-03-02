# react-responsive-carousel (Web → React Native)

## Web

- **Package:** `react-responsive-carousel` (in `Client/apps/web/package.json`).
- **Role:** Carousel/slider for images or content; DOM-based with responsive breakpoints.
- **Where used:** Components under `apps/web/` and `packages/` that need a simple image/content carousel (e.g. property images, media galleries).

## React Native

- **Replacement:** Same strategy as [embla-carousel-react](./embla-carousel-react.md): use **react-native-reanimated-carousel** or **FlatList** with `horizontal={true}` and paging. No `react-responsive-carousel` on RN — it is DOM-based.
- **Implementation:**
  - **Where:** Any shared component that uses `react-responsive-carousel` on web must have a **`.native.tsx`** that uses the same RN carousel approach as Embla (FlatList or reanimated-carousel). Prefer one carousel abstraction (e.g. `ImageCarousel`) with `.web.tsx` (react-responsive-carousel or Embla) and `.native.tsx` (RN carousel). If both Embla and react-responsive-carousel are used on web for different UIs, both can map to the same RN carousel component with different props/layout as needed.
  - **Package:** Do not add `react-responsive-carousel` to `apps/mobile/package.json`. Add only the chosen RN carousel dependency (see embla doc).

## Package (RN)

- Reuse the same RN carousel package as for Embla: **react-native-reanimated-carousel** or **FlatList** only. No `react-responsive-carousel`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | react-responsive-carousel | Same as embla variant: reanimated-carousel or FlatList |
| Where | .web.tsx | .native.tsx |
