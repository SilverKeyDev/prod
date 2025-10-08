/**
 * Utility functions for rendering important location markers on Google Maps
 */

import type { IsochroneData } from "../../../../../packages/schemas/api";

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
}

export type ImportantLocationRenderOptions = {
  map: GoogleMap;
  importantMarkersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
  setImportantLocationMarkers?: (
    markers: GoogleAdvancedMarkerElement[],
  ) => void;
  resetToDefaultZoom: () => void;
}; // Updated interface - force refresh

type ImportantLocation = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  commute_tolerance?: number;
  icon?: string;
};

/**
 * Build list of important locations from isochrone data
 */
const buildImportantLocationsList = (
  isochroneData: IsochroneData,
): ImportantLocation[] => {
  const importantLocations: ImportantLocation[] = [];

  if (isochroneData.center) {
    importantLocations.push({
      name: "Primary Location",
      address: "Primary Location",
      lat: isochroneData.center.lat,
      lng: isochroneData.center.lng,
      commute_tolerance: 30,
    });
  }

  if (isochroneData.locations) {
    isochroneData.locations.forEach(
      (location: {
        name: string;
        address: string;
        commute_tolerance?: number;
        lat: number | null;
        lng: number | null;
      }) => {
        if (!location.address) return;
        const dup = importantLocations.some(
          (e) => e.address === location.address,
        );
        if (!dup) {
          importantLocations.push({
            name: location.name ?? "Important Location",
            address: location.address,
            lat: location.lat,
            lng: location.lng,
            commute_tolerance: location.commute_tolerance ?? 30,
          });
        }
      },
    );
  }

  return importantLocations;
};

/**
 * Render important location markers on the map
 */
export const renderImportantLocationMarkers = (
  isochroneData: IsochroneData,
  options: ImportantLocationRenderOptions,
) => {
  const { map, importantMarkersRef, setImportantLocationMarkers } = options;

  if (!map || !isochroneData?.center) {
    console.warn(
      "❌ Cannot render important location markers: map or data not available",
    );
    console.warn("📊 Map ref available:", !!map);
    console.warn(
      "📊 Isochrone center data:",
      JSON.stringify(isochroneData?.center, null, 2),
    );
    return;
  }

  // Check if Google Maps API and AdvancedMarkerElement are available
  if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
    console.warn(
      "❌ AdvancedMarkerElement not available for important location markers",
    );
    console.warn("Google Maps API status:", {
      google: !!window.google,
      maps: !!window.google?.maps,
      marker: !!window.google?.maps?.marker,
      AdvancedMarkerElement: !!window.google?.maps?.marker?.AdvancedMarkerElement,
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

    const { name, address } = loc;
    const position = { lat: loc.lat, lng: loc.lng };

    // Create marker box with triangle pointer
    const markerElement = document.createElement("div");
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
        ">${name}</div>
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

    const AdvancedMarkerCtor =
      window.google.maps.marker.AdvancedMarkerElement as unknown as new (options: {
        map: any;
        position: { lat: number; lng: number };
        content: HTMLElement;
        title: string;
      }) => GoogleAdvancedMarkerElement;

    const marker = new AdvancedMarkerCtor({
      map: map as unknown as any,
      position,
      content: markerElement,
      title: `${name} - ${address}`,
    });

    markers.push(marker);
  }

  importantMarkersRef.current = markers;
  if (setImportantLocationMarkers) {
    setImportantLocationMarkers(markers);
  }
};
