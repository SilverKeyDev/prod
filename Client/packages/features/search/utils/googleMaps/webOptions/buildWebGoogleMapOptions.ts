import type { WebGoogleMapBaseOptions } from "./buildWebGoogleMapOptions.types";

const DEFAULT_CENTER = { lat: 33.75, lng: -84.39 };
const DEFAULT_ZOOM = 12;

/**
 * Builds Google Maps JS `MapOptions` for web, applying Cloud Map ID styling when configured.
 * Overrides merge on top of defaults; `mapId` is preserved unless explicitly overridden.
 */
export function buildWebGoogleMapOptions(
  mapId: string | undefined,
  overrides?: Partial<WebGoogleMapBaseOptions>
): WebGoogleMapBaseOptions {
  const base: WebGoogleMapBaseOptions = {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: false,
    scaleControl: false,
    rotateControl: false,
    keyboardShortcuts: false,
    gestureHandling: "greedy",
    disableDefaultUI: true,
  };

  if (mapId) {
    base.mapId = mapId;
  }

  if (!overrides) {
    return base;
  }

  const { mapId: overrideMapId, ...restOverrides } = overrides;
  const merged: WebGoogleMapBaseOptions = {
    ...base,
    ...restOverrides,
  };

  if (overrideMapId !== undefined) {
    if (overrideMapId) {
      merged.mapId = overrideMapId;
    } else {
      delete merged.mapId;
    }
  } else if (mapId) {
    merged.mapId = mapId;
  }

  return merged;
}
