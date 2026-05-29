import { useEffect, useRef } from "react";

import { applyStoredMapCamera, snapshotMapCamera } from "packages/features/search/utils/googleMaps";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useFiltersStore } from "packages/store";

const IDLE_PERSIST_MS = 450;
const MAP_ATTACH_MAX_FRAMES = 90;

/**
 * Persists Google Maps center/zoom (web) to filters store on idle, and restores after remount
 * so leaving Search and returning keeps the same map view alongside cached results.
 */
export function useWebMapCameraPersistence(params: {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  isGoogleMapsLoaded: boolean;
}): void {
  const { googleMapRef, isGoogleMapsLoaded } = params;
  const setWebMapCamera = useFiltersStore((s) => s.setWebMapCamera);
  const webMapCamera = useFiltersStore((s) => s.webMapCamera);

  const webMapCameraRef = useRef(webMapCamera);
  webMapCameraRef.current = webMapCamera;

  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachedMapRef = useRef<google.maps.Map | null>(null);
  const restoredForMapRef = useRef<WeakMap<google.maps.Map, boolean>>(new WeakMap());

  useEffect(() => {
    if (!isGoogleMapsLoaded) return;

    let cancelled = false;
    let idleListener: google.maps.MapsEventListener | undefined;
    let frames = 0;

    const clearPersistTimer = () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };

    const attachToMap = (map: google.maps.Map) => {
      if (attachedMapRef.current === map && idleListener) {
        return;
      }
      idleListener?.remove();
      attachedMapRef.current = map;

      const cam = webMapCameraRef.current;
      if (cam && !restoredForMapRef.current.get(map)) {
        applyStoredMapCamera(map, cam);
        restoredForMapRef.current.set(map, true);
      }

      idleListener = map.addListener("idle", () => {
        if (cancelled || googleMapRef.current !== map) return;
        const snap = snapshotMapCamera(map);
        if (!snap) return;
        clearPersistTimer();
        persistTimerRef.current = setTimeout(() => {
          if (cancelled) return;
          setWebMapCamera(snap);
        }, IDLE_PERSIST_MS);
      });
    };

    const tryAttach = () => {
      if (cancelled) return;
      const map = googleMapRef.current;
      if (map) {
        attachToMap(map);
        return;
      }
      frames += 1;
      if (frames < MAP_ATTACH_MAX_FRAMES) {
        requestAnimationFrame(tryAttach);
      } else {
        log.debug(
          LOG_CATEGORIES.MAP_RENDERING,
          "Map not ready for camera persistence within frame budget",
          {
            frames,
          }
        );
      }
    };

    tryAttach();

    return () => {
      cancelled = true;
      clearPersistTimer();
      idleListener?.remove();
      idleListener = undefined;
      attachedMapRef.current = null;
    };
  }, [googleMapRef, isGoogleMapsLoaded, setWebMapCamera]);
}
