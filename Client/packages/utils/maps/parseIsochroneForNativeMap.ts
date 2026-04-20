/**
 * Parse isochrone API payload into coordinate rings for react-native-maps Polygon.
 */

export type NativeMapLatLng = { latitude: number; longitude: number };

function geoJsonRingToCoordinates(ring: number[][]): NativeMapLatLng[] {
  return ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

/**
 * Returns the main union outline and per-location outline rings (outer ring only).
 */
export function parseIsochroneForNativeMap(isochroneData: unknown): {
  main: NativeMapLatLng[] | null;
  individuals: NativeMapLatLng[][];
} {
  const raw = isochroneData as {
    isochrone?: {
      geometry?: { type?: string; coordinates?: number[][][] | number[][][][] };
    };
    individual_isochrones?: Array<{
      isochrone?: {
        geometry?: {
          type?: string;
          coordinates?: number[][][] | number[][][][];
        };
      };
    }>;
  };
  const individuals: NativeMapLatLng[][] = [];
  if (raw.individual_isochrones && Array.isArray(raw.individual_isochrones)) {
    for (const item of raw.individual_isochrones) {
      const geom = item.isochrone?.geometry;
      if (!geom?.coordinates || !geom?.type) continue;
      let coords: number[][][];
      if (geom.type === "Polygon") {
        coords = geom.coordinates as number[][][];
      } else if (geom.type === "MultiPolygon") {
        coords = (geom.coordinates as number[][][][])[0] ?? [];
      } else {
        continue;
      }
      const outer = coords[0];
      if (outer?.length) {
        individuals.push(geoJsonRingToCoordinates(outer));
      }
    }
  }
  let main: NativeMapLatLng[] | null = null;
  if (raw.isochrone?.geometry?.coordinates) {
    const geom = raw.isochrone.geometry;
    if (!geom?.type) {
      return { main: null, individuals };
    }
    let coords: number[][][];
    if (geom.type === "Polygon") {
      coords = geom.coordinates as number[][][];
    } else if (geom.type === "MultiPolygon") {
      coords = (geom.coordinates as number[][][][])[0] ?? [];
    } else {
      return { main: null, individuals };
    }
    const outer = coords[0];
    if (outer?.length) {
      main = geoJsonRingToCoordinates(outer);
    }
  }
  return { main, individuals };
}
