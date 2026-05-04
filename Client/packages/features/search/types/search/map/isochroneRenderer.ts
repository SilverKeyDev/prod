/**
 * Utility functions for rendering isochrone polygons on Google Maps
 */

import { color } from "packages/design-tokens";
import { log, LOG_CATEGORIES } from "packages/logger";
import { getIsochroneUnionFillForGoogleMaps } from "packages/utils/maps/isochroneUnionStyle";

import {
  searchMapPolygonIndividualZIndex,
  searchMapPolygonUnionZIndex,
} from "./mapOverlayLayerOrder";

export type IsochroneRenderOptions = {
  map: google.maps.Map;
  polygonRef: React.MutableRefObject<google.maps.Polygon | null>;
  individualPolygonsRef: React.MutableRefObject<google.maps.Polygon[]>;
  focusOnCurrentProperty: () => void;
}; // Updated interface - force refresh

/** Remove commute isochrone layers from the map (main + individual outlines). */
export const clearIsochroneOverlays = (options: IsochroneRenderOptions): void => {
  const { map, polygonRef, individualPolygonsRef } = options;
  if (!map) return;
  if (polygonRef.current) {
    polygonRef.current.setMap(null);
    polygonRef.current = null;
  }
  if (individualPolygonsRef.current?.length) {
    individualPolygonsRef.current.forEach((p: google.maps.Polygon) => p.setMap(null));
    individualPolygonsRef.current = [];
  }
};

/**
 * Render isochrone polygon on the map
 */
export const renderIsochronePolygon = (isochroneData: unknown, options: IsochroneRenderOptions) => {
  const { map, polygonRef, individualPolygonsRef } = options;

  if (!map) {
    log.warn(LOG_CATEGORIES.MAP_RENDERING, "Google Map not initialized yet");
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
    log.warn(
      LOG_CATEGORIES.MAP_RENDERING,
      "No isochrone geometry data available for map rendering"
    );
    log.warn(LOG_CATEGORIES.MAP_RENDERING, "Isochrone data structure", {
      data: isochroneData,
    });
    return;
  }

  // Clear existing polygons
  if (polygonRef.current) {
    polygonRef.current.setMap(null);
  }

  // Clear existing individual polygons
  if (individualPolygonsRef.current) {
    individualPolygonsRef.current.forEach((polygon: google.maps.Polygon) => polygon.setMap(null));
    individualPolygonsRef.current = [];
  }

  try {
    // First, render individual isochrones as gray outlines
    if (
      isochroneDataTyped.individual_isochrones &&
      Array.isArray(isochroneDataTyped.individual_isochrones)
    ) {
      const individualIsochrones = isochroneDataTyped.individual_isochrones as unknown[];
      individualIsochrones.forEach((individualData: unknown) => {
        const data = individualData as Record<string, unknown>;
        const geometry = data.isochrone as Record<string, unknown>;
        if (!geometry?.geometry) return;

        const geo = geometry.geometry as Record<string, unknown>;
        if (!geo || typeof geo.type !== "string") return;

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
            strokeColor: color("brown.DEFAULT"), // Brownish color matching app theme
            strokeOpacity: 0.6,
            strokeWeight: 1,
            fillColor: "transparent",
            fillOpacity: 0,
            clickable: false,
            zIndex: searchMapPolygonIndividualZIndex(),
          });

          individualPolygon.setMap(map);
          if (!individualPolygonsRef.current) individualPolygonsRef.current = [];
          individualPolygonsRef.current.push(individualPolygon);
        }
      });
    }

    // Now render the main union isochrone
    const isochrone = isochroneDataTyped.isochrone as Record<string, unknown>;
    const geometry = isochrone.geometry as Record<string, unknown>;
    if (!geometry || typeof geometry.type !== "string") {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "Invalid geometry object", {
        geometry,
      });
      return;
    }

    let coordinates: number[][][] = [];

    if (geometry.type === "Polygon") {
      coordinates = geometry.coordinates as number[][][];
    } else if (geometry.type === "MultiPolygon") {
      // For MultiPolygon, take the first polygon
      const coords = geometry.coordinates as number[][][][];
      [coordinates] = coords;
    } else {
      log.warn(LOG_CATEGORIES.MAP_RENDERING, "Unsupported geometry type", {
        type: geometry.type,
      });
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

    const unionFill = getIsochroneUnionFillForGoogleMaps();
    const polygon = new google.maps.Polygon({
      paths,
      strokeColor: color("olive.DEFAULT"), // Match the app's green theme
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: unionFill.fillColor,
      fillOpacity: unionFill.fillOpacity,
      clickable: false,
      zIndex: searchMapPolygonUnionZIndex(),
    });

    polygon.setMap(map);
    polygonRef.current = polygon;

    // Do not fit bounds or animate - map center/zoom is already set in useMapMarkers
    // Removing fitBounds to prevent animation on initial load
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.MAP_RENDERING, "Error rendering isochrone polygon", error);
    log.error(LOG_CATEGORIES.MAP_RENDERING, "Error details", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      isochroneData,
    });
  }
};
