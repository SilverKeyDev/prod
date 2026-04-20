import {
  clampMapHomeCardsCount,
  DEFAULT_RESULTS_ORDER_BY,
  isResultsOrderBy,
} from "packages/features/search/types/searchDisplay";

import type { FiltersState } from "./filters.slice.types";

type FiltersSet = (
  partial: Partial<FiltersState> | ((state: FiltersState) => Partial<FiltersState>)
) => void;

export function buildFiltersSliceActions(
  set: FiltersSet,
  get: () => FiltersState,
  isHomeSavedImpl: (propertyId: string) => boolean
): Pick<
  FiltersState,
  | "setActiveTab"
  | "setCurrentPage"
  | "setFavoriteAddresses"
  | "setSearchStage"
  | "setIsSearching"
  | "setHasSearched"
  | "setSearchSource"
  | "setShowCommuteOverlay"
  | "setLastMapRegion"
  | "setWebMapCamera"
  | "setMapHomeCardsCount"
  | "setResultsOrderBy"
  | "setResultsSortDirection"
  | "setUserGeolocation"
  | "setPreferencesStrictFilter"
  | "applySearchDisplayFromApi"
  | "setShowMapListingPreviews"
  | "dismissMapListingPreview"
  | "restoreMapListingPreview"
  | "clearDismissedMapPreviews"
  | "isHomeSaved"
  | "reset"
> {
  return {
    setActiveTab: (tab) => set({ activeTab: tab }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setFavoriteAddresses: (addresses) => set({ favoriteAddresses: [...addresses] }),
    setSearchStage: (stage) => set({ searchStage: stage }),
    setIsSearching: (searching) => set({ isSearching: searching }),
    setHasSearched: (searched) => set({ hasSearched: searched }),
    setSearchSource: (source) => set({ searchSource: source }),
    setShowCommuteOverlay: (show) => set({ showCommuteOverlay: show }),
    setLastMapRegion: (region) => set({ lastMapRegion: region }),
    setWebMapCamera: (camera) => set({ webMapCamera: camera }),
    setMapHomeCardsCount: (count) => set({ mapHomeCardsCount: clampMapHomeCardsCount(count) }),
    setResultsOrderBy: (order) => set({ resultsOrderBy: order }),
    setResultsSortDirection: (direction) => set({ resultsSortDirection: direction }),
    setUserGeolocation: (coords) => set({ userGeolocation: coords }),
    setPreferencesStrictFilter: (strict) => set({ preferencesStrictFilter: strict }),
    applySearchDisplayFromApi: (payload) =>
      set((state) => {
        const ctx = payload.last_search_context;
        const updates: Partial<FiltersState> = {
          showCommuteOverlay: Boolean(payload.show_commute_overlay),
          mapHomeCardsCount: clampMapHomeCardsCount(payload.map_home_cards_count),
          resultsOrderBy: isResultsOrderBy(payload.results_order_by)
            ? payload.results_order_by
            : DEFAULT_RESULTS_ORDER_BY,
          preferencesStrictFilter:
            typeof payload.preferences_strict_filter === "boolean"
              ? payload.preferences_strict_filter
              : state.preferencesStrictFilter,
        };
        if (ctx) {
          if (ctx.search_source === "preferences" || ctx.search_source === "location") {
            updates.searchSource = ctx.search_source;
          }
          if (ctx.map_center && ctx.map_zoom) {
            updates.webMapCamera = {
              lat: ctx.map_center.lat,
              lng: ctx.map_center.lng,
              zoom: ctx.map_zoom,
            };
          }
        }
        return updates;
      }),
    setShowMapListingPreviews: (show) => set({ showMapListingPreviews: show }),
    dismissMapListingPreview: (propertyId) =>
      set((state) =>
        state.dismissedMapPreviewIds.includes(propertyId)
          ? state
          : {
              dismissedMapPreviewIds: [...state.dismissedMapPreviewIds, propertyId],
            }
      ),
    restoreMapListingPreview: (propertyId) =>
      set((state) =>
        state.dismissedMapPreviewIds.includes(propertyId)
          ? {
              dismissedMapPreviewIds: state.dismissedMapPreviewIds.filter(
                (id) => id !== propertyId
              ),
            }
          : state
      ),
    clearDismissedMapPreviews: () => set({ dismissedMapPreviewIds: [] }),
    isHomeSaved: isHomeSavedImpl,
    reset: () => {},
  };
}

export function buildLiveIsHomeSaved(get: () => FiltersState) {
  return (propertyId: string) => {
    const state = get();
    return state.favoriteAddresses.includes(propertyId);
  };
}
