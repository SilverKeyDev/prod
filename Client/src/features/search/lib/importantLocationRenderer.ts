/**
 * Utility functions for rendering important location markers on Google Maps
 */

import type { IsochroneData } from '../../../core/schemas/search';
import { memoryUtils } from '../hooks/unifiedCache';

// Version tracking for rendering optimization
let lastRenderedVersion: string | null = null;
let lastRenderedDataHash: string | null = null;

export type ImportantLocationRenderOptions = {
  map: google.maps.Map;
  importantMarkersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>;
  setImportantLocationMarkers?: (markers: google.maps.marker.AdvancedMarkerElement[]) => void;
  resetToDefaultZoom: () => void;
  version?: string; // Optional version for rendering optimization
};

type ImportantLocation = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  commute_tolerance?: number;
  icon?: string;
};

/**
 * Create a hash of the isochrone data for version checking
 */
const createDataHash = (isochroneData: IsochroneData): string => {
  const dataString = JSON.stringify({
    center: isochroneData.center,
    locations: isochroneData.locations?.map((loc) => ({
      name: loc.name,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      commute_tolerance: loc.commute_tolerance,
    })),
  });
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

/**
 * Build list of important locations from isochrone data
 */
const buildImportantLocationsList = (isochroneData: IsochroneData): ImportantLocation[] => {
  const importantLocations: ImportantLocation[] = [];

  // Helper function to check if coordinates are the same (with small tolerance)
  const isSameLocation = (lat1: number, lng1: number, lat2: number, lng2: number): boolean => {
    const tolerance = 0.0001; // ~11 meters
    return Math.abs(lat1 - lat2) < tolerance && Math.abs(lng1 - lng2) < tolerance;
  };

  // Add center as Primary Location if it exists and no other location has the same coordinates
  if (isochroneData.center) {
    const cLat = isochroneData.center.lat;
    const cLng = isochroneData.center.lon;
    const hasDuplicateCenter = !!isochroneData.locations?.some(
      (location) =>
        location.lat != null &&
        location.lng != null &&
        isSameLocation(cLat, cLng, location.lat, location.lng),
    );

    if (!hasDuplicateCenter) {
      importantLocations.push({
        name: 'Primary Location',
        address: 'Primary Location',
        lat: cLat,
        lng: cLng,
        commute_tolerance: 30,
      });
    }
  }

  // Add other locations, checking for duplicates by both address and coordinates
  if (isochroneData.locations) {
    isochroneData.locations.forEach((location) => {
      if (!location.address || location.lat == null || location.lng == null) return;

      const dupByAddress = importantLocations.some((e) => e.address === location.address);
      const dupByCoords = importantLocations.some(
        (e) =>
          e.lat != null &&
          e.lng != null &&
          isSameLocation(e.lat, e.lng, location.lat as number, location.lng as number),
      );

      if (!dupByAddress && !dupByCoords) {
        importantLocations.push({
          name: location.name ?? 'Important Location',
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          commute_tolerance: location.commute_tolerance ?? 30,
        });
      }
    });
  }

  return importantLocations;
};

/**
 * Render important location markers on the map
 * Ensures the BOTTOM TIP of the triangle pointer is anchored to the exact LatLng.
 */
export const renderImportantLocationMarkers = (
  isochroneData: IsochroneData,
  options: ImportantLocationRenderOptions,
) => {
  const { map, importantMarkersRef, setImportantLocationMarkers, version } = options;

  // Removed verbose logging

  if (!map || !isochroneData?.center) {
    return;
  }

  // Check if we should skip rendering (same version and data)
  const currentDataHash = createDataHash(isochroneData);
  if (version && lastRenderedVersion === version && lastRenderedDataHash === currentDataHash) {
    return; // Skip rendering - same version and data
  }

  // Clear existing important location markers from cache first
  memoryUtils.cleanupMarkers();

  // Clear existing important location markers
  if (importantMarkersRef.current) {
    importantMarkersRef.current.forEach((marker) => {
      if ('map' in marker) {
        // AdvancedMarkerElement detaches with setting map to null
        (marker as any).map = null;
      }
    });
    importantMarkersRef.current = [];
  }

  const importantLocations = buildImportantLocationsList(isochroneData);

  // Removed verbose logging

  const POINTER_TIP_PX = 7; // height of the outer (border) triangle tip
  const INNER_TRIANGLE_HEIGHT = 6; // height of the inner (white) triangle tip

  const markers: google.maps.marker.AdvancedMarkerElement[] = [];

  for (const loc of importantLocations) {
    // Skip locations without coordinates - this is normal and not an error
    if (loc.lat == null || loc.lng == null) {
      continue;
    }

    const { name, address } = loc;
    const position = { lat: loc.lat, lng: loc.lng };

    // Create marker box with triangle pointer
    const wrapper = document.createElement('div');
    wrapper.className = 'important-location-marker';

    // IMPORTANT: anchor bottom tip exactly at LatLng
    // We include the inner triangle height in the element's box model via margin-bottom
    // and then use translate(-50%, -100%) so the *inner triangle tip* sits on the coordinate.
    // The outer triangle extends 1px further down for visual border effect.
    wrapper.style.cssText = `
      position: relative;
      transform: translate(-50%, -100%);
      will-change: transform;
      pointer-events: auto;
      /* Avoid accidental text selection when clicking markers */
      user-select: none;
    `;

    const commuteTime = loc.commute_tolerance ?? 30;

    const bubble = document.createElement('div');
    bubble.style.cssText = `
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
      /* Reserve space for the pointer so the wrapper's bottom is at the tip */
      margin-bottom: ${INNER_TRIANGLE_HEIGHT}px;
    `;
    bubble.innerHTML = `
      <div style="color:#4A3228;font-size:11px;font-weight:600;margin-bottom:1px;">${name}</div>
      <div style="color:#8B7355;font-size:9px;font-weight:500;">${commuteTime} min</div>
    `;

    // Triangle pointer (inner white) - positioned so its tip is exactly at the coordinate
    const triInner = document.createElement('div');
    triInner.style.cssText = `
      position: absolute;
      bottom: -${INNER_TRIANGLE_HEIGHT}px;
      left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: ${INNER_TRIANGLE_HEIGHT}px solid transparent;
      border-right: ${INNER_TRIANGLE_HEIGHT}px solid transparent;
      border-top: ${INNER_TRIANGLE_HEIGHT}px solid rgba(255,255,255,0.95);
      pointer-events: none;
    `;

    // Triangle pointer (outer border) - positioned so its tip is exactly at the coordinate
    const triOuter = document.createElement('div');
    triOuter.style.cssText = `
      position: absolute;
      bottom: -${POINTER_TIP_PX}px;
      left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: ${POINTER_TIP_PX}px solid transparent;
      border-right: ${POINTER_TIP_PX}px solid transparent;
      border-top: ${POINTER_TIP_PX}px solid rgba(158,131,113,0.4);
      pointer-events: none;
    `;

    bubble.appendChild(triOuter);
    bubble.appendChild(triInner);
    wrapper.appendChild(bubble);

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      content: wrapper,
      title: `${name} - ${address}`,
    });

    markers.push(marker);

    // Register with unified cache memory manager
    memoryUtils.registerMarker({
      id: `important-location-${name}`,
      position,
      title: `${name} - ${address}`,
      content: wrapper,
    });
  }

  importantMarkersRef.current = markers;
  if (setImportantLocationMarkers) {
    setImportantLocationMarkers(markers);
  }

  // Removed verbose logging

  // Update version tracking
  if (version) {
    lastRenderedVersion = version;
    lastRenderedDataHash = currentDataHash;
  }
};
