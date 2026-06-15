/**
 * Subset of google.maps.MapOptions used by SilverKey web map creation (testable without @types/google.maps).
 */
export type WebGoogleMapBaseOptions = {
  center?: { lat: number; lng: number };
  zoom?: number;
  mapId?: string;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  zoomControl?: boolean;
  scaleControl?: boolean;
  rotateControl?: boolean;
  keyboardShortcuts?: boolean;
  gestureHandling?: string;
  disableDefaultUI?: boolean;
  streetViewControlOptions?: { position?: unknown };
};
