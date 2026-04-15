import type { SearchViewMode } from "packages/store";
import type { IsochroneData } from "packages/types/api";

import type { MapPropertyCardRenderProps } from "@/features/search/hooks/data/useMapMarkers";
import type { SearchResult } from "@/features/search/types";
import type { Property } from "@/features/search/types/property";
import type { LastSearchContext } from "@/features/search/types/searchDisplay";

export type UseSearchPageMapParams = {
  /** When not `"map"`, marker updates are deferred until the user returns to the map view. */
  searchViewMode: SearchViewMode;
  isochroneData: IsochroneData | null;
  /** Map polygon: location bounds / viewport synthetic or commute isochrone (see useSearchMapOverlayData). */
  displayIsochroneData: IsochroneData | null;
  fetchIsochrone: () => Promise<IsochroneData | null>;
  /** When false, commute isochrone polygons and pins are hidden (search may still use server isochrone). */
  showCommuteOverlay: boolean;
  mapHomeCardsCount: number;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  showPropertyModals: boolean;
  selectedProperty: unknown;
  searchResults: SearchResult[];
  setSearchStage: (stage?: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setCurrentPage: (page: number) => void;
  setShowPropertyModals: (show: boolean) => void;
  isHomeSaved: (id: string, address?: string) => boolean;
  saveHome: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome: (id: string, address?: string) => Promise<void>;
  onMarkerClick: (property: SearchResult) => void;
  /** Clicking the floating map preview card opens full property details (URL). */
  onMapPreviewNavigate: (property: SearchResult) => void;
  onUnlockClick: (property: SearchResult) => void | Promise<void>;
  onOpenDetails: (propertyId: string) => void;
  getSearchAbortSignal: () => AbortSignal | undefined;
  /** Injected from apps/web (MapPropertyCardUtils) so packages do not depend on components */
  renderMapPropertyCard: (
    container: HTMLElement,
    props: MapPropertyCardRenderProps,
    onCardRendered?: (property: MapPropertyCardRenderProps["property"]) => void,
  ) => void;
  /** Injected from apps/web (MapPropertyCardUtils) */
  cleanupMapPropertyCard: (container: HTMLElement) => void;
  preferencesSubjectUserId?: string | null;
  saveLastSearchContext?: (ctx: LastSearchContext) => void;
};
