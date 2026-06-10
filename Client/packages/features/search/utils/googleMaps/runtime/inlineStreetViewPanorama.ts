import { log } from "packages/logger";
import { getWindow } from "packages/utils/core/platform";

/** Monotonic counter so logs can show Strict Mode / double effect ordering (dev). */
let attachInlineStreetViewPanoramaCallSeq = 0;

export type InlineStreetViewAttachment = {
  panorama: google.maps.StreetViewPanorama;
  setPosition: (position: google.maps.LatLngLiteral) => void;
  dispose: () => void;
};

/**
 * Binds a {@link google.maps.StreetViewPanorama} to `container` and attaches it to `map` via
 * {@link google.maps.Map.setStreetView} so the default pegman control opens inline instead of a new tab.
 */
export type AttachInlineStreetViewPanoramaOptions = {
  heading?: number;
  /** Fires when the user opens/closes Street View (e.g. close button) or visibility changes programmatically. */
  onVisibleChange?: (visible: boolean) => void;
};

export function attachInlineStreetViewPanorama(
  map: google.maps.Map,
  container: HTMLElement,
  position: google.maps.LatLngLiteral,
  options?: AttachInlineStreetViewPanoramaOptions
): InlineStreetViewAttachment | null {
  const win = getWindow() as (Window & { google?: typeof google }) | null;
  if (!win?.google?.maps?.StreetViewPanorama) {
    log.debug("PROPERTY_DETAILS", "Street View: StreetViewPanorama API missing");
    return null;
  }

  if (!container.isConnected) {
    log.debug(
      "PROPERTY_DETAILS",
      "Street View: overlay container not in document; skip attach (pegman may open externally)"
    );
    return null;
  }

  try {
    map.setStreetView(null);
  } catch {
    /* detach any prior panorama (StrictMode re-run, leaked instance, etc.) */
  }

  const panorama = new win.google.maps.StreetViewPanorama(container, {
    position,
    pov: { heading: options?.heading ?? 0, pitch: 0 },
    visible: false,
    addressControl: false,
    enableCloseButton: true,
    fullscreenControl: false,
  });

  map.setStreetView(panorama);
  const attachCallSeq = ++attachInlineStreetViewPanoramaCallSeq;
  log.debug("PROPERTY_DETAILS", "Street View: linked panorama to map", {
    attachCallSeq,
    hint: "Two quick logs in dev usually mean React 18 Strict Mode (effect mount, cleanup, remount).",
  });

  const syncPointerEvents = (): void => {
    container.style.pointerEvents = panorama.getVisible() ? "auto" : "none";
  };
  syncPointerEvents();

  const visibilityListener = panorama.addListener("visible_changed", () => {
    syncPointerEvents();
    options?.onVisibleChange?.(panorama.getVisible());
  });

  return {
    panorama,
    setPosition: (next) => {
      panorama.setPosition(next);
    },
    dispose: () => {
      visibilityListener.remove();
      try {
        map.setStreetView(null);
      } catch {
        /* detach may throw if map already torn down */
      }
      try {
        win.google.maps.event.clearInstanceListeners(panorama);
      } catch {
        /* ignore */
      }
      container.replaceChildren();
    },
  };
}
