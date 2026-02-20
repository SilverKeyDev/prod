import { useCallback, useRef, useState } from "react";

import type { SearchResult } from "packages/hooks/schemas";
import type { IsochroneData } from "packages/hooks/schemas/api";
import { renderImportantLocationMarkers } from "packages/utils/domain/search/importantLocationRenderer";

import { clearMapMarkers } from "./clearMarkers";
import { addFocusedCardMarker } from "./focusedCardMarker";
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
  googleMapRef,
  currentPage,
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
          if (googleMapRef.current) googleMapRef.current.setZoom(13);
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
          addFocusedCardMarker(results, currentPage, {
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
            onComplete: () => setIsUpdatingMarkers(false),
          });
        },
      });
    },
    [
      googleMapRef,
      currentPage,
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
