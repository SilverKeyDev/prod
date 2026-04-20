import { useMemo } from "react";

import type { IsochroneData } from "packages/types/domain/api";
import { decodeGoogleEncodedPolyline } from "packages/utils/maps/decodeGoogleEncodedPolyline";
import { parseIsochroneForNativeMap } from "packages/utils/maps/parseIsochroneForNativeMap";
import { PROPERTY_COMMUTE_NATIVE_ROUTE_COLORS } from "packages/utils/maps/propertyCommuteNative.constants";
import type {
  IsochronePolygonsNative,
  NativeDestinationMarker,
  NativeRouteOverlay,
} from "packages/utils/maps/propertyCommuteNative.types";
import { commuteDestinationsForMap } from "packages/utils/propertyDetails/location/commuteMapDestinations";

type TravelTimeRow = {
  location_name?: string;
  name?: string;
  label?: string;
  location_address?: string;
  address?: string;
  travel_time?: string | number;
  commute_tolerance?: number;
  encoded_polyline?: string | null;
};

type UsePropertyCommuteNativeOverlaysParams = {
  travelTimes: TravelTimeRow[] | undefined;
  commuteSearchOverlay: IsochroneData | null;
};

export function usePropertyCommuteNativeOverlays({
  travelTimes,
  commuteSearchOverlay,
}: UsePropertyCommuteNativeOverlaysParams): {
  nativeRouteOverlays: NativeRouteOverlay[];
  destinationMarkers: NativeDestinationMarker[];
  isochronePolygons: IsochronePolygonsNative;
} {
  const mapDestinations = useMemo(
    () => commuteDestinationsForMap(travelTimes ?? []),
    [travelTimes]
  );

  const nativeRouteOverlays = useMemo((): NativeRouteOverlay[] => {
    const rows = travelTimes ?? [];
    const out: NativeRouteOverlay[] = [];
    for (let i = 0; i < rows.length; i++) {
      const enc = rows[i]?.encoded_polyline;
      if (typeof enc !== "string" || enc.length === 0) {
        continue;
      }
      const pts = decodeGoogleEncodedPolyline(enc);
      if (pts.length < 2) {
        continue;
      }
      out.push({
        key: `commute-route-${i}`,
        coordinates: pts,
        color:
          PROPERTY_COMMUTE_NATIVE_ROUTE_COLORS[i % PROPERTY_COMMUTE_NATIVE_ROUTE_COLORS.length],
      });
    }
    return out;
  }, [travelTimes]);

  const destinationMarkers = useMemo((): NativeDestinationMarker[] => {
    const rows = travelTimes ?? [];
    const markers: NativeDestinationMarker[] = [];
    for (let i = 0; i < rows.length; i++) {
      const enc = rows[i]?.encoded_polyline;
      const label =
        mapDestinations[i]?.label ??
        String(
          rows[i]?.location_name ??
            rows[i]?.label ??
            rows[i]?.name ??
            rows[i]?.address ??
            `Stop ${i + 1}`
        );
      if (typeof enc !== "string" || enc.length === 0) {
        continue;
      }
      const pts = decodeGoogleEncodedPolyline(enc);
      const last = pts[pts.length - 1];
      if (!last) {
        continue;
      }
      markers.push({
        key: `commute-dest-${i}`,
        latitude: last.latitude,
        longitude: last.longitude,
        title: label,
      });
    }
    return markers;
  }, [travelTimes, mapDestinations]);

  const isochronePolygons = useMemo((): IsochronePolygonsNative => {
    if (!commuteSearchOverlay) {
      return { main: null, individuals: [] };
    }
    return parseIsochroneForNativeMap(commuteSearchOverlay);
  }, [commuteSearchOverlay]);

  return {
    nativeRouteOverlays,
    destinationMarkers,
    isochronePolygons,
  };
}
