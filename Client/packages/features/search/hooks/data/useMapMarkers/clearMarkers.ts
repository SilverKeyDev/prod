import type { GoogleAdvancedMarkerElement, GoogleMap } from "./types";

type MarkersRef = { current: GoogleAdvancedMarkerElement[] };

/** Detach one advanced marker and optionally unmount React map card content. */
export function teardownAdvancedMarker(
  marker: GoogleAdvancedMarkerElement,
  cleanupMapPropertyCard?: (container: HTMLElement) => void,
): void {
  if (!marker || typeof marker !== "object") return;

  const markerWithContent = marker as unknown as {
    content?: HTMLElement;
  };
  if (
    markerWithContent.content &&
    markerWithContent.content instanceof HTMLElement
  ) {
    if (
      (markerWithContent.content as HTMLElement).dataset?.markerType !== "pin"
    ) {
      if (cleanupMapPropertyCard) {
        setTimeout(() => {
          cleanupMapPropertyCard(markerWithContent.content!);
        }, 0);
      }
    }
  }

  if ("map" in marker) {
    const markerWithMap = marker as { map: GoogleMap | null };
    markerWithMap.map = null;
  }

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
    if (typeof markerWithOverlay.overlay.onRemove === "function") {
      markerWithOverlay.overlay.onRemove();
    }
    if (typeof markerWithOverlay.overlay.setMap === "function") {
      markerWithOverlay.overlay.setMap(null);
    }
  }
}

/** Remove only floating preview card markers; keep pin markers for incremental sync. */
export function removeCardMarkersOnly(
  markersRef: MarkersRef,
  cleanupMapPropertyCard: (container: HTMLElement) => void,
): void {
  const keep: GoogleAdvancedMarkerElement[] = [];
  for (const marker of markersRef.current) {
    const content = (marker as unknown as { content?: HTMLElement }).content;
    if (content?.dataset?.markerType === "card") {
      teardownAdvancedMarker(marker, cleanupMapPropertyCard);
    } else {
      keep.push(marker);
    }
  }
  markersRef.current = keep;
}

export function clearMapMarkers(
  markersRef: MarkersRef,
  importantMarkersRef: MarkersRef,
  cleanupMapPropertyCard: (container: HTMLElement) => void,
): void {
  markersRef.current.forEach((marker) => {
    teardownAdvancedMarker(marker, cleanupMapPropertyCard);
  });
  markersRef.current = [];

  importantMarkersRef.current.forEach((marker) => {
    if (marker && typeof marker === "object" && "map" in marker) {
      const markerWithMap = marker as { map: GoogleMap | null };
      markerWithMap.map = null;
    }
  });
  importantMarkersRef.current = [];
}
