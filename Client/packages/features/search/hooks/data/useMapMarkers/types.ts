import type { SearchResult } from "packages/types";
import type { Property } from "packages/types";

/** Props passed to renderMapPropertyCard (injected from apps/web to avoid packages depending on components). */
export type MapPropertyCardRenderProps = {
  activeTab: "results" | "saved";
  property: {
    id: string;
    address: string;
    price: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    lotSize?: string;
    propertyType?: string;
    lat: number;
    lng: number;
    images?: string[];
    calculatedScore?: number;
  };
  isSaved?: boolean;
  contextKey?: string;
  onUnlock?: () => void | Promise<void>;
  showScore?: boolean;
  isHomeSaved?: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome?: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome?: (
    propertyId: string,
    propertyAddress?: string,
  ) => Promise<void>;
};

export type UseMapMarkersProps = {
  activeTab: "results" | "saved";
  googleMapRef: React.RefObject<{
    getDiv: () => HTMLElement;
    setCenter: (center: { lat: number; lng: number }) => void;
    setZoom: (zoom: number) => void;
  }>;
  currentPage: number;
  propertiesPerPage: number;
  isochroneData: unknown;
  setIsochroneData: (data: unknown) => void;
  fetchIsochroneForMapOnly: () => Promise<unknown>;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome: (
    propertyId: string,
    propertyAddress?: string,
  ) => Promise<void>;
  onMarkerClick?: (property: SearchResult) => void;
  onUnlockClick?: (property: SearchResult) => void | Promise<void>;
  contextKey?: string;
  renderMapPropertyCard: (
    container: HTMLElement,
    props: MapPropertyCardRenderProps,
    onCardRendered?: (property: MapPropertyCardRenderProps["property"]) => void,
  ) => void;
  cleanupMapPropertyCard: (container: HTMLElement) => void;
};

export interface GoogleMap {
  getDiv: () => HTMLElement;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

export interface GoogleAdvancedMarkerElement {
  map: GoogleMap | null;
  setMap: (map: GoogleMap | null) => void;
  position: { lat: number; lng: number };
  title: string;
  content: HTMLElement;
  addListener: (eventName: string, handler: () => void) => void;
}

export type UseMapMarkersReturn = {
  updateMapMarkers: (results: SearchResult[]) => Promise<void>;
  clearMapMarkers: () => void;
  isUpdatingMarkers: boolean;
  markersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
  importantMarkersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
};
