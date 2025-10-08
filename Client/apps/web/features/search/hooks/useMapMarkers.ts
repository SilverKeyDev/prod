import { useRef, useCallback, useState } from "react";

import { renderMapPropertyCard, cleanupMapPropertyCard } from "../../../components/cards";
import type { Property } from "../../../../../packages/schemas/property";
import type { SearchResult } from "../../../../../packages/schemas/search";
import type { IsochroneData } from "../../../../../packages/schemas/api";
import { renderImportantLocationMarkers } from "../lib/importantLocationRenderer";

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
}



type UseMapMarkersProps = {
  googleMapRef: React.RefObject<GoogleMap>;
  currentPage: number;
  propertiesPerPage: number;
  isochroneData: unknown;
  setIsochroneData: (data: unknown) => void;
  fetchIsochroneForMapOnly: () => Promise<unknown>;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string) => boolean;
  saveHome: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome: (propertyId: string) => Promise<void>;
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
  isHomeSaved,
  saveHome,
  removeSavedHome,
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
          cleanupMapPropertyCard(markerWithContent.content);
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
      
      console.log("📍 [MARKER POSITION UPDATE] Starting marker update:", {
        currentPage,
        totalResults: results.length,
        paginatedCount: paginatedData.length,
        firstPropertyPosition: paginatedData[0] ? { lat: paginatedData[0].lat, lng: paginatedData[0].lng, address: paginatedData[0].address } : null
      });

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
          
          console.log(`📍 [MARKER POSITION UPDATE] Creating marker ${i + 1}/${data.length}:`, {
            id: result.id,
            address: result.address,
            position: { lat: result.lat, lng: result.lng },
            price: result.price
          });

          const score = calculatePropertyScore(result);
          const isSaved = isHomeSaved(result.id);

          // Create marker container for MapPropertyCard
          const markerElement = document.createElement("div");
          markerElement.className = "property-location-marker";
          markerElement.style.cssText = `
            position: relative;
            transform: translate(-50%, -100%);
            z-index: 1000;
          `;

          // Convert SearchResult to MapPropertyCard format
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
            calculatedScore: score,
          };

          // Render MapPropertyCard directly into the marker element
          try {
            renderMapPropertyCard(markerElement, {
              property: propertyData,
              isSaved,
              onSave: () => saveHome(result),
              onUnsave: () => removeSavedHome(result.id),
              showScore: !isSaved, // Only show score for non-saved homes
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
            
            console.log(`✅ [MARKER POSITION UPDATE] Successfully created marker ${i + 1} at position:`, {
              lat: result.lat,
              lng: result.lng,
              address: result.address,
              markerId: result.id
            });
            
            markersRef.current.push(marker);
          } catch (error) {
            console.error(`❌ [MARKER POSITION UPDATE] Error creating marker for property ${i + 1}:`, error);
            // Clean up the marker element if marker creation fails
            cleanupMapPropertyCard(markerElement);
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
              const center = {
                lat: firstProperty.lat + 0.002, // Offset slightly north
                lng: firstProperty.lng,
              };
              
              console.log("📍 [MARKER POSITION UPDATE] Setting map center to:", {
                center,
                firstPropertyAddress: firstProperty.address,
                totalMarkersCreated: markersRef.current.length
              });
              
              googleMapRef.current.setCenter(center);
              googleMapRef.current.setZoom(13);
            }
          }
          
          console.log("✅ [MARKER POSITION UPDATE] Marker update completed:", {
            totalMarkers: markersRef.current.length,
            currentPage,
            propertiesPerPage
          });
          
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

