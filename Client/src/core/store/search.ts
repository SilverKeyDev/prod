import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type { PropertyDetails } from '../types/search';
import type { SearchResult } from '../schemas/search';

import { withDevtools } from './middleware/devtools';
import { persistSafe } from './middleware/persistSafe';
import { withResettable } from './middleware/resettable';
import { cacheUtils } from '../../features/search/hooks/unifiedCache';

export type ActiveTab = 'results' | 'saved';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

export type ConsolidatedSearchState = {
  // Search Data
  searchResults: PropertyDetails[];
  searchLoading: boolean;
  searchError: string | null;
  hasSearched: boolean;
  
  // Search Metadata
  totalCount: number;
  hasMore: boolean;
  lastSearchQuery: string | null;
  lastSearchTimestamp: number | null;
  searchStage: string;
  
  // UI State
  activeTab: ActiveTab;
  currentPage: number;
  showPropertyModals: boolean;
  isCarouselCollapsed: boolean;
  isSearching: boolean;
  
  // Favorites
  favoriteAddresses: string[];
  
  // Toast System
  activeToastId: string | null;
  toastQueue: ToastItem[];
  
  // Actions - Search Data
  setSearchResults: (results: PropertyDetails[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  setHasSearched: (searched: boolean) => void;
  setSearchMetadata: (metadata: {
    totalCount: number;
    hasMore: boolean;
    query?: string;
  }) => void;
  setSearchStage: (stage: string) => void;
  clearSearchResults: () => void;
  
  // Cache Integration Actions
  loadSearchResultsFromCache: (preferencesVersion?: string) => PropertyDetails[] | null;
  saveSearchResultsToCache: (results: PropertyDetails[], preferencesVersion?: string) => void;
  clearSearchCache: () => void;
  
  // Actions - UI State
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  setIsCarouselCollapsed: (collapsed: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  
  // Actions - Favorites
  setFavoriteAddresses: (addresses: string[]) => void;
  addFavoriteAddress: (address: string) => void;
  removeFavoriteAddress: (address: string) => void;
  isHomeSaved: (propertyId: string) => boolean;
  
  // Actions - Toast System
  enqueueToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => void;
  dequeueToast: (id?: string) => void;
  clearToasts: () => void;
  
  // Computed Properties
  getCurrentPageResults: () => PropertyDetails[];
  getTotalPages: () => number;
  
  // Async Actions (implemented by hooks)
  performSearch: (query: string) => Promise<{ success: boolean; error?: string }>;
  loadMoreResults: () => Promise<{ success: boolean; error?: string }>;
  
  reset: () => void;
};

const initialState = (): Omit<
  ConsolidatedSearchState,
  | 'setSearchResults'
  | 'setSearchLoading'
  | 'setSearchError'
  | 'setHasSearched'
  | 'setSearchMetadata'
  | 'setSearchStage'
  | 'clearSearchResults'
  | 'loadSearchResultsFromCache'
  | 'saveSearchResultsToCache'
  | 'clearSearchCache'
  | 'setActiveTab'
  | 'setCurrentPage'
  | 'setShowPropertyModals'
  | 'setIsCarouselCollapsed'
  | 'setIsSearching'
  | 'setFavoriteAddresses'
  | 'addFavoriteAddress'
  | 'removeFavoriteAddress'
  | 'isHomeSaved'
  | 'enqueueToast'
  | 'dequeueToast'
  | 'clearToasts'
  | 'getCurrentPageResults'
  | 'getTotalPages'
  | 'performSearch'
  | 'loadMoreResults'
  | 'reset'
> => ({
  // Search Data
  searchResults: [],
  searchLoading: false,
  searchError: null,
  hasSearched: false,
  
  // Search Metadata
  totalCount: 0,
  hasMore: false,
  lastSearchQuery: null,
  lastSearchTimestamp: null,
  searchStage: '',
  
  // UI State
  activeTab: 'saved',
  currentPage: 0,
  showPropertyModals: true,
  isCarouselCollapsed: false,
  isSearching: false,
  
  // Favorites
  favoriteAddresses: [],
  
  // Toast System
  activeToastId: null,
  toastQueue: [],
});

const arraysShallowEqual = <T,>(a: T[], b: T[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
};

const baseCreator: import('zustand').StateCreator<ConsolidatedSearchState> = (set, get) => ({
  ...initialState(),

  // Search Data Actions
  setSearchResults: (results) =>
    set((state) => (arraysShallowEqual(state.searchResults, results) ? state : { searchResults: results })),
  setSearchLoading: (loading) =>
    set((state) => (state.searchLoading === loading ? state : { searchLoading: loading })),
  setSearchError: (error) =>
    set((state) => (state.searchError === error ? state : { searchError: error })),
  setHasSearched: (searched) =>
    set((state) => (state.hasSearched === searched ? state : { hasSearched: searched })),
  setSearchMetadata: (metadata) =>
    set((state) => ({
      totalCount: metadata.totalCount,
      hasMore: metadata.hasMore,
      lastSearchQuery: metadata.query ?? state.lastSearchQuery,
      lastSearchTimestamp: Date.now(),
    })),
  setSearchStage: (stage) =>
    set((state) => (state.searchStage === stage ? state : { searchStage: stage })),
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

  // Cache Integration Actions
  loadSearchResultsFromCache: (preferencesVersion = '1.0') => {
    try {
      console.log('📦 [STORE] Loading search results from cache:', preferencesVersion);
      const cachedResults = cacheUtils.getCachedSearchResults(preferencesVersion);
      
      if (cachedResults && cachedResults.length > 0) {
        console.log('✅ [STORE] Found cached search results:', {
          count: cachedResults.length,
          version: preferencesVersion,
        });
        
        // Update store state with cached results
        set((state) => ({
          searchResults: cachedResults,
          totalCount: cachedResults.length,
          hasSearched: true,
          searchError: null,
        }));
        
        return cachedResults;
      }
      
      console.log('❌ [STORE] No cached search results found');
      return null;
    } catch (error) {
      console.error('❌ [STORE] Error loading search results from cache:', error);
      return null;
    }
  },

  saveSearchResultsToCache: (results: PropertyDetails[], preferencesVersion = '1.0') => {
    try {
      console.log('📦 [STORE] Saving search results to cache:', {
        count: results.length,
        version: preferencesVersion,
      });
      
      // Convert PropertyDetails to SearchResult for caching
      const searchResults: SearchResult[] = results.map(property => ({
        id: property.id,
        address: property.address,
        price: typeof property.price === 'string' ? property.price : property.price.toString(),
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        sqft: property.sqft,
        lat: property.lat,
        lng: property.lng,
        lotSize: property.lotSize,
        propertyType: property.propertyType,
        listingStatus: property.listingStatus,
        imageUrl: property.imageUrl,
        _score: property._score,
      }));
      
      // Cache the results using unified cache only
      cacheUtils.cacheSearchResults(searchResults, preferencesVersion);
      
      console.log('✅ [STORE] Search results saved to unified cache');
    } catch (error) {
      console.error('❌ [STORE] Error saving search results to cache:', error);
    }
  },

  clearSearchCache: () => {
    try {
      console.log('🧹 [STORE] Clearing search cache');
      cacheUtils.clearSearchCache();
      console.log('✅ [STORE] Search cache cleared');
    } catch (error) {
      console.error('❌ [STORE] Error clearing search cache:', error);
    }
  },

  // UI State Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setShowPropertyModals: (show) => set({ showPropertyModals: show }),
  setIsCarouselCollapsed: (collapsed) => set({ isCarouselCollapsed: collapsed }),
  setIsSearching: (searching) => set({ isSearching: searching }),

  // Favorites Actions
  setFavoriteAddresses: (addresses) => set({ favoriteAddresses: [...addresses] }),
  addFavoriteAddress: (address) =>
    set((state) => ({
      favoriteAddresses: state.favoriteAddresses.includes(address)
        ? state.favoriteAddresses
        : [...state.favoriteAddresses, address],
    })),
  removeFavoriteAddress: (address) =>
    set((state) => ({
      favoriteAddresses: state.favoriteAddresses.filter((addr) => addr !== address),
    })),
  isHomeSaved: (propertyId: string) => {
    const state = get();
    return state.favoriteAddresses.includes(propertyId);
  },

  // Toast System Actions
  enqueueToast: (toast) =>
    set((state) => {
      const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextQueue = [...state.toastQueue, { id, message: toast.message, type: toast.type }];
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
      return {
        toastQueue: nextQueue,
        activeToastId: nextActive,
      };
    }),
  clearToasts: () => set({ toastQueue: [], activeToastId: null }),

  // Computed Properties
  getCurrentPageResults: () => {
    const state = get();
    const startIndex = state.currentPage * 10; // Assuming 10 results per page
    return state.searchResults.slice(startIndex, startIndex + 10);
  },
  getTotalPages: () => {
    const state = get();
    return Math.ceil(state.totalCount / 10);
  },

  // Async Actions (implemented by hooks)
  performSearch: () => {
    console.warn('performSearch should be implemented by useSearchData hook');
    return Promise.resolve({ success: false, error: 'Not implemented' });
  },
  loadMoreResults: () => {
    console.warn('loadMoreResults should be implemented by useSearchData hook');
    return Promise.resolve({ success: false, error: 'Not implemented' });
  },

  // placeholder; will be replaced by withResettable
  reset: () => {},
});

const withReset = withResettable<ConsolidatedSearchState>(
  baseCreator,
  (set) => ({
    ...initialState(),
    setSearchResults: (results) => set((state) => (arraysShallowEqual(state.searchResults, results) ? state : { searchResults: results })),
    setSearchLoading: (loading) => set((state) => (state.searchLoading === loading ? state : { searchLoading: loading })),
    setSearchError: (error) => set((state) => (state.searchError === error ? state : { searchError: error })),
    setHasSearched: (searched) => set((state) => (state.hasSearched === searched ? state : { hasSearched: searched })),
    setSearchMetadata: (metadata) => set((state) => ({
      totalCount: metadata.totalCount,
      hasMore: metadata.hasMore,
      lastSearchQuery: metadata.query ?? state.lastSearchQuery,
      lastSearchTimestamp: Date.now(),
    })),
    setSearchStage: (stage) => set((state) => (state.searchStage === stage ? state : { searchStage: stage })),
    clearSearchResults: () => set(() => ({
      searchResults: [],
      totalCount: 0,
      hasMore: false,
      lastSearchQuery: null,
      lastSearchTimestamp: null,
      currentPage: 0,
      searchError: null,
      hasSearched: false,
    })),
    loadSearchResultsFromCache: (preferencesVersion = '1.0') => {
      try {
        const cachedResults = cacheUtils.getCachedSearchResults(preferencesVersion);
        if (cachedResults && cachedResults.length > 0) {
          set((state) => ({
            searchResults: cachedResults,
            totalCount: cachedResults.length,
            hasSearched: true,
            searchError: null,
          }));
          return cachedResults;
        }
        return null;
      } catch (error) {
        console.error('Error loading search results from cache:', error);
        return null;
      }
    },
    saveSearchResultsToCache: (results: PropertyDetails[], preferencesVersion = '1.0') => {
      try {
        const searchResults: SearchResult[] = results.map(property => ({
          id: property.id,
          address: property.address,
          price: typeof property.price === 'string' ? property.price : property.price.toString(),
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sqft: property.sqft,
          lat: property.lat,
          lng: property.lng,
          lotSize: property.lotSize,
          propertyType: property.propertyType,
          listingStatus: property.listingStatus,
          imageUrl: property.imageUrl,
          _score: property._score,
        }));
        cacheUtils.cacheSearchResults(searchResults, preferencesVersion);
      } catch (error) {
        console.error('Error saving search results to cache:', error);
      }
    },
    clearSearchCache: () => {
      try {
        cacheUtils.clearSearchCache();
      } catch (error) {
        console.error('Error clearing search cache:', error);
      }
    },
    setActiveTab: (tab) => set({ activeTab: tab }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setShowPropertyModals: (show) => set({ showPropertyModals: show }),
    setIsCarouselCollapsed: (collapsed) => set({ isCarouselCollapsed: collapsed }),
    setIsSearching: (searching) => set({ isSearching: searching }),
    setFavoriteAddresses: (addresses) => set({ favoriteAddresses: [...addresses] }),
    addFavoriteAddress: (address) => set((state) => ({
      favoriteAddresses: state.favoriteAddresses.includes(address)
        ? state.favoriteAddresses
        : [...state.favoriteAddresses, address],
    })),
    removeFavoriteAddress: (address) => set((state) => ({
      favoriteAddresses: state.favoriteAddresses.filter((addr) => addr !== address),
    })),
    isHomeSaved: () => false,
    enqueueToast: (toast) => set((state) => {
      const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextQueue = [...state.toastQueue, { id, message: toast.message, type: toast.type }];
      return { toastQueue: nextQueue, activeToastId: state.activeToastId ?? id };
    }),
    dequeueToast: (id) => set((state) => {
      const targetId = id ?? state.activeToastId ?? state.toastQueue[0]?.id;
      const nextQueue = state.toastQueue.filter((t) => t.id !== targetId);
      const nextActive = nextQueue[0]?.id ?? null;
      return { toastQueue: nextQueue, activeToastId: nextActive };
    }),
    clearToasts: () => set({ toastQueue: [], activeToastId: null }),
    getCurrentPageResults: () => [],
    getTotalPages: () => 0,
    performSearch: async () => ({ success: false, error: 'Not implemented' }),
    loadMoreResults: async () => ({ success: false, error: 'Not implemented' }),
    reset: () => {},
  })
) as unknown as import('zustand').StateCreator<ConsolidatedSearchState>;

const withPersist = persistSafe<ConsolidatedSearchState>(withReset, {
  name: 'consolidated-search-store',
  version: 1,
  storage: localStorage,
  partialize: (state: ConsolidatedSearchState) => ({
    // Persist search results and user preferences
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
      searchResults: (pd.searchResults as PropertyDetails[]) ?? [],
      totalCount: (pd.totalCount as number) ?? 0,
      hasMore: (pd.hasMore as boolean) ?? false,
      lastSearchQuery: (pd.lastSearchQuery as string) ?? null,
      lastSearchTimestamp: (pd.lastSearchTimestamp as number) ?? null,
      activeTab: (pd.activeTab as ActiveTab) ?? 'saved',
      currentPage: (pd.currentPage as number) ?? 0,
      showPropertyModals: (pd.showPropertyModals as boolean) ?? true,
      favoriteAddresses: (pd.favoriteAddresses as string[]) ?? [],
      isCarouselCollapsed: (pd.isCarouselCollapsed as boolean) ?? false,
      toastQueue: (pd.toastQueue as ToastItem[]) ?? [],
    };
  },
}) as unknown as import('zustand').StateCreator<ConsolidatedSearchState>;

const withDev = withDevtools<ConsolidatedSearchState>('consolidated-search')(withPersist) as unknown as import('zustand').StateCreator<ConsolidatedSearchState>;

export const useConsolidatedSearchStore = create<ConsolidatedSearchState>()(
  subscribeWithSelector(withDev)
);

// Helper to map consolidated state → query key params
export function toConsolidatedQueryParams(
  state: Pick<ConsolidatedSearchState, 'searchStage' | 'favoriteAddresses' | 'currentPage' | 'activeTab'>
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length ? state.favoriteAddresses : undefined,
    page: state.currentPage,
    tab: state.activeTab,
  } as const;
}

// Selector helpers for common use cases - using shallow equality to prevent infinite loops
export const selectSearchData = (state: ConsolidatedSearchState) => {
  return {
    results: state.searchResults,
    loading: state.searchLoading,
    error: state.searchError,
    hasSearched: state.hasSearched,
    totalCount: state.totalCount,
    hasMore: state.hasMore,
  };
};

export const selectUIState = (state: ConsolidatedSearchState) => {
  return {
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    showPropertyModals: state.showPropertyModals,
    isCarouselCollapsed: state.isCarouselCollapsed,
    isSearching: state.isSearching,
  };
};

export const selectFavorites = (state: ConsolidatedSearchState) => {
  return {
    addresses: state.favoriteAddresses,
    isHomeSaved: state.isHomeSaved,
  };
};

export const selectToasts = (state: ConsolidatedSearchState) => {
  return {
    queue: state.toastQueue,
    activeId: state.activeToastId,
    currentToast: state.toastQueue.find(t => t.id === state.activeToastId),
  };
};
