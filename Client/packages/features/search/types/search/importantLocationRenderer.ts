/**
 * Utility functions for rendering important location markers on Google Maps
 */

import type { IsochroneData } from "packages/features/search/types/isochrone";
import { log, LOG_CATEGORIES } from "packages/logger";
import { escapeHtml } from "packages/utils/dom/escapeHtml";
import { getDocument, getWindow } from "packages/utils/platform";

import { addressForMarkerTitle } from "./address";

// Google Maps types
interface GoogleMap {
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

export type ImportantLocationRenderOptions = {
  map: GoogleMap;
  importantMarkersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
  setImportantLocationMarkers?: (markers: GoogleAdvancedMarkerElement[]) => void;
  resetToDefaultZoom: () => void;
}; // Updated interface - force refresh

type ImportantLocation = {
  address: string;
  lat?: number | null;
  lng?: number | null;
  commute_tolerance?: number;
  icon?: string;
};

/** Truncate address for marker display when name is not available */
const truncateAddress = (address: string, maxLen = 25): string => {
  if (address.length <= maxLen) return address;
  return address.slice(0, maxLen - 3) + "...";
};

/**
 * Build list of important locations from isochrone data
 */
const buildImportantLocationsList = (isochroneData: IsochroneData): ImportantLocation[] => {
  const importantLocations: ImportantLocation[] = [];

  if (isochroneData.locations) {
    isochroneData.locations.forEach(
      (location: {
        address: string;
        commute_tolerance?: number;
        lat?: number | null;
        lng?: number | null;
        name?: string;
      }) => {
        if (!location.address) return;
        const dup = importantLocations.some((e) => e.address === location.address);
        if (!dup) {
          importantLocations.push({
            address: location.address,
            lat: location.lat,
            lng: location.lng,
            commute_tolerance: location.commute_tolerance ?? 30,
          });
        }
      }
    );
  }

  return importantLocations;
};

/**
 * Render important location markers on the map
 */
export const renderImportantLocationMarkers = (
  isochroneData: IsochroneData,
  options: ImportantLocationRenderOptions
) => {
  const { map, importantMarkersRef, setImportantLocationMarkers } = options;

  if (!map || !isochroneData?.center) {
    log.warn(
      LOG_CATEGORIES.MAP_RENDERING,
      "Cannot render important location markers: map or data not available"
    );
    log.warn(LOG_CATEGORIES.MAP_RENDERING, "Map ref available", {
      mapAvailable: !!map,
    });
    log.warn(LOG_CATEGORIES.MAP_RENDERING, "Isochrone center data", {
      center: isochroneData?.center,
    });
    return;
  }

  const win = getWindow() as Window & { google?: typeof google };
  if (!win?.google?.maps?.marker?.AdvancedMarkerElement) {
    log.warn(
      LOG_CATEGORIES.MAP_RENDERING,
      "AdvancedMarkerElement not available for important location markers"
    );
    log.warn(LOG_CATEGORIES.MAP_RENDERING, "Google Maps API status", {
      google: !!win?.google,
      maps: !!win?.google?.maps,
      marker: !!win?.google?.maps?.marker,
      AdvancedMarkerElement: !!win?.google?.maps?.marker?.AdvancedMarkerElement,
    });
    return;
  }

  // Clear existing important location markers
  if (importantMarkersRef.current) {
    importantMarkersRef.current.forEach((marker) => {
      // Type-safe marker cleanup
      if ("map" in marker && marker.map) {
        marker.map = null;
      }
    });
    importantMarkersRef.current = [];
  }

  const importantLocations = buildImportantLocationsList(isochroneData);
  if (importantLocations.length === 0) {
    return;
  }

  const markers: GoogleAdvancedMarkerElement[] = [];

  for (const loc of importantLocations) {
    // Skip locations without coordinates - this is normal and not an error
    if (!loc.lat || !loc.lng) {
      continue;
    }

    const { address } = loc;
    const position = { lat: loc.lat, lng: loc.lng };
    const displayLabel = truncateAddress(address);

    // Create marker box with triangle pointer
    const doc = getDocument();
    if (!doc) continue;
    const markerElement = doc.createElement("div");
    markerElement.className = "important-location-marker";

    const commuteTime = loc.commute_tolerance ?? 30;

    markerElement.innerHTML = `
      <div style="
        padding: 4px 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(158, 131, 113, 0.4);
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        white-space: nowrap;
      ">
        <div style="
          color: #4A3228; 
          font-size: 11px; 
          font-weight: 600;
          margin-bottom: 1px;
        ">${escapeHtml(displayLabel)}</div>
        <div style="
          color: #8B7355; 
          font-size: 9px; 
          font-weight: 500;
        ">${commuteTime} min</div>
        
        <!-- Triangle pointer -->
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(255, 255, 255, 0.95);
        "></div>
        <div style="
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 7px solid rgba(158, 131, 113, 0.4);
        "></div>
      </div>
    `;

    markerElement.style.cssText = `
      position: relative;
    `;

    const AdvancedMarkerCtor = win.google.maps.marker
      .AdvancedMarkerElement as unknown as new (options: {
      map: google.maps.Map;
      position: { lat: number; lng: number };
      content: HTMLElement;
      title: string;
    }) => GoogleAdvancedMarkerElement;

    const marker = new AdvancedMarkerCtor({
      map: map as google.maps.Map,
      position,
      content: markerElement,
      title: addressForMarkerTitle(address),
    });

    markers.push(marker);
  }

  importantMarkersRef.current = markers;
  if (setImportantLocationMarkers) {
    setImportantLocationMarkers(markers);
  }
};
