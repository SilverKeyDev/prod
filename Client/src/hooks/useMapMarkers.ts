import { useRef, useCallback, useEffect } from 'react';
import { MapMarkerManager } from '../components/ui/search/map';
import { SearchResult, IsochroneData } from '../types/search';

interface UseMapMarkersReturn {
  markerManagerRef: React.RefObject<MapMarkerManager | null>;
  googleMapRef: React.RefObject<google.maps.Map | null>;
  polygonRef: React.RefObject<google.maps.Polygon | null>;
  individualPolygonsRef: React.RefObject<google.maps.Polygon[]>;
  getVisibleMapEl: () => HTMLDivElement | null;
  initializeMarkerManager: (callbacks: {
    onSave: (property: SearchResult) => void;
    onUnsave: (propertyId: string) => void;
    onViewDetails: (property: SearchResult) => void;
    isHomeSaved: (propertyId: string) => boolean;
    calculatePropertyScore: (property: SearchResult) => number;
  }) => void;
  setGoogleMap: (map: google.maps.Map) => void;
  updateMarkers: (
    properties: SearchResult[],
    currentPage: number,
    propertiesPerPage: number,
    renderImportantLocationMarkers?: (isochroneData: IsochroneData, map: google.maps.Map) => Promise<void>,
    isochroneData?: IsochroneData | null,
    activeTab?: "results" | "saved"
  ) => void;
  clearMarkers: () => void;
  fitMapToMarkers: () => void;
  renderIsochronePolygons: (isochroneData: IsochroneData) => void;
  clearIsochronePolygons: () => void;
}

export function useMapMarkers(mapRef?: React.RefObject<HTMLDivElement>): UseMapMarkersReturn {
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const individualPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const markerManagerRef = useRef<MapMarkerManager | null>(null);

  // Helper: get the map container element
  const getVisibleMapEl = useCallback(() => {
    console.log("🗺️ [GET_VISIBLE_MAP] Starting container search", {
      hasMapRef: !!mapRef,
      mapRefCurrent: !!mapRef?.current,
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 1024,
      timestamp: new Date().toISOString()
    });

    const container = mapRef?.current;
    
    console.log("🗺️ [GET_VISIBLE_MAP] Container from mapRef", {
      containerFound: !!container,
      containerElement: container?.tagName,
      containerId: container?.id,
      containerClass: container?.className,
      containerOffsetWidth: container?.offsetWidth,
      containerOffsetHeight: container?.offsetHeight,
      containerClientWidth: container?.clientWidth,
      containerClientHeight: container?.clientHeight,
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 1024
    });

    if (!container) {
      console.warn("⚠️ [GET_VISIBLE_MAP] No container found from mapRef");
      return null;
    }
    
    // Check parent element visibility
    const parentElement = container.parentElement;
    console.log("🗺️ [GET_VISIBLE_MAP] Parent element analysis", {
      hasParent: !!parentElement,
      parentTagName: parentElement?.tagName,
      parentId: parentElement?.id,
      parentClass: parentElement?.className,
      parentOffsetWidth: parentElement?.offsetWidth,
      parentOffsetHeight: parentElement?.offsetHeight,
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 1024
    });

    // Check if the container is actually visible (not hidden by CSS)
    const elementToCheck = parentElement || container;
    const computedStyle = window.getComputedStyle(elementToCheck);
    
    console.log("🗺️ [GET_VISIBLE_MAP] Visibility check", {
      elementChecked: elementToCheck.tagName,
      elementId: elementToCheck.id,
      elementClass: elementToCheck.className,
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      transform: computedStyle.transform,
      width: computedStyle.width,
      height: computedStyle.height,
      maxWidth: computedStyle.maxWidth,
      maxHeight: computedStyle.maxHeight,
      overflow: computedStyle.overflow,
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 1024
    });

    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      console.warn("⚠️ [GET_VISIBLE_MAP] Container is hidden by CSS", {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        elementTagName: elementToCheck.tagName,
        elementId: elementToCheck.id,
        elementClass: elementToCheck.className,
        windowWidth: window.innerWidth,
        isMobile: window.innerWidth < 1024
      });
      return null;
    }
    
    console.log("✅ [GET_VISIBLE_MAP] Container is visible and ready", {
      containerElement: container.tagName,
      containerId: container.id,
      containerClass: container.className,
      containerSize: {
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      },
      windowWidth: window.innerWidth,
      isMobile: window.innerWidth < 1024
    });
    
    return container;
  }, [mapRef]);

  // Initialize marker manager with callbacks
  const initializeMarkerManager = useCallback((callbacks: {
    onSave: (property: SearchResult) => void;
    onUnsave: (propertyId: string) => void;
    onViewDetails: (property: SearchResult) => void;
    isHomeSaved: (propertyId: string) => boolean;
    calculatePropertyScore: (property: SearchResult) => number;
  }) => {
    if (!markerManagerRef.current) {
      markerManagerRef.current = new MapMarkerManager(callbacks);
      
      // Set the map immediately if it's available
      if (googleMapRef.current) {
        markerManagerRef.current.setMap(googleMapRef.current);
      }
    }
  }, []);

  // Set Google Map reference
  const setGoogleMap = useCallback((map: google.maps.Map) => {
    googleMapRef.current = map;
    
    // Set map on marker manager if it exists
    if (markerManagerRef.current) {
      markerManagerRef.current.setMap(map);
    }
  }, []);

  // Set map reference when map is ready
  useEffect(() => {
    if (markerManagerRef.current && googleMapRef.current) {
      markerManagerRef.current.setMap(googleMapRef.current);
    }
  }, []);

  // Update markers with optional important location markers
  const updateMarkers = useCallback((
    properties: SearchResult[],
    currentPage: number,
    propertiesPerPage: number,
    renderImportantLocationMarkers?: (isochroneData: IsochroneData, map: google.maps.Map) => Promise<void>,
    isochroneData?: IsochroneData | null,
    activeTab?: "results" | "saved"
  ) => {
    
    // Early return if no properties to avoid unnecessary processing
    if (properties.length === 0) {
      if (markerManagerRef.current) {
        markerManagerRef.current.clearMarkers();
      }
      return;
    }
    
    // Check if both manager and map are available
    if (!markerManagerRef.current || !googleMapRef.current) {
      console.warn('[SEARCH] ⚠️ Cannot update markers - missing manager or map, retrying in 100ms');
      // Retry after a short delay to allow initialization to complete
      setTimeout(() => {
        if (markerManagerRef.current && googleMapRef.current) {
          updateMarkers(properties, currentPage, propertiesPerPage, renderImportantLocationMarkers, isochroneData, activeTab);
        } else {
          console.warn('[SEARCH] ⚠️ Marker manager or map not available after retry');
        }
      }, 100);
      return;
    }
    
    markerManagerRef.current.updateMarkers(properties, currentPage, propertiesPerPage, activeTab);
    
    // Handle important location markers if provided
    if (renderImportantLocationMarkers && isochroneData) {
      renderImportantLocationMarkers(isochroneData, googleMapRef.current);
    }
    
    // Fit map to show markers if we have results
    if (properties.length > 0) {
      markerManagerRef.current.fitMapToMarkers();
    }
  }, []);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    if (markerManagerRef.current) {
      markerManagerRef.current.clearMarkers();
    }
  }, []);

  // Fit map to show all markers
  const fitMapToMarkers = useCallback(() => {
    if (markerManagerRef.current) {
      markerManagerRef.current.fitMapToMarkers();
    }
  }, []);

  // Render isochrone polygons on the map
  const renderIsochronePolygons = useCallback((isochroneData: any) => {
    if (!googleMapRef.current || !isochroneData) {
      console.warn('[ISOCHRONE] ⚠️ Cannot render polygons - missing map or data');
      return;
    }

    // Clear existing polygons first
    clearIsochronePolygons();

    try {
      // Render main isochrone polygon if available
      if (isochroneData.isochrone?.geometry) {
        const geometry = isochroneData.isochrone.geometry;
        let paths: google.maps.LatLngLiteral[] = [];

        if (geometry.type === "Polygon") {
          // Convert coordinates to LatLng format
          const coordinates = geometry.coordinates[0];
          paths = coordinates.map((coord: [number, number]) => ({
            lat: coord[1],
            lng: coord[0]
          }));
        } else if (geometry.type === "MultiPolygon") {
          // Use the first polygon's outer ring
          const coordinates = geometry.coordinates[0][0];
          paths = coordinates.map((coord: [number, number]) => ({
            lat: coord[1],
            lng: coord[0]
          }));
        }

        if (paths.length > 0) {
          const polygon = new google.maps.Polygon({
            paths: paths,
            strokeColor: '#9CAF88',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#9CAF88',
            fillOpacity: 0.2,
            map: googleMapRef.current
          });

          polygonRef.current = polygon;
        }
      }

      // Render individual isochrones if available
      if (isochroneData.individual_isochrones && Array.isArray(isochroneData.individual_isochrones)) {
        const individualPolygons: google.maps.Polygon[] = [];

        isochroneData.individual_isochrones.forEach((isochrone: any) => {
          if (isochrone.isochrone?.geometry) {
            const geometry = isochrone.isochrone.geometry;
            let paths: google.maps.LatLngLiteral[] = [];

            if (geometry.type === "Polygon") {
              const coordinates = geometry.coordinates[0];
              paths = coordinates.map((coord: [number, number]) => ({
                lat: coord[1],
                lng: coord[0]
              }));
            } else if (geometry.type === "MultiPolygon") {
              const coordinates = geometry.coordinates[0][0];
              paths = coordinates.map((coord: [number, number]) => ({
                lat: coord[1],
                lng: coord[0]
              }));
            }

            if (paths.length > 0) {
              const polygon = new google.maps.Polygon({
                paths: paths,
                strokeColor: '#7A8B6F',
                strokeOpacity: 0.6,
                strokeWeight: 1,
                fillColor: '#7A8B6F',
                fillOpacity: 0.1,
                map: googleMapRef.current
              });

              individualPolygons.push(polygon);
            }
          }
        });

        individualPolygonsRef.current = individualPolygons;
      }
    } catch (error) {
      console.error('[ISOCHRONE] ❌ Error rendering polygons:', error);
    }
  }, []);

  // Clear all isochrone polygons
  const clearIsochronePolygons = useCallback(() => {
    // Clear main polygon
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    // Clear individual polygons
    if (individualPolygonsRef.current.length > 0) {
      individualPolygonsRef.current.forEach(polygon => {
        polygon.setMap(null);
      });
      individualPolygonsRef.current = [];
    }
  }, []);

  return {
    markerManagerRef,
    googleMapRef,
    polygonRef,
    individualPolygonsRef,
    getVisibleMapEl,
    initializeMarkerManager,
    setGoogleMap,
    updateMarkers,
    clearMarkers,
    fitMapToMarkers,
    renderIsochronePolygons,
    clearIsochronePolygons,
  };
}
