import { useEffect, useRef } from "react";

import type { MutableRefObject, RefObject } from "react";

import {
  clearImportantLocationMarkers,
  type GoogleAdvancedMarkerElement,
} from "packages/features/search/types/search/importantLocationRenderer";
import { clearIsochroneOverlays } from "packages/features/search/types/search/isochroneRenderer";
import type { IsochroneData } from "packages/types/api";

type Params = {
  isGoogleMapsLoaded: boolean;
  googleMapRef: RefObject<google.maps.Map | null>;
  displayIsochroneData: IsochroneData | null;
  locationSearchOverlayData: unknown;
  isochroneData: IsochroneData | null;
  showCommuteOverlay: boolean;
  polygonRef: RefObject<google.maps.Polygon | null>;
  individualPolygonsRef: RefObject<google.maps.Polygon[]>;
  importantMarkersRef: MutableRefObject<GoogleAdvancedMarkerElement[]>;
  mapFocusOnCurrentProperty: () => void;
  primeIsochroneOverlay: () => void | Promise<void>;
  renderIsochronePolygonWrapper: (
    data: unknown,
    options?: { skipCommuteToggle?: boolean },
  ) => void;
  renderImportantLocationMarkersWrapper: (
    data: unknown,
  ) => void | Promise<void>;
  /** When false, skip map-only isochrone fetch/render until explicit search (agents). */
  shouldPrimeIsochrone?: boolean;
};

export function useSearchPageMapDisplayOverlayEffect({
  isGoogleMapsLoaded,
  googleMapRef,
  displayIsochroneData,
  locationSearchOverlayData,
  isochroneData,
  showCommuteOverlay,
  polygonRef,
  individualPolygonsRef,
  importantMarkersRef,
  mapFocusOnCurrentProperty,
  primeIsochroneOverlay,
  renderIsochronePolygonWrapper,
  renderImportantLocationMarkersWrapper,
  shouldPrimeIsochrone = true,
}: Params) {
  const hasPrimedWithoutIsochroneData = useRef(false);

  useEffect(() => {
    if (!isGoogleMapsLoaded) return;
    if (!googleMapRef.current) return;

    if (displayIsochroneData) {
      renderIsochronePolygonWrapper(displayIsochroneData, {
        skipCommuteToggle: true,
      });
      if (
        showCommuteOverlay &&
        isochroneData?.locations &&
        isochroneData.locations.length > 0 &&
        locationSearchOverlayData == null
      ) {
        void renderImportantLocationMarkersWrapper(isochroneData);
      } else {
        clearImportantLocationMarkers(importantMarkersRef);
      }
      return;
    }

    if (googleMapRef.current) {
      clearIsochroneOverlays({
        map: googleMapRef.current,
        polygonRef,
        individualPolygonsRef,
        focusOnCurrentProperty: mapFocusOnCurrentProperty,
      });
      clearImportantLocationMarkers(importantMarkersRef);
    }

    if (
      shouldPrimeIsochrone &&
      !isochroneData &&
      !hasPrimedWithoutIsochroneData.current
    ) {
      hasPrimedWithoutIsochroneData.current = true;
      setTimeout(() => {
        void primeIsochroneOverlay();
      }, 100);
    }
  }, [
    isGoogleMapsLoaded,
    displayIsochroneData,
    locationSearchOverlayData,
    isochroneData,
    showCommuteOverlay,
    shouldPrimeIsochrone,
    googleMapRef,
    primeIsochroneOverlay,
    renderIsochronePolygonWrapper,
    renderImportantLocationMarkersWrapper,
    mapFocusOnCurrentProperty,
    importantMarkersRef,
    polygonRef,
    individualPolygonsRef,
  ]);
}
