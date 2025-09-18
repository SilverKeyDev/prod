import { useCallback } from 'react';

import type { PropertyDetails } from '../../../core/schemas/search';
import { cacheUtils } from '../hooks/unifiedCache';

export type MapZoomControllerProps = {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  activeTab: string;
  searchResults: PropertyDetails[];
  savedHomes: PropertyDetails[];
  currentPage: number;
  hasSearched: boolean;
};

export const DEFAULT_ZOOM = 13;

// Smooth zoom animation function using Google Maps animation
const smoothZoomTo = (map: google.maps.Map, targetZoom: number, duration: number = 1000) => {
  const startZoom = map.getZoom() || DEFAULT_ZOOM;
  
  // If already at target zoom, no need to animate
  if (Math.abs(startZoom - targetZoom) < 0.1) {
    return;
  }
  
  // Use Google Maps' built-in animation for smoother results
  const zoomSteps = Math.abs(targetZoom - startZoom);
  const stepDuration = Math.max(duration / zoomSteps, 100); // Minimum 100ms per step
  
  let currentStep = 0;
  const totalSteps = Math.ceil(zoomSteps);
  const stepSize = (targetZoom - startZoom) / totalSteps;
  
  const animateStep = () => {
    if (currentStep < totalSteps) {
      const newZoom = startZoom + (stepSize * (currentStep + 1));
      map.setZoom(newZoom);
      currentStep++;
      
      setTimeout(animateStep, stepDuration);
    } else {
      // Ensure we end exactly at the target zoom
      map.setZoom(targetZoom);
    }
  };
  
  animateStep();
};

export const useMapZoomController = ({
  googleMapRef,
  activeTab,
  searchResults,
  savedHomes,
  currentPage,
  hasSearched,
}: MapZoomControllerProps) => {
  // Calculate map center positioned slightly above the property marker
  const calculateMapCenter = useCallback(() => {
    if (!googleMapRef.current) {
      console.warn('🗺️ [MAP_ZOOM_CONTROLLER] calculateMapCenter: Google map ref not available');
      return null;
    }

    const currentData = activeTab === 'results' ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];

    // If we have a current property, center slightly above it
    if (currentProperty?.lat && currentProperty?.lng) {
      // Offset the latitude slightly north to position map above the marker
      // At zoom level 13, approximately 0.002 degrees latitude = ~220 meters
      const latOffset = 0.002;

      return {
        lat: currentProperty.lat + latOffset,
        lng: currentProperty.lng,
      };
    }

    // Fallback to isochrone center if no property center is available
    try {
      const cachedIsochroneData = cacheUtils.getCachedIsochroneData('1.0');
      if (cachedIsochroneData?.center?.lat && cachedIsochroneData?.center?.lon) {
        return {
          lat: cachedIsochroneData.center.lat,
          lng: cachedIsochroneData.center.lon,
        };
    }
    } catch (error) {
      console.warn('🗺️ [MAP_ZOOM_CONTROLLER] Failed to get cached isochrone data:', error);
    }

    // Only log warning if this is an unexpected scenario (e.g., results tab with no data after search)
    const isUnexpectedScenario = activeTab === 'results' && searchResults.length === 0 && hasSearched;
    if (isUnexpectedScenario) {
      console.warn('🗺️ [MAP_ZOOM_CONTROLLER] No center calculated - unexpected scenario:', {
        activeTab,
        currentPage,
        hasCurrentProperty: !!currentProperty,
        currentPropertyCoords: currentProperty ? { lat: currentProperty.lat, lng: currentProperty.lng } : null,
        searchResultsCount: searchResults.length,
        savedHomesCount: savedHomes.length
      });
    }

    return null;
  }, [activeTab, searchResults, savedHomes, currentPage, googleMapRef, hasSearched]);

  // Focus map on current property with smooth animation
  const focusOnCurrentProperty = useCallback(() => {
    if (!googleMapRef.current) return;

    const center = calculateMapCenter();
    if (center) {
      console.log('🗺️ [MAP_FOCUS] Focusing on property with smooth animation:', {
        center,
        currentZoom: googleMapRef.current.getZoom(),
        targetZoom: DEFAULT_ZOOM
      });
      
      // Use smooth panning and zooming for better UX
      googleMapRef.current.panTo(center);
      smoothZoomTo(googleMapRef.current, DEFAULT_ZOOM, 800); // 800ms smooth zoom
    } else {
      // Only log warning if this is an unexpected scenario
      const currentData = activeTab === 'results' ? searchResults : savedHomes;
      const currentProperty = currentData[currentPage];
      const isUnexpectedScenario = activeTab === 'results' && searchResults.length === 0 && hasSearched;
      
      if (isUnexpectedScenario) {
        console.warn('🗺️ [MAP_ZOOM_CONTROLLER] focusOnCurrentProperty called but no center calculated:', {
          hasGoogleMapRef: !!googleMapRef.current,
          activeTab,
          currentPage,
          hasCurrentProperty: !!currentProperty,
          currentPropertyCoords: currentProperty ? { lat: currentProperty.lat, lng: currentProperty.lng } : null,
          searchResultsCount: searchResults.length,
          savedHomesCount: savedHomes.length,
          hasCachedIsochrone: !!cacheUtils.getCachedIsochroneData('1.0')
        });
      }
      
      // Don't throw an error - just skip the focus operation
      // The map will remain at its current position
    }
  }, [calculateMapCenter, googleMapRef, activeTab, searchResults, savedHomes, currentPage]);

  const resetToDefaultZoom = useCallback(() => {
    if (!googleMapRef.current) return;

    // Always focus on current property and set default zoom
    focusOnCurrentProperty();
  }, [focusOnCurrentProperty, googleMapRef]);

  const zoomIn = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() ?? DEFAULT_ZOOM;
      smoothZoomTo(googleMapRef.current, currentZoom + 1, 400); // 400ms smooth zoom
    }
  }, [googleMapRef]);

  const zoomOut = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() ?? DEFAULT_ZOOM;
      smoothZoomTo(googleMapRef.current, currentZoom - 1, 400); // 400ms smooth zoom
    }
  }, [googleMapRef]);

  return {
    resetToDefaultZoom,
    zoomIn,
    zoomOut,
    focusOnCurrentProperty,
    calculateMapCenter,
  };
};
