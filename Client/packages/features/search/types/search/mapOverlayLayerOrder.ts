/**
 * Canonical stacking order for search map overlays (bottom → top).
 * Basemap is implicit below all of these.
 */
export const SEARCH_MAP_OVERLAY_LAYER_ORDER = [
  "polygons",
  "waypoints",
  "homeMarkers",
  "homeCards",
] as const;

export type SearchMapOverlayLayer =
  (typeof SEARCH_MAP_OVERLAY_LAYER_ORDER)[number];

const LAYER_STEP = 1000;

export function searchMapOverlayBaseZIndex(
  layer: SearchMapOverlayLayer,
): number {
  const i = SEARCH_MAP_OVERLAY_LAYER_ORDER.indexOf(layer);
  if (i < 0) {
    return LAYER_STEP;
  }
  return (i + 1) * LAYER_STEP;
}

/** Isochrone individual outlines sit under the union polygon within the polygons band. */
export function searchMapPolygonIndividualZIndex(): number {
  return searchMapOverlayBaseZIndex("polygons");
}

export function searchMapPolygonUnionZIndex(): number {
  return searchMapOverlayBaseZIndex("polygons") + 1;
}

/** Multi-card stacking on web: increment within the homeCards band. */
export function searchMapHomeCardZIndex(stackIndex: number): number {
  return searchMapOverlayBaseZIndex("homeCards") + stackIndex;
}
