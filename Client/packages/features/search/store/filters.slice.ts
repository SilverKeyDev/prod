import { create } from "zustand";

import type { SearchDisplayPayload } from "packages/features/search/types/searchDisplay";
import {
  clampMapHomeCardsCount,
  DEFAULT_RESULTS_ORDER_BY,
  isResultsOrderBy,
} from "packages/features/search/types/searchDisplay";
import { withDevtools } from "packages/store/middleware/devtools";
import { persistSafe } from "packages/store/middleware/persistSafe";
import { withResettable } from "packages/store/middleware/resettable";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

export type ActiveTab = "results" | "saved";

export type SearchSource = "preferences" | "location";

/** Last visible map region (native) for viewport search; not persisted. */
export type MapRegionSnapshot = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Last Google Maps camera (web); persisted so Search keeps pan/zoom across navigation. */
export type WebMapCameraSnapshot = {
  lat: number;
  lng: number;
  zoom: number;
};

export type FiltersState = {
  // Search UI filters and selection controls
  activeTab: ActiveTab;
  currentPage: number;
  favoriteAddresses: string[];
  searchStage: string;
  isSearching: boolean;
  hasSearched: boolean;
  /** Commute/preferences search vs map viewport (Zillow-style) search */
  searchSource: SearchSource;
  /** Draw preference isochrone overlay on the map */
  showCommuteOverlay: boolean;
  /** Updated by native MapView onRegionChangeComplete for "search this map" */
  lastMapRegion: MapRegionSnapshot | null;
  /** Web: center/zoom saved on map idle; restored when Search remounts */
  webMapCamera: WebMapCameraSnapshot | null;
  /** How many property cards to show on the map at once (window start = currentPage) */
  mapHomeCardsCount: number;
  /** Client-side sort for search results list + map order */
  resultsOrderBy: import("packages/features/search/types/searchDisplay").ResultsOrderBy;
  /** Device geolocation for distance sort (optional) */
  userGeolocation: { lat: number; lng: number } | null;
  /** Server: always run preference post-filters; when false, lenient until pool has more than 100 homes */
  preferencesStrictFilter: boolean;
  /**
   * Dev-only: floating map listing preview cards. Not persisted.
   * Default false until first successful search; then enabled automatically (dev builds only).
   */
  showMapListingPreviews: boolean;
  /** Dev-only: listing ids whose map preview cards are hidden; pins remain. Not persisted. */
  dismissedMapPreviewIds: string[];

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentPage: (page: number) => void;
  setFavoriteAddresses: (addresses: string[]) => void;
  setSearchStage: (stage: string) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setSearchSource: (source: SearchSource) => void;
  setShowCommuteOverlay: (show: boolean) => void;
  setLastMapRegion: (region: MapRegionSnapshot | null) => void;
  setWebMapCamera: (camera: WebMapCameraSnapshot | null) => void;
  setMapHomeCardsCount: (count: number) => void;
  setResultsOrderBy: (
    order: import("packages/features/search/types/searchDisplay").ResultsOrderBy,
  ) => void;
  setUserGeolocation: (coords: { lat: number; lng: number } | null) => void;
  applySearchDisplayFromApi: (payload: SearchDisplayPayload) => void;
  setShowMapListingPreviews: (show: boolean) => void;
  dismissMapListingPreview: (propertyId: string) => void;
  clearDismissedMapPreviews: () => void;

  // Utils
  isHomeSaved: (propertyId: string) => boolean;

  reset: () => void;
};

const initialState = (): Omit<
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
  | "setUserGeolocation"
  | "setPreferencesStrictFilter"
  | "applySearchDisplayFromApi"
  | "setShowMapListingPreviews"
  | "dismissMapListingPreview"
  | "clearDismissedMapPreviews"
  | "isHomeSaved"
  | "reset"
> => ({
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
  userGeolocation: null,
  preferencesStrictFilter: false,
  showMapListingPreviews: false,
  dismissedMapPreviewIds: [],
});

const baseCreator: import("zustand").StateCreator<FiltersState> = (
  set,
  get,
) => ({
  ...initialState(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setFavoriteAddresses: (addresses) =>
    set({ favoriteAddresses: [...addresses] }),
  setSearchStage: (stage) => set({ searchStage: stage }),
  setIsSearching: (searching) => set({ isSearching: searching }),
  setHasSearched: (searched) => set({ hasSearched: searched }),
  setSearchSource: (source) =>
    set({
      searchSource: source,
      showCommuteOverlay: source === "preferences",
    }),
  setShowCommuteOverlay: (show) => set({ showCommuteOverlay: show }),
  setLastMapRegion: (region) => set({ lastMapRegion: region }),
  setWebMapCamera: (camera) => set({ webMapCamera: camera }),
  setMapHomeCardsCount: (count) =>
    set({ mapHomeCardsCount: clampMapHomeCardsCount(count) }),
  setResultsOrderBy: (order) => set({ resultsOrderBy: order }),
  setUserGeolocation: (coords) => set({ userGeolocation: coords }),
  setPreferencesStrictFilter: (strict) =>
    set({ preferencesStrictFilter: strict }),
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
        if (
          ctx.search_source === "preferences" ||
          ctx.search_source === "location"
        ) {
          updates.searchSource = ctx.search_source;
          updates.showCommuteOverlay = ctx.search_source === "preferences";
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
          },
    ),
  clearDismissedMapPreviews: () => set({ dismissedMapPreviewIds: [] }),
  isHomeSaved: (propertyId: string) => {
    const state = get();
    return state.favoriteAddresses.includes(propertyId);
  },
  // placeholder; will be overwritten by withResettable
  reset: () => {},
});

const withReset = withResettable<FiltersState>(
  baseCreator,
  (set, _get, _store) => ({
    ...initialState(),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setFavoriteAddresses: (addresses) =>
      set({ favoriteAddresses: [...addresses] }),
    setSearchStage: (stage) => set({ searchStage: stage }),
    setIsSearching: (searching) => set({ isSearching: searching }),
    setHasSearched: (searched) => set({ hasSearched: searched }),
    setSearchSource: (source) =>
      set({
        searchSource: source,
        showCommuteOverlay: source === "preferences",
      }),
    setShowCommuteOverlay: (show) => set({ showCommuteOverlay: show }),
    setLastMapRegion: (region) => set({ lastMapRegion: region }),
    setWebMapCamera: (camera) => set({ webMapCamera: camera }),
    setMapHomeCardsCount: (count) =>
      set({ mapHomeCardsCount: clampMapHomeCardsCount(count) }),
    setResultsOrderBy: (order) => set({ resultsOrderBy: order }),
    setUserGeolocation: (coords) => set({ userGeolocation: coords }),
    setPreferencesStrictFilter: (strict) =>
      set({ preferencesStrictFilter: strict }),
    applySearchDisplayFromApi: (payload) =>
      set((state) => {
        const ctx = payload.last_search_context;
        const updates: Partial<FiltersState> = {
          showCommuteOverlay: Boolean(payload.show_commute_overlay),
          mapHomeCardsCount: clampMapHomeCardsCount(
            payload.map_home_cards_count,
          ),
          resultsOrderBy: isResultsOrderBy(payload.results_order_by)
            ? payload.results_order_by
            : DEFAULT_RESULTS_ORDER_BY,
          preferencesStrictFilter:
            typeof payload.preferences_strict_filter === "boolean"
              ? payload.preferences_strict_filter
              : state.preferencesStrictFilter,
        };
        if (ctx) {
          if (
            ctx.search_source === "preferences" ||
            ctx.search_source === "location"
          ) {
            updates.searchSource = ctx.search_source;
            updates.showCommuteOverlay = ctx.search_source === "preferences";
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
              dismissedMapPreviewIds: [
                ...state.dismissedMapPreviewIds,
                propertyId,
              ],
            },
      ),
    clearDismissedMapPreviews: () => set({ dismissedMapPreviewIds: [] }),
    isHomeSaved: () => false,
    reset: () => {},
  }),
) as unknown as import("zustand").StateCreator<FiltersState>;

const withPersist = persistSafe<FiltersState>(withReset, {
  name: "filters-store",
  version: 5,
  storage: getLocalStorage() as import("zustand/middleware").StateStorage,
  partialize: (state: FiltersState) => ({
    activeTab: state.activeTab,
    currentPage: state.currentPage,
    favoriteAddresses: state.favoriteAddresses,
    searchStage: state.searchStage,
    hasSearched: state.hasSearched,
    searchSource: state.searchSource,
    showCommuteOverlay: state.showCommuteOverlay,
    webMapCamera: state.webMapCamera,
    mapHomeCardsCount: state.mapHomeCardsCount,
    resultsOrderBy: state.resultsOrderBy,
    preferencesStrictFilter: state.preferencesStrictFilter,
  }),
  migrate: (persisted: unknown, oldVersion: number) => {
    const base = initialState();
    if (!persisted || typeof persisted !== "object") {
      return { ...base } as FiltersState;
    }
    const p = persisted as Partial<FiltersState>;
    const rawCam = p.webMapCamera;
    const cameraValid =
      oldVersion >= 3 &&
      rawCam &&
      typeof rawCam.lat === "number" &&
      typeof rawCam.lng === "number" &&
      typeof rawCam.zoom === "number";
    const webMapCamera = cameraValid ? rawCam : null;
    const mapHomeCardsCount =
      oldVersion >= 4 && typeof p.mapHomeCardsCount === "number"
        ? clampMapHomeCardsCount(p.mapHomeCardsCount)
        : 1;
    const resultsOrderBy =
      oldVersion >= 4 &&
      typeof p.resultsOrderBy === "string" &&
      isResultsOrderBy(p.resultsOrderBy)
        ? p.resultsOrderBy
        : DEFAULT_RESULTS_ORDER_BY;
    const preferencesStrictFilter =
      oldVersion >= 5 && typeof p.preferencesStrictFilter === "boolean"
        ? p.preferencesStrictFilter
        : false;
    return {
      ...base,
      ...p,
      lastMapRegion: null,
      webMapCamera,
      mapHomeCardsCount,
      resultsOrderBy,
      preferencesStrictFilter,
      userGeolocation: null,
      searchSource: p.searchSource === "location" ? "location" : "preferences",
      showCommuteOverlay:
        typeof p.showCommuteOverlay === "boolean"
          ? p.showCommuteOverlay
          : p.searchSource === "location"
            ? false
            : true,
    } as FiltersState;
  },
}) as unknown as import("zustand").StateCreator<FiltersState>;

const withDev = withDevtools<FiltersState>("filters")(
  withPersist,
) as unknown as import("zustand").StateCreator<FiltersState>;

export const useFiltersStore = create<FiltersState>()(withDev);

// Helper to map filters → query key params (pure function)
export function toQueryParams(
  state: Pick<
    FiltersState,
    "searchStage" | "favoriteAddresses" | "currentPage"
  >,
) {
  return {
    stage: state.searchStage ?? undefined,
    favorites: state.favoriteAddresses.length
      ? state.favoriteAddresses
      : undefined,
    page: state.currentPage,
  } as const;
}
