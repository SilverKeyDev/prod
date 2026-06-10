import { useCallback, useRef, useState } from "react";

import { renderImportantLocationMarkers } from "packages/features/search/types/search/map/importantLocationRenderer";
import { resetMapToListingFocusZoom } from "packages/features/search/utils/googleMaps";
import { log } from "packages/logger";
import type { SearchResult } from "packages/types";
import type { IsochroneData } from "packages/types/domain/api";
import { getWindow } from "packages/utils/core/platform";

import { clearMapMarkers, removeCardMarkersOnly, teardownAdvancedMarker } from "./clearMarkers";
import { addFocusedCardMarkers } from "./focusedCardMarker";
import { createPinMarkersBatch } from "./pinMarkers";
import { removeOrphanPinsAndListMissingForPins } from "./pinMarkerSync";
import type { GoogleAdvancedMarkerElement, UseMapMarkersProps, UseMapMarkersReturn } from "./types";
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
  onMapPreviewNavigate,
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
    [googleMapRef]
  );

  const clearMapMarkersCallback = useCallback(() => {
    clearMapMarkers(markersRef, importantMarkersRef, cleanupMapPropertyCard);
  }, [cleanupMapPropertyCard]);

  const finishWithFocusedCards = useCallback(
    (
      results: SearchResult[],
      AdvancedMarkerElement: new (opts: {
        map: google.maps.Map;
        position: { lat: number; lng: number };
        title: string;
        content: HTMLElement;
        zIndex?: number | null;
      }) => GoogleAdvancedMarkerElement
    ) => {
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
        onMapPreviewNavigate,
        onUnlockClick,
        contextKey,
        dismissedPreviewIds,
        onDismissMapPreview,
        onComplete: () => setIsUpdatingMarkers(false),
      });
    },
    [
      activeTab,
      googleMapRef,
      currentPage,
      propertiesPerPage,
      renderMapPropertyCard,
      cleanupMapPropertyCard,
      calculatePropertyScore,
      isHomeSaved,
      saveHome,
      removeSavedHome,
      onMapPreviewNavigate,
      onUnlockClick,
      contextKey,
      dismissedMapPreviewIds,
      onDismissMapPreview,
      mapListingPreviewsEnabled,
    ]
  );

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

      const run = async () => {
        try {
          if (!googleMapRef.current) {
            setIsUpdatingMarkers(false);
            return;
          }
          await ensureIsochroneAndRender({
            isochroneData,
            setIsochroneData,
            fetchIsochroneForMapOnly,
            onRenderImportant: handleRenderImportantLocationMarkers,
          });
          centerMapOnFocusedProperty(results, currentPage, googleMapRef);
          const AdvancedMarkerElement = getAdvancedMarkerElement();
          if (!AdvancedMarkerElement || !googleMapRef.current) {
            setIsUpdatingMarkers(false);
            return;
          }

          removeCardMarkersOnly(markersRef, cleanupMapPropertyCard);
          const teardownPin = (m: GoogleAdvancedMarkerElement) => {
            teardownAdvancedMarker(m);
          };
          const missingPins = removeOrphanPinsAndListMissingForPins(
            markersRef,
            results,
            teardownPin
          );

          const pinBatchComplete = () => {
            finishWithFocusedCards(results, AdvancedMarkerElement);
          };

          if (missingPins.length === 0) {
            pinBatchComplete();
            return;
          }

          void createPinMarkersBatch(missingPins, {
            map: googleMapRef.current as google.maps.Map,
            markersRef,
            AdvancedMarkerElement,
            calculatePropertyScore,
            onMarkerClick,
            onBatchComplete: pinBatchComplete,
          });
        } catch (error: unknown) {
          log.error("MAP_RENDERING", "updateMapMarkers failed", error);
          setIsUpdatingMarkers(false);
        }
      };

      const win = getWindow();
      if (win && typeof win.requestIdleCallback === "function") {
        win.requestIdleCallback(
          () => {
            void run();
          },
          { timeout: 500 }
        );
      } else {
        void run();
      }
    },
    [
      googleMapRef,
      currentPage,
      isochroneData,
      setIsochroneData,
      fetchIsochroneForMapOnly,
      calculatePropertyScore,
      onMarkerClick,
      isUpdatingMarkers,
      clearMapMarkersCallback,
      handleRenderImportantLocationMarkers,
      cleanupMapPropertyCard,
      finishWithFocusedCards,
    ]
  );

  return {
    updateMapMarkers,
    clearMapMarkers: clearMapMarkersCallback,
    isUpdatingMarkers,
    markersRef,
    importantMarkersRef,
  };
};
