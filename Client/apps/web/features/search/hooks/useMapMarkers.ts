import { useRef, useCallback, useState } from "react";

import { renderMapPropertyCard, cleanupMapPropertyCard } from "../../../components/cards";
import type { Property } from "../../../../../packages/schemas/property";
import type { SearchResult } from "../../../../../packages/schemas/search";
import type { IsochroneData } from "../../../../../packages/schemas/api";
import { renderImportantLocationMarkers } from "../lib/importantLocationRenderer";
import { calculatePropertyCardCenter } from "../lib/MapZoomController";

// Google Maps types
interface GoogleMap {
  getDiv: () => HTMLElement;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
}

interface GoogleMarker {
  map: GoogleMap | null;
  setMap: (map: GoogleMap | null) => void;
}

interface GoogleAdvancedMarkerElement extends GoogleMarker {
  position: { lat: number; lng: number };
  title: string;
  content: HTMLElement;
  addListener: (eventName: string, handler: () => void) => void;
}



type UseMapMarkersProps = {
  googleMapRef: React.RefObject<GoogleMap>;
  currentPage: number;
  propertiesPerPage: number;
  isochroneData: unknown;
  setIsochroneData: (data: unknown) => void;
  fetchIsochroneForMapOnly: () => Promise<unknown>;
  calculatePropertyScore: (property: SearchResult) => number;
  onMarkerClick?: (property: SearchResult) => void;
  onUnlockClick?: (property: SearchResult) => void;
};

type UseMapMarkersReturn = {
  updateMapMarkers: (results: SearchResult[]) => Promise<void>;
  clearMapMarkers: () => void;
  isUpdatingMarkers: boolean;
  markersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
  importantMarkersRef: React.MutableRefObject<GoogleAdvancedMarkerElement[]>;
};

export const useMapMarkers = ({
  googleMapRef,
  currentPage,
  propertiesPerPage,
  isochroneData,
  setIsochroneData,
  fetchIsochroneForMapOnly,
  calculatePropertyScore,
  onMarkerClick,
  onUnlockClick,
}: UseMapMarkersProps): UseMapMarkersReturn => {
  const markersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const importantMarkersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false);

  // Handle rendering important location markers
  const handleRenderImportantLocationMarkers = useCallback(
    (data: unknown) => {
      if (!googleMapRef.current) {
        return;
      }

      // Validate data before passing to render function
      if (!data || typeof data !== "object") {
        return;
      }

      // Type guard to ensure data has required IsochroneData properties
      const isochroneData = data as IsochroneData;
      if (!isochroneData.center || !isochroneData.locations) {
        return;
      }

      // Render new important location markers with correct parameters
      renderImportantLocationMarkers(isochroneData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (markers) => {
          if (Array.isArray(markers)) {
            importantMarkersRef.current = markers;
          }
        },
        resetToDefaultZoom: () => {
          // Default zoom reset - can be overridden by parent
          if (googleMapRef.current) {
            googleMapRef.current.setZoom(13);
          }
        },
      });
    },
    [googleMapRef],
  );

  // Clear all markers from the map
  const clearMapMarkers = useCallback(() => {
    // Clear property markers with improved cleanup
    markersRef.current.forEach((marker) => {
      if (marker && typeof marker === "object") {
        // Clean up React root for the marker content
        const markerWithContent = marker as unknown as { content?: HTMLElement };
        if (markerWithContent.content && markerWithContent.content instanceof HTMLElement) {
          // Use setTimeout to defer cleanup and avoid race conditions during React rendering
          setTimeout(() => {
            cleanupMapPropertyCard(markerWithContent.content!);
          }, 0);
        }
        
        // Remove marker from map
        if ("map" in marker) {
          const markerWithMap = marker as { map: GoogleMap | null };
          markerWithMap.map = null;
        }
        
        // Clean up overlay if it exists
        const markerWithOverlay = marker as unknown as {
          overlay?: { 
            setMap: (map: GoogleMap | null) => void;
            onRemove?: () => void;
          };
        };
        if (
          markerWithOverlay?.overlay &&
          typeof markerWithOverlay.overlay === "object"
        ) {
          // Call onRemove if available for proper cleanup
          if (typeof markerWithOverlay.overlay.onRemove === "function") {
            markerWithOverlay.overlay.onRemove();
          }
          // Remove overlay from map
          if (typeof markerWithOverlay.overlay.setMap === "function") {
            markerWithOverlay.overlay.setMap(null);
          }
        }
      }
    });
    markersRef.current = [];

    // Clear important location markers
    importantMarkersRef.current.forEach((marker) => {
      if (marker && typeof marker === "object" && "map" in marker) {
        const markerWithMap = marker as { map: GoogleMap | null };
        markerWithMap.map = null;
      }
    });
    importantMarkersRef.current = [];
  }, []);

  // Update map markers with search results
  const updateMapMarkers = useCallback(
    async (results: SearchResult[]) => {
      // Prevent duplicate calls
      if (!googleMapRef.current || isUpdatingMarkers) {
        return;
      }

      // Check if we actually need to update (same data)
      const newResultsCount = results?.length || 0;
      
      // Only skip update if we have no results to show
      if (newResultsCount === 0) {
        clearMapMarkers();
        setIsUpdatingMarkers(false);
        return;
      }

      setIsUpdatingMarkers(true);

      // Clear existing markers
      clearMapMarkers();

      // Re-render important location markers FIRST (so they appear behind home markers)
      if (isochroneData) {
        handleRenderImportantLocationMarkers(isochroneData);
      } else {
        const data = await fetchIsochroneForMapOnly();
        if (data && typeof data === "object") {
          setIsochroneData(data);
          handleRenderImportantLocationMarkers(data);
        }
      }

      // Paginate the results - only show propertiesPerPage at a time
      const startIndex = currentPage * propertiesPerPage;
      const endIndex = startIndex + propertiesPerPage;
      const paginatedData = results.slice(startIndex, endIndex);

      // Check if Google Maps API and AdvancedMarkerElement are available

      if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
        console.error("❌ [MARKER POSITION UPDATE] AdvancedMarkerElement not available, skipping marker update");
        setIsUpdatingMarkers(false);
        return;
      }

      const { AdvancedMarkerElement } = (window as any).google.maps.marker;

      // Create markers for each property with performance optimization
      // Use requestAnimationFrame for better performance with large datasets
      const createMarkersBatch = (data: SearchResult[], startIndex = 0) => {
        const batchSize = 10; // Process markers in batches
        const endIndex = Math.min(startIndex + batchSize, data.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const result = data[i];
          // Use backend ML score (_score) to match HomeCard behavior
          const score = result._score ?? 0;
          
          // Log score issues for debugging
          const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
          if (score === 0 || score === undefined || score === null) {
            console.warn("⚠️ [MARKER DATA] Property has no score:", {
              environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
              propertyId: result.id,
              address: result.address,
              _score: result._score,
              scoreType: typeof result._score,
              willShowScore: score > 0,
            });
          }
          
          // Create marker container for MapPropertyCard
          const markerElement = document.createElement("div");
          markerElement.className = "property-location-marker";
          markerElement.style.cssText = `
            position: relative;
            z-index: 1000;
          `;

          // Convert SearchResult to MapPropertyCard format
          // Only pass score if it's a valid number > 0
          const hasValidScore = typeof score === 'number' && score > 0;
          const propertyData = {
            id: result.id,
            address: result.address,
            price: result.price,
            bedrooms: result.bedrooms,
            bathrooms: result.bathrooms,
            sqft: result.sqft,
            lotSize: result.lotSize,
            propertyType: result.propertyType,
            lat: result.lat,
            lng: result.lng,
            images: result.imageUrl ? [result.imageUrl] : undefined,
            calculatedScore: hasValidScore ? score : undefined,
          };

          console.log("📍 [MARKER DATA] Property data for MapPropertyCard:", {
            environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
            propertyId: result.id,
            address: result.address?.substring(0, 30) + "...",
            calculatedScore: propertyData.calculatedScore,
            showScore: hasValidScore,
            backendScore: result._score,
            scoreType: typeof result._score,
            hasValidScore,
          });

          // Render MapPropertyCard directly into the marker element
          try {
            renderMapPropertyCard(markerElement, {
              property: propertyData,
              onUnlock: onUnlockClick ? () => onUnlockClick(result) : undefined,
              showScore: hasValidScore, // Show score for properties with valid scores
            });
          } catch (error) {
            console.error(`❌ [MARKER POSITION UPDATE] Error rendering MapPropertyCard for property ${i + 1}:`, error);
            // Create fallback content if rendering fails
            markerElement.innerHTML = `
              <div style="background: white; border: 1px solid #ccc; border-radius: 8px; padding: 8px; min-width: 120px;">
                <div style="font-weight: bold; font-size: 12px;">${result.address}</div>
                <div style="color: #666; font-size: 11px;">${result.price}</div>
              </div>
            `;
          }

          // Validate position data before creating marker
          if (typeof result.lat !== 'number' || typeof result.lng !== 'number' || 
              isNaN(result.lat) || isNaN(result.lng)) {
            console.error(`❌ [MARKER POSITION UPDATE] Invalid position data for property ${i + 1}:`, {
              lat: result.lat,
              lng: result.lng,
              address: result.address
            });
            continue;
          }

          // Create the marker with position logging
          try {
            const marker = new AdvancedMarkerElement({
              map: googleMapRef.current! as any,
              position: { lat: result.lat, lng: result.lng },
              title: result.address,
              content: markerElement,
            }) as unknown as GoogleAdvancedMarkerElement;
            
            // Add proper click event listener using addListener()
            marker.addListener('click', () => {
              console.log('🗺️ [MARKER_CLICK] Marker clicked:', {
                propertyId: result.id,
                address: result.address,
                coordinates: { lat: result.lat, lng: result.lng },
                timestamp: new Date().toISOString(),
              });
              
              // Call the marker click handler if provided
              if (onMarkerClick) {
                onMarkerClick(result);
              }
            });
            
            markersRef.current.push(marker);
          } catch (error) {
            console.error(`❌ [MARKER POSITION UPDATE] Error creating marker for property ${i + 1}:`, error);
            // Clean up the marker element if marker creation fails
            // Defer cleanup to avoid race conditions during React rendering
            setTimeout(() => {
              cleanupMapPropertyCard(markerElement);
            }, 0);
          }
        }
        
        // Continue with next batch if there are more items
        if (endIndex < data.length) {
          requestAnimationFrame(() => createMarkersBatch(data, endIndex));
        } else {
          // All markers created, fit map to show current page markers
          if (results.length > 0) {
            const firstProperty = results[0];
            if (firstProperty && googleMapRef.current) {
              const center = calculatePropertyCardCenter(firstProperty.lat, firstProperty.lng, firstProperty.id);
              googleMapRef.current.setCenter(center);
              googleMapRef.current.setZoom(13);
            }
          }

          setIsUpdatingMarkers(false);
        }
      };
      
      // Start batch processing
      createMarkersBatch(paginatedData);
    },
    [
      googleMapRef,
      currentPage,
      propertiesPerPage,
      isochroneData,
      setIsochroneData,
      fetchIsochroneForMapOnly,
      calculatePropertyScore,
      isHomeSaved,
      saveHome,
      removeSavedHome,
      onMarkerClick,
      onUnlockClick,
      isUpdatingMarkers,
      clearMapMarkers,
      handleRenderImportantLocationMarkers,
    ],
  );

  return {
    updateMapMarkers,
    clearMapMarkers,
    isUpdatingMarkers,
    markersRef,
    importantMarkersRef,
  };
};

