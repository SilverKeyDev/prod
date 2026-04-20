import { type MutableRefObject, type RefObject, useCallback, useRef } from "react";

import {
  clearImportantLocationMarkers,
  type GoogleAdvancedMarkerElement,
  renderImportantLocationMarkers,
} from "packages/features/search/types/search/map/importantLocationRenderer";
import {
  clearIsochroneOverlays,
  renderIsochronePolygon,
} from "packages/features/search/types/search/map/isochroneRenderer";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { IsochroneData } from "packages/types/domain/api";

type OverlayRefs = {
  googleMapRef: RefObject<google.maps.Map | null>;
  polygonRef: RefObject<google.maps.Polygon | null>;
  individualPolygonsRef: RefObject<google.maps.Polygon[]>;
  importantMarkersRef: MutableRefObject<GoogleAdvancedMarkerElement[]>;
  mapFocusOnCurrentProperty: () => void;
  resetToDefaultZoom: () => void;
  showCommuteOverlay: boolean;
};

export function useSearchPageMapOverlayRenderers({
  googleMapRef,
  polygonRef,
  individualPolygonsRef,
  importantMarkersRef,
  mapFocusOnCurrentProperty,
  resetToDefaultZoom,
  showCommuteOverlay,
}: OverlayRefs) {
  const showCommuteOverlayRef = useRef(showCommuteOverlay);
  showCommuteOverlayRef.current = showCommuteOverlay;

  const renderIsochronePolygonWrapper = useCallback(
    (
      data: unknown,
      options?: {
        /**
         * When true, draw `data` even if the commute overlay toggle is off.
         * Used for location bar / viewport polygons and preferences neighborhood bounds
         * (see useSearchMapOverlayData). Omit for commute isochrone priming, which must
         * stay hidden when commute overlay is disabled.
         */
        skipCommuteToggle?: boolean;
      }
    ) => {
      if (!googleMapRef.current) {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Google Map not initialized yet");
        return;
      }
      const map = googleMapRef.current;
      const overlayOpts = {
        map,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      };
      const skipCommuteToggle = options?.skipCommuteToggle === true;
      if (!showCommuteOverlayRef.current && !skipCommuteToggle) {
        clearIsochroneOverlays(overlayOpts);
        return;
      }
      if (data != null) {
        renderIsochronePolygon(data as IsochroneData, overlayOpts);
      } else {
        clearIsochroneOverlays(overlayOpts);
      }
    },
    [mapFocusOnCurrentProperty, googleMapRef, polygonRef, individualPolygonsRef]
  );

  const renderImportantLocationMarkersWrapper = useCallback(
    async (data: unknown) => {
      if (!googleMapRef.current) {
        log.warn(
          LOG_CATEGORIES.MAP_RENDERING,
          "Cannot render important location markers: map not available"
        );
        return;
      }
      if (!showCommuteOverlayRef.current) {
        clearImportantLocationMarkers(importantMarkersRef);
        return;
      }
      renderImportantLocationMarkers(data as IsochroneData, {
        map: googleMapRef.current,
        importantMarkersRef,
        setImportantLocationMarkers: (markers: GoogleAdvancedMarkerElement[]) => {
          importantMarkersRef.current = markers;
        },
        resetToDefaultZoom,
      });
    },
    [resetToDefaultZoom, googleMapRef, importantMarkersRef]
  );

  return {
    showCommuteOverlayRef,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
  };
}
