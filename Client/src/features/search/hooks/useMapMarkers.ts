import { useRef, useCallback, useState } from 'react';
import { SearchResult } from '../../../types/search';
import { Property } from '../../../types/property';
import { renderMapPropertyCard } from '../../../components/cards/MapPropertyCard';
import { renderImportantLocationMarkers } from '../lib/importantLocationRenderer';

interface UseMapMarkersProps {
  googleMapRef: React.RefObject<google.maps.Map | null>;
  currentPage: number;
  propertiesPerPage: number;
  isochroneData: any;
  setIsochroneData: (data: any) => void;
  fetchIsochroneForMapOnly: () => Promise<any>;
  calculatePropertyScore: (property: SearchResult) => number;
  isHomeSaved: (propertyId: string) => boolean;
  saveHome: (property: SearchResult | Property) => Promise<void>;
  removeSavedHome: (propertyId: string) => Promise<void>;
}

interface UseMapMarkersReturn {
  updateMapMarkers: (results: SearchResult[]) => Promise<void>;
  clearMapMarkers: () => void;
  isUpdatingMarkers: boolean;
  markersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>;
  importantMarkersRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement[]>;
}

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
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const importantMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false);

  // Handle rendering important location markers
  const handleRenderImportantLocationMarkers = useCallback(async (data: any) => {
    if (!googleMapRef.current) return;

    // Render new important location markers with correct parameters
    await renderImportantLocationMarkers(data, {
      map: googleMapRef.current,
      importantMarkersRef,
      setImportantLocationMarkers: (markers) => {
        importantMarkersRef.current = markers;
      },
      resetToDefaultZoom: () => {
        // Default zoom reset - can be overridden by parent
        if (googleMapRef.current) {
          googleMapRef.current.setZoom(13);
        }
      },
    });
  }, [googleMapRef]);

  // Clear all markers from the map
  const clearMapMarkers = useCallback(() => {
    // Clear property markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
      if ((marker as any).overlay) {
        (marker as any).overlay.setMap(null);
      }
    });
    markersRef.current = [];

    // Clear important location markers
    importantMarkersRef.current.forEach((marker) => {
      marker.map = null;
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
      g * 0.75
    )}, ${Math.round(b * 0.75)})`;

    return { fillColor, strokeColor };
  };

  // Factory function to create PropertyOverlay class when Google Maps is loaded
  const createPropertyOverlayClass = () => {
    if (!window.google?.maps?.OverlayView) {
      return null;
    }

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

    return PropertyOverlay;
  };

  // Update map markers with search results
  const updateMapMarkers = useCallback(async (results: SearchResult[]) => {
    if (!googleMapRef.current || isUpdatingMarkers) {
      return;
    }
    
    setIsUpdatingMarkers(true);

    // Clear existing markers
    clearMapMarkers();

    // Re-render important location markers FIRST (so they appear behind home markers)
    if (isochroneData) {
      await handleRenderImportantLocationMarkers(isochroneData);
    } else {
      const data = await fetchIsochroneForMapOnly();
      if (data) {
        setIsochroneData(data);
        await handleRenderImportantLocationMarkers(data);
      }
    }

    // Paginate the results - only show propertiesPerPage at a time
    const startIndex = currentPage * propertiesPerPage;
    const endIndex = startIndex + propertiesPerPage;
    const paginatedData = results.slice(startIndex, endIndex);

    // Check if Google Maps API and AdvancedMarkerElement are available
    if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
      console.warn("❌ AdvancedMarkerElement not available, skipping marker update");
      setIsUpdatingMarkers(false);
      return;
    }

    const { AdvancedMarkerElement } = window.google.maps.marker;

    // Create markers for each property
    paginatedData.forEach((result) => {
      const score = calculatePropertyScore(result);
      const { fillColor } = getScoreBasedPinColor(score);
      const isSaved = isHomeSaved(result.id);

      // Create marker box with triangle pointer (similar to important locations)
      const markerElement = document.createElement('div');
      markerElement.className = 'property-location-marker';
      
      // Format price for display
      const formattedPrice = result.price && typeof result.price === 'number' ? `$${(result.price / 1000).toFixed(0)}k` : 'Price N/A';
      
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
          ${isSaved ? 'border: 2px solid #4A90E2;' : ''}
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
      renderMapPropertyCard(overlayDiv, {
        property: propertyData,
        isSaved: isSaved,
        onSave: () => saveHome(result),
        onUnsave: () => removeSavedHome(result.id),
        showScore: !isSaved, // Only show score for non-saved homes
      });

      const position = new google.maps.LatLng(result.lat, result.lng);
      const PropertyOverlayClass = createPropertyOverlayClass();
      let overlay: any = null;
      if (PropertyOverlayClass) {
        overlay = new PropertyOverlayClass(position, overlayDiv);
        overlay.setMap(googleMapRef.current);
      }

      // Store overlay reference for cleanup
      if (overlay) {
        (marker as any).overlay = overlay;
      }
      markersRef.current.push(marker);
    });

    // Fit map to show current page markers with adaptive zoom
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
  }, [
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
  ]);

  return {
    updateMapMarkers,
    clearMapMarkers,
    isUpdatingMarkers,
    markersRef,
    importantMarkersRef,
  };
};
