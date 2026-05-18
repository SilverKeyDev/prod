import { type RefObject, useEffect, useRef } from "react";

import { useSearchHeaderPopoverDismiss } from "./searchHeaderPopoverDismiss.web";

/**
 * Google Maps consumes pointer events on the canvas, so document-level outside-click
 * handlers on search header Popovers may not run. Close open header popovers on map click.
 */
export function useDismissSearchHeaderPopoversOnMapClick(
  googleMapRef: RefObject<google.maps.Map | null>,
  isGoogleMapsLoaded: boolean
): void {
  const dismissCtx = useSearchHeaderPopoverDismiss();
  const dismissAllRef = useRef(dismissCtx?.dismissAll);
  dismissAllRef.current = dismissCtx?.dismissAll;

  useEffect(() => {
    if (!dismissCtx || !isGoogleMapsLoaded) return;

    let listener: google.maps.MapsEventListener | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const attach = (): boolean => {
      const map = googleMapRef.current;
      if (!map || listener) return Boolean(listener);
      listener = map.addListener("click", () => {
        dismissAllRef.current?.();
      });
      return true;
    };

    if (!attach()) {
      intervalId = setInterval(() => {
        if (attach() && intervalId != null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 50);
    }

    return () => {
      if (intervalId != null) clearInterval(intervalId);
      listener?.remove();
      listener = null;
    };
  }, [dismissCtx, isGoogleMapsLoaded, googleMapRef]);
}
