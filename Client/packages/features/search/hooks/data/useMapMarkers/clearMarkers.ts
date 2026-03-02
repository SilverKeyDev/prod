import type { GoogleAdvancedMarkerElement, GoogleMap } from "./types";

type MarkersRef = { current: GoogleAdvancedMarkerElement[] };

export function clearMapMarkers(
  markersRef: MarkersRef,
  importantMarkersRef: MarkersRef,
  cleanupMapPropertyCard: (container: HTMLElement) => void
): void {
  markersRef.current.forEach((marker) => {
    if (marker && typeof marker === "object") {
      const markerWithContent = marker as unknown as {
        content?: HTMLElement;
      };
      if (markerWithContent.content && markerWithContent.content instanceof HTMLElement) {
        if ((markerWithContent.content as HTMLElement).dataset?.markerType !== "pin") {
          setTimeout(() => {
            cleanupMapPropertyCard(markerWithContent.content!);
          }, 0);
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
      if (markerWithOverlay?.overlay && typeof markerWithOverlay.overlay === "object") {
        if (typeof markerWithOverlay.overlay.onRemove === "function") {
          markerWithOverlay.overlay.onRemove();
        }
        if (typeof markerWithOverlay.overlay.setMap === "function") {
          markerWithOverlay.overlay.setMap(null);
        }
      }
    }
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
