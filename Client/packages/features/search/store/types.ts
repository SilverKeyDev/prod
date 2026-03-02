/**
 * Search store types and initial state
 */

import type {
  ListingStatus,
  PropertyDetails,
  PropertyType,
  SearchResult,
} from "@/features/search/types/result";

export type ActiveTab = "results" | "saved";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

export type ConsolidatedSearchState = {
  searchResults: PropertyDetails[];
  searchLoading: boolean;
  searchError: string | null;
  hasSearched: boolean;
  totalCount: number;
  hasMore: boolean;
  lastSearchQuery: string | null;
  lastSearchTimestamp: number | null;
  searchStage: string;
  activeTab: ActiveTab;
  currentPage: number;
  showPropertyModals: boolean;
  isCarouselCollapsed: boolean;
  isSearching: boolean;
  favoriteAddresses: string[];
  activeToastId: string | null;
  toastQueue: ToastItem[];
  setSearchResults: (results: PropertyDetails[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  setHasSearched: (searched: boolean) => void;
  setSearchMetadata: (metadata: { totalCount: number; hasMore: boolean; query?: string }) => void;
  setSearchStage: (stage: string) => void;
  clearSearchResults: () => void;
  loadSearchResultsFromCache: (preferencesVersion?: string) => PropertyDetails[] | null;
  saveSearchResultsToCache: (results: PropertyDetails[], preferencesVersion?: string) => void;
  clearSearchCache: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  setIsCarouselCollapsed: (collapsed: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  addFavoriteAddress: (address: string) => void;
  removeFavoriteAddress: (address: string) => void;
  isHomeSaved: (propertyId: string) => boolean;
  enqueueToast: (toast: Omit<ToastItem, "id"> & { id?: string }) => void;
  dequeueToast: (id?: string) => void;
  clearToasts: () => void;
  getCurrentPageResults: () => PropertyDetails[];
  getTotalPages: () => number;
  performSearch: (query: string) => Promise<{ success: boolean; error?: string }>;
  loadMoreResults: () => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
};

export type SearchStateCreator = import("zustand").StateCreator<ConsolidatedSearchState>;

export type OmitActions<T> = Omit<
  T,
  | "setSearchResults"
  | "setSearchLoading"
  | "setSearchError"
  | "setHasSearched"
  | "setSearchMetadata"
  | "setSearchStage"
  | "clearSearchResults"
  | "loadSearchResultsFromCache"
  | "saveSearchResultsToCache"
  | "clearSearchCache"
  | "setActiveTab"
  | "setCurrentPage"
  | "setShowPropertyModals"
  | "setIsCarouselCollapsed"
  | "setIsSearching"
  | "setFavoriteAddresses"
  | "addFavoriteAddress"
  | "removeFavoriteAddress"
  | "isHomeSaved"
  | "enqueueToast"
  | "dequeueToast"
  | "clearToasts"
  | "getCurrentPageResults"
  | "getTotalPages"
  | "performSearch"
  | "loadMoreResults"
  | "reset"
>;

export const initialState = (): OmitActions<ConsolidatedSearchState> => ({
  searchResults: [],
  searchLoading: false,
  searchError: null,
  hasSearched: false,
  totalCount: 0,
  hasMore: false,
  lastSearchQuery: null,
  lastSearchTimestamp: null,
  searchStage: "",
  activeTab: "saved",
  currentPage: 0,
  showPropertyModals: true,
  isCarouselCollapsed: false,
  isSearching: false,
  favoriteAddresses: [],
  activeToastId: null,
  toastQueue: [],
});

export const arraysShallowEqual = <T>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

export type { ListingStatus, PropertyDetails, PropertyType, SearchResult };
