/**
 * Map-only types for search (position, bounds, markers, polygons).
 */

export type MapPosition = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapMarker = {
  id: string;
  position: MapPosition;
  title: string;
  content: HTMLElement;
  overlay?: google.maps.OverlayView;
};

export type MapPolygon = {
  id: string;
  paths: MapPosition[][];
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  map?: google.maps.Map;
  polygon?: google.maps.Polygon;
};

export function isMapPosition(obj: unknown): obj is MapPosition {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as MapPosition).lat === "number" &&
    typeof (obj as MapPosition).lng === "number"
  );
}
