import type { IsochroneData } from "packages/types/api";

/**
 * Build a simple neighborhood polygon (bounding box with padding) around important locations.
 * Used when showCommute is OFF but we still want to show the area of interest for preferences search.
 * This is NOT a commute-based isochrone, just a simple geographic boundary.
 */
export function buildNeighborhoodPolygonFromLocations(
  isochroneData: IsochroneData,
): IsochroneData | null {
  const locations = isochroneData.locations;

  if (!locations || locations.length === 0) {
    return null;
  }

  // Extract coordinates from locations
  const coords: { lat: number; lng: number }[] = [];
  for (const loc of locations) {
    if (loc.lat != null && loc.lon != null) {
      coords.push({ lat: loc.lat, lng: loc.lon });
    }
  }

  if (coords.length === 0) {
    return null;
  }

  // Calculate bounding box
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add padding (approximately 2 miles / ~0.03 degrees)
  // This creates a reasonable neighborhood boundary around the locations
  const padding = 0.03;
  const paddedMinLat = minLat - padding;
  const paddedMaxLat = maxLat + padding;
  const paddedMinLng = minLng - padding;
  const paddedMaxLng = maxLng + padding;

  // Create a rectangular polygon (bounding box)
  // GeoJSON format: [longitude, latitude]
  const rectangleCoords = [
    [
      [paddedMinLng, paddedMinLat], // Bottom-left
      [paddedMaxLng, paddedMinLat], // Bottom-right
      [paddedMaxLng, paddedMaxLat], // Top-right
      [paddedMinLng, paddedMaxLat], // Top-left
      [paddedMinLng, paddedMinLat], // Close the ring
    ],
  ];

  // Calculate center point
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Build synthetic IsochroneData with the neighborhood polygon
  // This maintains compatibility with the existing rendering logic
  return {
    isochrone: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: rectangleCoords,
      },
    },
    individual_isochrones: [], // No individual isochrones for neighborhood polygon
    center: isochroneData.center ?? {
      lat: centerLat,
      lon: centerLng,
      address: "Search Area",
    },
    locations: isochroneData.locations, // Preserve original locations
    commute_tolerance: isochroneData.commute_tolerance,
    mode: isochroneData.mode,
  };
}
