import { useEffect, useRef } from "react";

import { color } from "packages/design-tokens";
import { log } from "packages/logger";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { Box } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import type { ViewingRouteMapPreviewProps } from "./ViewingRouteMapPreview";

export function ViewingRouteMapPreview({ legs }: ViewingRouteMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const linesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    const win = getWindow() as GoogleMapsWindow;
    if (!containerRef.current || !legs?.length || !win.google?.maps) {
      return;
    }

    const geometry = win.google.maps.geometry;
    if (!geometry?.encoding?.decodePath) {
      log.warn("HOOKS", "Maps geometry library missing for route preview");
      return;
    }

    const decodePath = geometry.encoding.decodePath.bind(geometry.encoding);
    const allPoints: google.maps.LatLngLiteral[] = [];

    for (const leg of legs) {
      const enc = leg.encoded_polyline;
      if (!enc) {
        continue;
      }
      try {
        const path = decodePath(enc);
        path.forEach((ll) => allPoints.push({ lat: ll.lat(), lng: ll.lng() }));
      } catch (e) {
        log.warn("ERRORS", "Polyline decode failed", e);
      }
    }

    if (allPoints.length === 0) {
      return;
    }

    const bounds = new win.google.maps.LatLngBounds();
    allPoints.forEach((p) => bounds.extend(p));

    if (!mapRef.current) {
      mapRef.current = new win.google.maps.Map(containerRef.current, {
        disableDefaultUI: true,
        zoom: 12,
      });
    }
    const map = mapRef.current;
    map.fitBounds(bounds, 16);

    linesRef.current.forEach((p) => p.setMap(null));
    linesRef.current = [];

    for (const leg of legs) {
      const enc = leg.encoded_polyline;
      if (!enc) {
        continue;
      }
      try {
        const path = decodePath(enc);
        const segment: google.maps.LatLngLiteral[] = [];
        path.forEach((ll) => segment.push({ lat: ll.lat(), lng: ll.lng() }));
        if (segment.length === 0) {
          continue;
        }
        const poly = new win.google.maps.Polyline({
          path: segment,
          strokeColor: color("olive.DEFAULT"),
          strokeOpacity: 0.95,
          strokeWeight: 4,
          map,
        });
        linesRef.current.push(poly);
      } catch {
        /* skip leg */
      }
    }

    return () => {
      linesRef.current.forEach((p) => p.setMap(null));
      linesRef.current = [];
    };
  }, [legs]);

  if (!legs?.some((l) => l.encoded_polyline)) {
    return null;
  }

  return (
    <Box className="border-border mt-3 overflow-hidden rounded-lg border">
      <Box ref={containerRef} className="bg-background-muted h-48 w-full" aria-hidden />
    </Box>
  );
}
