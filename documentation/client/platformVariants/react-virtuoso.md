# react-virtuoso (Web → React Native)

## Web

- **Package:** `react-virtuoso` (in `Client/apps/web/package.json`).
- **Role:** Virtualized lists (and grids) for large scrollable content; uses DOM scrolling and windowing.
- **Where used:** E.g. `ReelsView.web.tsx`, `DesktopReelsView.web.tsx`, and any long list that uses `Virtuoso` for performance.

## React Native

- **Replacement:** **FlatList** and **SectionList** (built into React Native). They are virtualized by default and are the standard for long lists and sectioned lists on RN.
- **Implementation:**
  - **Where:** Any shared list/reels view that uses `react-virtuoso` on web must have a **`.native.tsx`** that uses `FlatList` or `SectionList` with the same data and item renderer. Pass the same `data`, `renderItem`, and key extractor; map “scroll to index” / “at bottom” behavior to FlatList’s `onScrollToIndexRequired`, `onEndReached`, etc. Web keeps using `Virtuoso` in `.web.tsx`.
  - **API:** No Virtuoso on RN. Use `FlatList`’s `data`, `renderItem`, `keyExtractor`, `onEndReached`, `initialScrollIndex`, and ref methods for scroll control. For grouped/sectioned content, use `SectionList`.
- **Package:** Do **not** add `react-virtuoso` to `apps/mobile/package.json`. No extra dependency needed for basic virtualization.

## Package (RN)

- No additional package. Use `FlatList` / `SectionList` from `react-native`.

## Summary

| Aspect | Web | React Native |
|--------|-----|--------------|
| Package | react-virtuoso | (none) — FlatList / SectionList |
| Where | .web.tsx (ReelsView, etc.) | .native.tsx with FlatList/SectionList |
