import { useRef, useCallback, useState } from "react";

import { renderMapPropertyCard } from "../../../components/cards";
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

interface PropertyOverlayInterface {
  setMap: (map: GoogleMap | null) => void;
  onAdd: () => void;
  onRemove: () => void;
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
      if (!googleMapRef.current) return;

      // Validate data before passing to render function
      if (!data || typeof data !== "object") {
        if (console && typeof console.warn === "function") {
          console.warn("Invalid isochrone data for rendering markers");
        }
        return;
      }

      // Type guard to ensure data has required IsochroneData properties
      const isochroneData = data as IsochroneData;
      if (!isochroneData.center || !isochroneData.locations) {
        if (console && typeof console.warn === "function") {
          console.warn(
            "Invalid isochrone data structure for rendering markers",
          );
        }
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

  // Marker color calculation based on property score
  const getScoreBasedPinColor = (score: number) => {
    const normalizedScore = Math.max(0, Math.min(100, score)) / 100;

    const highColor = { r: 123, g: 158, b: 124 }; // #7B9E7C
    const midColor = { r: 240, g: 233, b: 210 }; // #F0E9D2
    const lowColor = { r: 216, g: 140, b: 140 }; // #D88C8C

    let r: number, g: number, b: number;

    if (normalizedScore >= 0.5) {
      const t = (normalizedScore - 0.5) * 2;
      r = Math.round(midColor.r + (highColor.r - midColor.r) * t);
      g = Math.round(midColor.g + (highColor.g - midColor.g) * t);
      b = Math.round(midColor.b + (highColor.b - midColor.b) * t);
    } else {
      const t = normalizedScore * 2;
      r = Math.round(lowColor.r + (midColor.r - lowColor.r) * t);
      g = Math.round(lowColor.g + (midColor.g - lowColor.g) * t);
      b = Math.round(lowColor.b + (midColor.b - lowColor.b) * t);
    }

    const fillColor = `rgb(${r}, ${g}, ${b})`;
    const strokeColor = `rgb(${Math.round(r * 0.75)}, ${Math.round(
      g * 0.75,
    )}, ${Math.round(b * 0.75)})`;

    return { fillColor, strokeColor };
  };

  // Factory function to create PropertyOverlay class when Google Maps is loaded
  const createPropertyOverlayClass = () => {
    if (!window.google?.maps?.OverlayView) {
      return null;
    }

    class PropertyOverlay implements PropertyOverlayInterface {
      private div: HTMLElement;
      private position: { lat: number; lng: number };
      private map: GoogleMap | null;

      constructor(position: { lat: number; lng: number }, content: HTMLElement) {
        this.position = position;
        this.div = content;
        this.map = null;
      }

      setMap(map: GoogleMap | null) {
        this.map = map;
        if (map) {
          this.onAdd();
        } else {
          this.onRemove();
        }
      }

      onAdd(): void {
        // Simple implementation without Google Maps API dependencies
        if (this.map && this.map.getDiv) {
          const mapDiv = this.map.getDiv();
          if (mapDiv) {
            mapDiv.appendChild(this.div);
          }
        }
      }

      draw(): void {
        // Simple positioning without Google Maps API dependencies
        if (this.position && this.div) {
          this.div.style.position = 'absolute';
          this.div.style.left = '50%';
          this.div.style.top = '50%';
          this.div.style.transform = 'translate(-50%, -50%)';
        }
      }

      onRemove(): void {
        if (this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
        }
      }
    }

    return PropertyOverlay as new (position: { lat: number; lng: number }, content: HTMLElement) => PropertyOverlayInterface;
  };

  // Update map markers with search results
  const updateMapMarkers = useCallback(
    async (results: SearchResult[]) => {
      if (!googleMapRef.current || isUpdatingMarkers) {
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
        console.warn(
          "❌ AdvancedMarkerElement not available, skipping marker update",
        );
        console.warn("Google Maps API status:", {
          google: !!window.google,
          maps: !!window.google?.maps,
          marker: !!window.google?.maps?.marker,
          AdvancedMarkerElement: !!window.google?.maps?.marker?.AdvancedMarkerElement,
        });
        setIsUpdatingMarkers(false);
        return;
      }

      // Additional safety check for OverlayView
      if (!window.google?.maps?.OverlayView) {
        console.warn(
          "❌ OverlayView not available, property overlays will not be rendered",
        );
      }

      const googleMaps = (window as { google: { maps: { marker: { AdvancedMarkerElement: new (options: {
        map: GoogleMap;
        position: { lat: number; lng: number };
        title: string;
        content: HTMLElement;
      }) => GoogleAdvancedMarkerElement } } } }).google;
      const { AdvancedMarkerElement } = googleMaps.maps.marker;

      // Create markers for each property with performance optimization
      // Use requestAnimationFrame for better performance with large datasets
      const createMarkersBatch = (data: SearchResult[], startIndex = 0) => {
        const batchSize = 10; // Process markers in batches
        const endIndex = Math.min(startIndex + batchSize, data.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const result = data[i];
        const score = calculatePropertyScore(result);
        const { fillColor } = getScoreBasedPinColor(score);
        const isSaved = isHomeSaved(result.id);

        // Create marker box with triangle pointer (similar to important locations)
        const markerElement = document.createElement("div");
        markerElement.className = "property-location-marker";

        // Format price for display
        const formattedPrice =
          result.price && typeof result.price === "number"
            ? `$${(result.price / 1000).toFixed(0)}k`
            : "Price N/A";

        markerElement.innerHTML = `
        <div style="
          padding: 3px 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${fillColor};
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          white-space: nowrap;
          ${isSaved ? "border: 2px solid #4A90E2;" : ""}
        ">
          <div style="
            color: #2C3E50; 
            font-size: 10px; 
            font-weight: 600;
            text-shadow: 0 1px 1px rgba(255,255,255,0.8);
          ">${formattedPrice}</div>
          
          <!-- Triangle pointer -->
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${fillColor};
          "></div>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(0, 0, 0, 0.2);
          "></div>
        </div>
      `;

        markerElement.style.cssText = `
        position: relative;
        transform: translate(-50%, -100%);
      `;

        // Create the marker
        const marker = new AdvancedMarkerElement({
          map: googleMapRef.current!,
          position: { lat: result.lat, lng: result.lng },
          title: result.address,
          content: markerElement,
        });

        // Create property overlay using MapPropertyCard component
        const overlayDiv = document.createElement("div");
        overlayDiv.style.cssText = `
        position: absolute;
        transform: translate(-50%, -100%);
        margin-top: -8px;
        z-index: 1000;
        pointer-events: auto;
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

        // Render MapPropertyCard into the overlay div
        (
          renderMapPropertyCard as (
            element: HTMLElement,
            props: Record<string, unknown>,
          ) => void
        )(overlayDiv, {
          property: propertyData,
          isSaved,
          onSave: () => saveHome(result),
          onUnsave: () => removeSavedHome(result.id),
          showScore: !isSaved, // Only show score for non-saved homes
        });

        const position = { lat: result.lat, lng: result.lng };
        const PropertyOverlayClass = createPropertyOverlayClass();
        let overlay: PropertyOverlayInterface | null = null;
        if (PropertyOverlayClass) {
          overlay = new PropertyOverlayClass(position, overlayDiv);
          if (
            overlay &&
            typeof overlay === "object" &&
            overlay !== null &&
            "setMap" in overlay &&
            typeof overlay.setMap === "function"
          ) {
            overlay.setMap(googleMapRef.current);
          }
        }

        // Store overlay reference for cleanup
        if (overlay) {
          const markerWithOverlay = marker as unknown as { overlay: PropertyOverlayInterface };
          markerWithOverlay.overlay = overlay;
        }
        markersRef.current.push(marker);
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

