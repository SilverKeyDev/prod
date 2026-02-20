/**
 * Reset state creator for withResettable (same shape as base, used when reset is called)
 */

import type { StoreApi } from "zustand";

import { cacheUtils } from "./cacheUtils";
import type { ConsolidatedSearchState } from "./types";
import {
  arraysShallowEqual,
  initialState,
  type ListingStatus,
  type PropertyDetails,
  type PropertyType,
  type SearchResult,
} from "./types";

type SetState = StoreApi<ConsolidatedSearchState>["setState"];
type ResettableSlice = Omit<ConsolidatedSearchState, "reset">;

function resettableSearchSetters(set: SetState): Partial<ResettableSlice> {
  return {
    setSearchResults: (results) =>
      set((state) =>
        arraysShallowEqual(state.searchResults, results)
          ? state
          : { searchResults: results },
      ),
    setSearchLoading: (loading) =>
      set((state) =>
        state.searchLoading === loading ? state : { searchLoading: loading },
      ),
    setSearchError: (error) =>
      set((state) =>
        state.searchError === error ? state : { searchError: error },
      ),
    setHasSearched: (searched) =>
      set((state) =>
        state.hasSearched === searched ? state : { hasSearched: searched },
      ),
    setSearchMetadata: (metadata) =>
      set((state) => ({
        totalCount: metadata.totalCount,
        hasMore: metadata.hasMore,
        lastSearchQuery: metadata.query ?? state.lastSearchQuery,
        lastSearchTimestamp: Date.now(),
      })),
    setSearchStage: (stage) =>
      set((state) =>
        state.searchStage === stage ? state : { searchStage: stage },
      ),
    clearSearchResults: () =>
      set(() => ({
        searchResults: [],
        totalCount: 0,
        hasMore: false,
        lastSearchQuery: null,
        lastSearchTimestamp: null,
        currentPage: 0,
        searchError: null,
        hasSearched: false,
      })),
  };
}

function resettableCacheSetters(set: SetState): Partial<ResettableSlice> {
  return {
    loadSearchResultsFromCache: (preferencesVersion = "1.0") => {
      try {
        const cachedResults =
          cacheUtils.getCachedSearchResults(preferencesVersion);
        if (cachedResults && cachedResults.length > 0) {
          const propertyDetails: PropertyDetails[] = cachedResults.map(
            (result) => ({
              id: result.id,
              address: result.address,
              price: result.price,
              bedrooms: result.bedrooms,
              bathrooms: result.bathrooms,
              sqft: result.sqft,
              lat: result.lat,
              lng: result.lng,
              lotSize: result.lotSize,
              propertyType:
                (result.propertyType as PropertyType) || "SINGLE_FAMILY",
              listingStatus:
                (result.listingStatus as ListingStatus) || "FOR_SALE",
              imageUrl: result.imageUrl,
              _score: result._score,
            }),
          );
          set(() => ({
            searchResults: propertyDetails,
            totalCount: propertyDetails.length,
            hasSearched: true,
            searchError: null,
          }));
          return propertyDetails;
        }
        return null;
      } catch {
        return null;
      }
    },
    saveSearchResultsToCache: (
      results: PropertyDetails[],
      preferencesVersion = "1.0",
    ) => {
      try {
        const searchResults: SearchResult[] = results.map((property) => ({
          id: property.id,
          address: property.address,
          price:
            typeof property.price === "string"
              ? property.price
              : property.price.toString(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.sqft,
          lat: property.lat,
          lng: property.lng,
          lotSize: property.lotSize,
          propertyType: property.propertyType as string,
          listingStatus: property.listingStatus as string,
          imageUrl: property.imageUrl,
          _score: property._score,
        }));
        cacheUtils.cacheSearchResults(searchResults, preferencesVersion);
      } catch {
        // ignore
      }
    },
    clearSearchCache: () => {
      try {
        cacheUtils.clearSearchCache();
      } catch {
        // ignore
      }
    },
  };
}

function resettableUISetters(set: SetState): Partial<ResettableSlice> {
  return {
    setActiveTab: (tab) => set({ activeTab: tab }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setShowPropertyModals: (show) => set({ showPropertyModals: show }),
    setIsCarouselCollapsed: (collapsed) =>
      set({ isCarouselCollapsed: collapsed }),
    setIsSearching: (searching) => set({ isSearching: searching }),
    setFavoriteAddresses: (addresses) =>
      set({ favoriteAddresses: [...addresses] }),
    addFavoriteAddress: (address) =>
      set((state) => ({
        favoriteAddresses: state.favoriteAddresses.includes(address)
          ? state.favoriteAddresses
          : [...state.favoriteAddresses, address],
      })),
    removeFavoriteAddress: (address) =>
      set((state) => ({
        favoriteAddresses: state.favoriteAddresses.filter(
          (addr) => addr !== address,
        ),
      })),
    isHomeSaved: () => false,
  };
}

function resettableToastAndStubSetters(
  set: SetState,
): Partial<ResettableSlice> {
  return {
    enqueueToast: (toast) =>
      set((state) => {
        const id =
          toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const nextQueue = [
          ...state.toastQueue,
          { id, message: toast.message, type: toast.type },
        ];
        return {
          toastQueue: nextQueue,
          activeToastId: state.activeToastId ?? id,
        };
      }),
    dequeueToast: (id) =>
      set((state) => {
        const targetId = id ?? state.activeToastId ?? state.toastQueue[0]?.id;
        const nextQueue = state.toastQueue.filter((t) => t.id !== targetId);
        const nextActive = nextQueue[0]?.id ?? null;
        return { toastQueue: nextQueue, activeToastId: nextActive };
      }),
    clearToasts: () => set({ toastQueue: [], activeToastId: null }),
    getCurrentPageResults: () => [],
    getTotalPages: () => 0,
    performSearch: async () => ({ success: false, error: "Not implemented" }),
    loadMoreResults: async () => ({ success: false, error: "Not implemented" }),
  };
}

export const createResettableState: (set: SetState) => ResettableSlice = (
  set,
) => ({
  ...initialState(),
  ...resettableSearchSetters(set),
  ...resettableCacheSetters(set),
  ...resettableUISetters(set),
  ...resettableToastAndStubSetters(set),
});
