import type {
  ResultsOrderBy,
  ResultsSortDirection,
  SearchDisplayPayload,
} from "packages/features/search/types/searchDisplay";

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
  activeTab: ActiveTab;
  currentPage: number;
  favoriteAddresses: string[];
  searchStage: string;
  isSearching: boolean;
  hasSearched: boolean;
  searchSource: SearchSource;
  showCommuteOverlay: boolean;
  lastMapRegion: MapRegionSnapshot | null;
  webMapCamera: WebMapCameraSnapshot | null;
  mapHomeCardsCount: number;
  resultsOrderBy: ResultsOrderBy;
  resultsSortDirection: ResultsSortDirection;
  userGeolocation: { lat: number; lng: number } | null;
  preferencesStrictFilter: boolean;
  showMapListingPreviews: boolean;
  dismissedMapPreviewIds: string[];

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
  setResultsOrderBy: (order: ResultsOrderBy) => void;
  setResultsSortDirection: (direction: ResultsSortDirection) => void;
  setUserGeolocation: (coords: { lat: number; lng: number } | null) => void;
  setPreferencesStrictFilter: (strict: boolean) => void;
  applySearchDisplayFromApi: (payload: SearchDisplayPayload) => void;
  setShowMapListingPreviews: (show: boolean) => void;
  dismissMapListingPreview: (propertyId: string) => void;
  restoreMapListingPreview: (propertyId: string) => void;
  clearDismissedMapPreviews: () => void;

  isHomeSaved: (propertyId: string) => boolean;

  reset: () => void;
};
