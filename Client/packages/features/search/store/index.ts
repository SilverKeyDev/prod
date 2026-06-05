/**
 * Consolidated search store - middleware composition and public API
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { createPersistStorageProxy } from "packages/utils/core/storage/platformStorage";

import { createResettableState } from "./resettableState";
import { baseCreator } from "./sliceBase";
import type { ActiveTab, ConsolidatedSearchState, ToastItem } from "./types";
import { initialState } from "./types";

const withReset = withResettable<ConsolidatedSearchState>(
  baseCreator,
  createResettableState
) as unknown as import("zustand").StateCreator<ConsolidatedSearchState>;

const withPersist = persistSafe<ConsolidatedSearchState>(withReset, {
  name: "consolidated-search-store",
  version: 1,
  storage: createPersistStorageProxy(),
  partialize: (state: ConsolidatedSearchState) => ({
    searchResults: state.searchResults,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
    lastSearchQuery: state.lastSearchQuery,
    lastSearchTimestamp: state.lastSearchTimestamp,
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    isCarouselCollapsed: state.isCarouselCollapsed,
    toastQueue: state.toastQueue,
  }),
  migrate: (persisted: unknown) => {
    const base = { ...initialState() } as ConsolidatedSearchState;
    if (!persisted) return base;
    const pd = persisted as Record<string, unknown>;
    return {
      ...base,
      searchResults: (pd.searchResults as ConsolidatedSearchState["searchResults"]) ?? [],
      totalCount: (pd.totalCount as number) ?? 0,
      hasMore: (pd.hasMore as boolean) ?? false,
      lastSearchQuery: (pd.lastSearchQuery as string) ?? null,
      lastSearchTimestamp: (pd.lastSearchTimestamp as number) ?? null,
      activeTab: (pd.activeTab as ActiveTab) ?? "saved",
      currentPage: (pd.currentPage as number) ?? 0,
      showPropertyModals: (pd.showPropertyModals as boolean) ?? true,
      favoriteAddresses: (pd.favoriteAddresses as string[]) ?? [],
      isCarouselCollapsed: (pd.isCarouselCollapsed as boolean) ?? false,
      toastQueue: (pd.toastQueue as ToastItem[]) ?? [],
    };
  },
}) as unknown as import("zustand").StateCreator<ConsolidatedSearchState>;

const withDev = withDevtools<ConsolidatedSearchState>("consolidated-search")(
  withPersist
) as unknown as import("zustand").StateCreator<ConsolidatedSearchState>;

export const useConsolidatedSearchStore = create<ConsolidatedSearchState>()(
  subscribeWithSelector(withDev)
);

export function toConsolidatedQueryParams(
  state: Pick<
    ConsolidatedSearchState,
    "searchStage" | "favoriteAddresses" | "currentPage" | "activeTab"
  >
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length ? state.favoriteAddresses : undefined,
    page: state.currentPage,
    tab: state.activeTab,
  } as const;
}

export const selectSearchData = (state: ConsolidatedSearchState) => ({
  results: state.searchResults,
  loading: state.searchLoading,
  error: state.searchError,
  hasSearched: state.hasSearched,
  totalCount: state.totalCount,
  hasMore: state.hasMore,
});

export const selectUIState = (state: ConsolidatedSearchState) => ({
  activeTab: state.activeTab,
  currentPage: state.currentPage,
  showPropertyModals: state.showPropertyModals,
  isCarouselCollapsed: state.isCarouselCollapsed,
  isSearching: state.isSearching,
});

export const selectFavorites = (state: ConsolidatedSearchState) => ({
  addresses: state.favoriteAddresses,
  isHomeSaved: state.isHomeSaved,
});

export const selectToasts = (state: ConsolidatedSearchState) => ({
  queue: state.toastQueue,
  activeId: state.activeToastId,
  currentToast: state.toastQueue.find((t) => t.id === state.activeToastId),
});

export type { ActiveTab, ConsolidatedSearchState, ToastItem, ToastType } from "./types";

// Map/display filters — extended fields not on ConsolidatedSearchState (sort, camera, overlays, etc.)
export {
  type MapRegionSnapshot,
  type SearchSource,
  toQueryParams,
  useFiltersStore,
  type WebMapCameraSnapshot,
} from "./filters.slice";
// Ephemeral search context: anchor, location bar, filter overrides, feed cursor
export {
  type SearchContextAnchor,
  type SearchFilterOverrides,
  useSearchContextStore,
} from "./searchContext.slice";
// Results vs map view mode (list/map toggle)
export { type GoogleMapsState, useGoogleMapsStore } from "./googleMaps.slice";
export {
  SEARCH_VIEW_MODE_CHANGED_EVENT,
  type SearchViewMode,
  type SearchViewState,
  useSearchViewStore,
} from "./searchView.slice";
