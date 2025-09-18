import { useCallback, useRef, useEffect } from 'react';
import { renderMapPropertyCard } from '../../../../components/cards/MapPropertyCardUtils';
import type { PropertyDetails } from '../../../../core/schemas/search';

export interface UseOptimizedMarkerUpdatesParams {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  isHomeSaved: (propertyId: string) => boolean;
  saveHome: (property: PropertyDetails) => Promise<void>;
  removeSavedHome: (propertyId: string) => Promise<void>;
  activeTab: 'results' | 'saved';
  currentPage: number;
  perPage?: number;
  isMobile?: boolean;
  hasSearched: boolean; // unused here
  showPropertyModals: boolean; // ignored for marker rendering; markers always reflect active tab
  searchResults: PropertyDetails[];
  savedHomes: PropertyDetails[];
  savedAddresses?: Set<string>;
}

export function useOptimizedMarkerUpdates({
  googleMapRef,
  isHomeSaved,
  saveHome,
  removeSavedHome,
  activeTab,
  currentPage,
  perPage: _perPage = 1,
  isMobile: _isMobile = false,
  showPropertyModals,
  searchResults,
  savedHomes,
  savedAddresses,
}: UseOptimizedMarkerUpdatesParams) {
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Keep latest helpers in refs to avoid recreating callbacks
  const isHomeSavedRef = useRef(isHomeSaved);
  const saveHomeRef = useRef(saveHome);
  const removeSavedHomeRef = useRef(removeSavedHome);
  useEffect(() => { isHomeSavedRef.current = isHomeSaved; }, [isHomeSaved]);
  useEffect(() => { saveHomeRef.current = saveHome; }, [saveHome]);
  useEffect(() => { removeSavedHomeRef.current = removeSavedHome; }, [removeSavedHome]);

  // Update markers - matching legacy implementation exactly
  const updateMapMarkers = useCallback(async (results: PropertyDetails[]) => {
    if (!googleMapRef.current) {
      console.log("🗺️ [MARKER_DEBUG] No map reference available");
      return;
    }

    console.log("🗺️ [MARKER_DEBUG] Starting marker update for", results.length, "results");

    // Clear existing HOME markers and overlays (but preserve important location markers)
    markersRef.current.forEach((marker) => {
      marker.map = null;
      // Also remove the overlay if it exists
      if ((marker as any).overlay) {
        (marker as any).overlay.setMap(null);
      }
    });
    markersRef.current = [];

    // Check if Google Maps API and AdvancedMarkerElement are available
    if (!window.google || !window.google.maps || !window.google.maps.marker) {
      console.warn(
        "⚠️ Google Maps API or AdvancedMarkerElement not available yet"
      );
      return;
    }

    const { AdvancedMarkerElement } = window.google.maps.marker;

    results.forEach((result, index) => {
      console.log(`🗺️ [MARKER_DEBUG] Creating marker ${index + 1}/${results.length} for property:`, {
        id: result.id,
        address: result.address,
        lat: result.lat,
        lng: result.lng
      });

      const isSaved = isHomeSavedRef.current(result.id);

      // Create custom marker element for AdvancedMarkerElement
      const markerElement = document.createElement("div");
      markerElement.style.cssText = `
        width: 24px;
        height: 32px;
        cursor: pointer;
      `;

      // Create the marker
      const marker = new AdvancedMarkerElement({
        map: googleMapRef.current,
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

      // Convert PropertyDetails to MapPropertyCard format
      const propertyData = {
        id: result.id,
        address: result.address,
        price: typeof result.price === 'string' ? result.price : result.price.toString(),
        bedrooms: result.bedrooms,
        bathrooms: result.bathrooms,
        sqft: result.sqft,
        lotSize: result.lotSize,
        propertyType: result.propertyType,
        lat: result.lat,
        lng: result.lng,
        imageUrl: result.imageUrl,
        calculatedScore: result._score || 0,
      };

      // Render MapPropertyCard into the overlay div
      renderMapPropertyCard(overlayDiv, {
        property: propertyData,
        isSaved: isSaved,
        onSave: () => saveHomeRef.current(result),
        onUnsave: () => removeSavedHomeRef.current(result.id),
        showScore: !isSaved, // Only show score for non-saved homes
        isMobile: _isMobile,
        savedAddresses: savedAddresses,
        activeTab: activeTab,
        isHomeSaved: isHomeSavedRef.current, // Pass the actual function
      });

      // Create custom overlay
      class PropertyOverlay extends google.maps.OverlayView {
        private div: HTMLElement;
        private position: google.maps.LatLng;

        constructor(position: google.maps.LatLng, content: HTMLElement) {
          super();
          this.position = position;
          this.div = content;
        }

        onAdd() {
          const panes = this.getPanes();
          if (panes) {
            panes.overlayMouseTarget.appendChild(this.div);
          }
        }

        draw() {
          const projection = this.getProjection();
          if (projection) {
            const point = projection.fromLatLngToDivPixel(this.position);
            if (point) {
              this.div.style.left = point.x + "px";
              this.div.style.top = point.y + "px";
            }
          }
        }

        onRemove() {
          if (this.div.parentNode) {
            this.div.parentNode.removeChild(this.div);
          }
        }
      }

      const overlay = new PropertyOverlay(
        new google.maps.LatLng(result.lat, result.lng),
        overlayDiv
      );
      overlay.setMap(googleMapRef.current);

      // Store overlay reference for cleanup
      (marker as any).overlay = overlay;
      markersRef.current.push(marker);
    });

    console.log("🗺️ [MARKER_DEBUG] Marker creation complete:", {
      totalMarkersCreated: markersRef.current.length,
      expectedCount: results.length,
    });
  }, [googleMapRef]);

  // Direct useEffect matching legacy behavior exactly
  useEffect(() => {
    if (googleMapRef.current && showPropertyModals) {
      // Show only the currently selected property marker
      const allData = activeTab === "results" ? searchResults : savedHomes;
      const currentProperty = allData[currentPage];
      if (currentProperty) {
        updateMapMarkers([currentProperty]); // Show only current property
      } else {
        updateMapMarkers([]); // Clear markers if no current property
      }
    } else if (googleMapRef.current && !showPropertyModals) {
      // Clear all markers when property modals should not be shown
      markersRef.current.forEach((marker) => {
        marker.map = null;
        if ((marker as any).overlay) {
          (marker as any).overlay.setMap(null);
        }
      });
      markersRef.current = [];
    }
  }, [activeTab, currentPage, showPropertyModals, searchResults, savedHomes, updateMapMarkers]);
}