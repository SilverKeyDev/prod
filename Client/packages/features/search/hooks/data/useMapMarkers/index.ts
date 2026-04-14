import { useCallback, useRef, useState } from "react";

import { renderImportantLocationMarkers } from "packages/features/search/types/search/importantLocationRenderer";
import { resetMapToListingFocusZoom } from "packages/features/search/utils/googleMaps/mapCamera";
import type { SearchResult } from "packages/types";
import type { IsochroneData } from "packages/types/api";

import { clearMapMarkers } from "./clearMarkers";
import { addFocusedCardMarkers } from "./focusedCardMarker";
import { createPinMarkersBatch } from "./pinMarkers";
import type {
  GoogleAdvancedMarkerElement,
  UseMapMarkersProps,
  UseMapMarkersReturn,
} from "./types";
import {
  centerMapOnFocusedProperty,
  ensureIsochroneAndRender,
  getAdvancedMarkerElement,
} from "./updateMarkersHelpers";

export type { MapPropertyCardRenderProps, UseMapMarkersProps } from "./types";

export const useMapMarkers = ({
  activeTab,
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
  contextKey,
  renderMapPropertyCard,
  cleanupMapPropertyCard,
  mapListingPreviewsEnabled = true,
  dismissedMapPreviewIds = [],
  onDismissMapPreview,
}: UseMapMarkersProps): UseMapMarkersReturn => {
  const markersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const importantMarkersRef = useRef<GoogleAdvancedMarkerElement[]>([]);
  const [isUpdatingMarkers, setIsUpdatingMarkers] = useState(false);

  const handleRenderImportantLocationMarkers = useCallback(
    (data: unknown) => {
      if (!googleMapRef.current) return;
      if (!data || typeof data !== "object") return;
      const typed = data as IsochroneData;
      if (!typed.center || !typed.locations) return;
      renderImportantLocationMarkers(typed, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (markers) => {
          if (Array.isArray(markers)) importantMarkersRef.current = markers;
        },
        resetToDefaultZoom: () => {
          if (googleMapRef.current) {
            resetMapToListingFocusZoom(googleMapRef.current);
          }
        },
      });
    },
    [googleMapRef],
  );

  const clearMapMarkersCallback = useCallback(() => {
    clearMapMarkers(markersRef, importantMarkersRef, cleanupMapPropertyCard);
  }, [cleanupMapPropertyCard]);

  const updateMapMarkers = useCallback(
    async (results: SearchResult[]) => {
      if (!googleMapRef.current || isUpdatingMarkers) return;
      const count = results?.length || 0;
      if (count === 0) {
        clearMapMarkersCallback();
        setIsUpdatingMarkers(false);
        return;
      }
      setIsUpdatingMarkers(true);
      clearMapMarkersCallback();
      await ensureIsochroneAndRender({
        isochroneData,
        setIsochroneData,
        fetchIsochroneForMapOnly,
        onRenderImportant: handleRenderImportantLocationMarkers,
      });
      centerMapOnFocusedProperty(results, currentPage, googleMapRef);
      const AdvancedMarkerElement = getAdvancedMarkerElement();
      if (!AdvancedMarkerElement) {
        setIsUpdatingMarkers(false);
        return;
      }
      void createPinMarkersBatch(results, {
        map: googleMapRef.current as google.maps.Map,
        markersRef,
        AdvancedMarkerElement,
        calculatePropertyScore,
        onMarkerClick,
        onBatchComplete: () => {
          if (!mapListingPreviewsEnabled) {
            setIsUpdatingMarkers(false);
            return;
          }
          const dismissedPreviewIds = new Set(dismissedMapPreviewIds);
          addFocusedCardMarkers(results, currentPage, propertiesPerPage, {
            activeTab,
            map: googleMapRef.current! as google.maps.Map,
            markersRef,
            AdvancedMarkerElement,
            renderMapPropertyCard,
            cleanupMapPropertyCard,
            calculatePropertyScore,
            isHomeSaved,
            saveHome,
            removeSavedHome,
            onMarkerClick,
            onUnlockClick,
            contextKey,
            dismissedPreviewIds,
            onDismissMapPreview,
            onComplete: () => setIsUpdatingMarkers(false),
          });
        },
      });
    },
    [
      activeTab,
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
      clearMapMarkersCallback,
      handleRenderImportantLocationMarkers,
      renderMapPropertyCard,
      cleanupMapPropertyCard,
      contextKey,
      mapListingPreviewsEnabled,
      dismissedMapPreviewIds,
      onDismissMapPreview,
    ],
  );

  return {
    updateMapMarkers,
    clearMapMarkers: clearMapMarkersCallback,
    isUpdatingMarkers,
    markersRef,
    importantMarkersRef,
  };
};
