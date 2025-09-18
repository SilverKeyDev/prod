/**
 * Utility functions for rendering isochrone polygons on Google Maps
 */

import { memoryUtils } from '../hooks/unifiedCache';

// Version tracking for rendering optimization
let lastRenderedIsochroneVersion: string | null = null;
let lastRenderedIsochroneDataHash: string | null = null;

export type IsochroneRenderOptions = {
  map: google.maps.Map;
  polygonRef: React.MutableRefObject<google.maps.Polygon | null>;
  individualPolygonsRef: React.MutableRefObject<google.maps.Polygon[]>;
  focusOnCurrentProperty: () => void;
  version?: string; // Optional version for rendering optimization
};

/**
 * Create a hash of the isochrone data for version checking
 */
const createIsochroneDataHash = (isochroneData: unknown): string => {
  const dataString = JSON.stringify(isochroneData);
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

/**
 * Render isochrone polygon on the map
 */
export const renderIsochronePolygon = (
  isochroneData: unknown,
  options: IsochroneRenderOptions
) => {
  const { map, polygonRef, individualPolygonsRef, focusOnCurrentProperty, version } = options;

  console.log('🗺️ [ISOCHRONE_RENDERER] Starting render with data:', {
    hasMap: !!map,
    hasIsochrone: !!(isochroneData as { isochrone?: { geometry?: unknown } })?.isochrone,
    hasGeometry: !!(isochroneData as { isochrone?: { geometry?: unknown } })?.isochrone?.geometry,
    hasIndividualIsochrones: !!(isochroneData as { individual_isochrones?: unknown })?.individual_isochrones,
    individualCount: Array.isArray((isochroneData as { individual_isochrones?: unknown })?.individual_isochrones) 
      ? (isochroneData as { individual_isochrones?: unknown[] })?.individual_isochrones?.length || 0 
      : 0,
    version: version || 'no-version'
  });

  if (!map) {
    console.warn('❌ Google Map not initialized yet');
    return;
  }

  const isochroneDataTyped = isochroneData as { isochrone?: { geometry?: unknown }; individual_isochrones?: unknown };
  if (!isochroneDataTyped?.isochrone || !(isochroneDataTyped.isochrone as { geometry?: unknown })?.geometry) {
    console.warn('❌ No isochrone geometry data available for map rendering');
    return;
  }

  // Check if we should skip rendering (same version and data)
  const currentDataHash = createIsochroneDataHash(isochroneData);
  if (version && lastRenderedIsochroneVersion === version && lastRenderedIsochroneDataHash === currentDataHash) {
    console.log('⏭️ [ISOCHRONE_RENDERER] Skipping render - same version and data:', {
      version,
      lastVersion: lastRenderedIsochroneVersion,
      dataHash: currentDataHash,
      lastDataHash: lastRenderedIsochroneDataHash
    });
    return; // Skip rendering - same version and data
  }

  // Only clear existing polygons and isochrone data, not markers or search results
  // This prevents clearing markers during search operations
  memoryUtils.cleanupPolygons();
  memoryUtils.clearIsochroneData();

  // Clear existing polygons
  if (polygonRef.current) {
    polygonRef.current.setMap(null);
  }

  // Clear existing individual polygons
  if (individualPolygonsRef.current) {
    individualPolygonsRef.current.forEach((polygon: google.maps.Polygon) => polygon.setMap(null));
    individualPolygonsRef.current = [];
  }

  try {
    // First, render individual isochrones as gray outlines
    if (
      isochroneDataTyped.individual_isochrones &&
      Array.isArray(isochroneDataTyped.individual_isochrones)
    ) {
      const individualIsochrones = isochroneDataTyped.individual_isochrones as unknown[];
      individualIsochrones.forEach((individualData: unknown, index: number) => {
        const data = individualData as Record<string, unknown>;
        const geometry = data.isochrone as Record<string, unknown>;
        if (!geometry?.geometry) return;
        
        const geo = geometry.geometry as Record<string, unknown>;
        let coordinates: number[][][] = [];

        if (geo.type === 'Polygon') {
          coordinates = geo.coordinates as number[][][];
        } else if (geo.type === 'MultiPolygon') {
          const coords = geo.coordinates as number[][][][];
          [coordinates] = coords;
        }

        if (coordinates.length > 0) {
          const paths = coordinates.map((ring: number[][]) => {
            return ring.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }));
          });

          // Create individual polygon with slightly darker gray styling
          const individualPolygon = new google.maps.Polygon({
            paths,
            strokeColor: '#7A7A7A', // Slightly darker gray
            strokeOpacity: 0.6,
            strokeWeight: 1,
            fillColor: 'transparent',
            fillOpacity: 0,
            clickable: false,
          });

          individualPolygon.setMap(map);
          if (!individualPolygonsRef.current) individualPolygonsRef.current = [];
          individualPolygonsRef.current.push(individualPolygon);
          
          // Register with unified cache memory manager
          memoryUtils.registerPolygon({
            id: `individual-polygon-${index}`,
            paths,
            strokeColor: '#7A7A7A',
            strokeOpacity: 0.6,
            strokeWeight: 1,
            fillColor: 'transparent',
            fillOpacity: 0,
            map,
            polygon: individualPolygon,
          });
        }
      });
    }

    // Now render the main union isochrone
    const isochrone = isochroneDataTyped.isochrone as Record<string, unknown>;
    const geometry = isochrone.geometry as Record<string, unknown>;
    let coordinates: number[][][] = [];

    if (geometry.type === 'Polygon') {
      coordinates = geometry.coordinates as number[][][];
    } else if (geometry.type === 'MultiPolygon') {
      // For MultiPolygon, take the first polygon
      const coords = geometry.coordinates as number[][][][];
      [coordinates] = coords;
    } else {
      console.warn('❌ Unsupported geometry type:', geometry.type);
      return;
    }

    // Convert GeoJSON coordinates to Google Maps LatLng format
    // GeoJSON uses [longitude, latitude], Google Maps uses {lat, lng}
    const paths = coordinates.map((ring: number[][]) => {
      const convertedRing = ring.map((coord: number[]) => ({
        lat: coord[1], // latitude is second
        lng: coord[0], // longitude is first
      }));
      return convertedRing;
    });

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: '#7B9E7C', // Match the app's green theme
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#7B9E7C',
      fillOpacity: 0.15,
      clickable: false,
    });

    polygon.setMap(map);
    console.log('🔄 [ISOCHRONE_RENDERER] Updating polygonRef:', {
      polygon,
      polygonSet: !!polygon.getMap(),
      pathsCount: paths.length
    });
    polygonRef.current = polygon;
    
    // Register with unified cache memory manager
    memoryUtils.registerPolygon({
      id: 'main-isochrone-polygon',
      paths,
      strokeColor: '#7B9E7C',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#7B9E7C',
      fillOpacity: 0.15,
      map,
      polygon,
    });

    // Log the polygon bounds and center for debugging
    console.log('🗺️ [ISOCHRONE_RENDERER] Polygon created with bounds:', {
      paths: paths.length,
      firstPath: paths[0]?.slice(0, 3), // Show first 3 coordinates
      polygonSet: !!polygon.getMap(),
    });

    // Use MapZoomController for consistent zoom behavior
    setTimeout(() => {
      if (map) {
        console.log('🗺️ [ISOCHRONE_RENDERER] About to call focusOnCurrentProperty - this might move the map away from the isochrone!');
        try {
          focusOnCurrentProperty();
        } catch (error) {
          console.warn('🗺️ [ISOCHRONE_RENDERER] focusOnCurrentProperty failed, continuing without focus:', error);
        }
      }
    }, 100);
    
    console.log('✅ [ISOCHRONE_RENDERER] Render completed successfully:', {
      mainPolygonRendered: !!polygonRef.current,
      individualPolygonsRendered: individualPolygonsRef.current.length,
      version: version || 'no-version'
    });
  } catch (error: unknown) {
    console.error('❌ Error rendering isochrone polygon:', error);
    console.error('❌ Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      isochroneData,
    });
  }

  // Update version tracking
  if (version) {
    lastRenderedIsochroneVersion = version;
    lastRenderedIsochroneDataHash = currentDataHash;
  }
};
