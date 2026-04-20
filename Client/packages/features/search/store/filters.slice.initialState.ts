import {
  DEFAULT_RESULTS_ORDER_BY,
  legacyDefaultSortDirection,
} from "packages/features/search/types/searchDisplay";

import type { FiltersState } from "./filters.slice.types";

type FiltersStateFields = Omit<
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
>;

export function filtersSliceInitialState(): FiltersStateFields {
  return {
    activeTab: "results",
    currentPage: 0,
    favoriteAddresses: [],
    searchStage: "",
    isSearching: false,
    hasSearched: false,
    searchSource: "preferences",
    showCommuteOverlay: true,
    lastMapRegion: null,
    webMapCamera: null,
    mapHomeCardsCount: 1,
    resultsOrderBy: DEFAULT_RESULTS_ORDER_BY,
    resultsSortDirection: legacyDefaultSortDirection(DEFAULT_RESULTS_ORDER_BY),
    userGeolocation: null,
    preferencesStrictFilter: false,
    showMapListingPreviews: false,
    dismissedMapPreviewIds: [],
  };
}
