/**
 * Utility functions for rendering isochrone polygons on Google Maps
 */

export type IsochroneRenderOptions = {
  map: google.maps.Map;
  polygonRef: React.MutableRefObject<google.maps.Polygon | null>;
  individualPolygonsRef: React.MutableRefObject<google.maps.Polygon[]>;
  focusOnCurrentProperty: () => void;
}; // Updated interface - force refresh

/**
 * Render isochrone polygon on the map
 */
export const renderIsochronePolygon = (
  isochroneData: unknown,
  options: IsochroneRenderOptions,
) => {
  const { map, polygonRef, individualPolygonsRef, focusOnCurrentProperty } =
    options;

  if (!map) {
    console.warn("❌ Google Map not initialized yet");
    return;
  }

  const isochroneDataTyped = isochroneData as {
    isochrone?: { geometry?: unknown };
    individual_isochrones?: unknown;
  };
  if (
    !isochroneDataTyped?.isochrone ||
    !(isochroneDataTyped.isochrone as { geometry?: unknown })?.geometry
  ) {
    console.warn("❌ No isochrone geometry data available for map rendering");
    console.warn(
      "📊 Isochrone data structure:",
      JSON.stringify(isochroneData, null, 2),
    );
    return;
  }

  // Clear existing polygons
  if (polygonRef.current) {
    polygonRef.current.setMap(null);
  }

  // Clear existing individual polygons
  if (individualPolygonsRef.current) {
    individualPolygonsRef.current.forEach((polygon: google.maps.Polygon) =>
      polygon.setMap(null),
    );
    individualPolygonsRef.current = [];
  }

  try {
    // First, render individual isochrones as gray outlines
    if (
      isochroneDataTyped.individual_isochrones &&
      Array.isArray(isochroneDataTyped.individual_isochrones)
    ) {
      const individualIsochrones =
        isochroneDataTyped.individual_isochrones as unknown[];
      individualIsochrones.forEach((individualData: unknown) => {
        const data = individualData as Record<string, unknown>;
        const geometry = data.isochrone as Record<string, unknown>;
        if (!geometry?.geometry) return;

        const geo = geometry.geometry as Record<string, unknown>;
        let coordinates: number[][][] = [];

        if (geo.type === "Polygon") {
          coordinates = geo.coordinates as number[][][];
        } else if (geo.type === "MultiPolygon") {
          const coords = geo.coordinates as number[][][][];
          [coordinates] = coords;
        }

        if (coordinates.length > 0) {
          const paths = coordinates.map((ring: number[][]) => {
            return ring.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }));
          });

          // Create individual polygon with brownish styling
          const individualPolygon = new google.maps.Polygon({
            paths,
            strokeColor: "#8B7355", // Brownish color matching app theme
            strokeOpacity: 0.6,
            strokeWeight: 1,
            fillColor: "transparent",
            fillOpacity: 0,
            clickable: false,
          });

          individualPolygon.setMap(map);
          if (!individualPolygonsRef.current)
            individualPolygonsRef.current = [];
          individualPolygonsRef.current.push(individualPolygon);
        }
      });
    }

    // Now render the main union isochrone
    const isochrone = isochroneDataTyped.isochrone as Record<string, unknown>;
    const geometry = isochrone.geometry as Record<string, unknown>;
    let coordinates: number[][][] = [];

    if (geometry.type === "Polygon") {
      coordinates = geometry.coordinates as number[][][];
    } else if (geometry.type === "MultiPolygon") {
      // For MultiPolygon, take the first polygon
      const coords = geometry.coordinates as number[][][][];
      [coordinates] = coords;
    } else {
      console.warn("❌ Unsupported geometry type:", geometry.type);
      return;
    }

    // Convert GeoJSON coordinates to Google Maps LatLng format
    // GeoJSON uses [longitude, latitude], Google Maps uses {lat, lng}
    const paths = coordinates.map((ring: number[][]) => {
      const convertedRing = ring.map((coord: number[]) => ({
        lat: coord[1], // latitude is second
        lng: coord[0], // longitude is first
      }));
      return convertedRing;
    });

    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: "#7B9E7C", // Match the app's green theme
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#7B9E7C",
      fillOpacity: 0.15,
      clickable: false,
    });

    polygon.setMap(map);
    polygonRef.current = polygon;

    // Fit the map to include the polygon bounds
    const bounds = new google.maps.LatLngBounds();
    paths[0].forEach((point: { lat: number; lng: number }) => {
      bounds.extend(point);
    });

    map.fitBounds(bounds);

    // Add some padding to the bounds
    setTimeout(() => {
      if (map) {
        // Use MapZoomController for consistent zoom behavior
        focusOnCurrentProperty();
      }
    }, 100);
  } catch (error: unknown) {
    console.error("❌ Error rendering isochrone polygon:", error);
    console.error("❌ Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      isochroneData,
    });
  }
};
