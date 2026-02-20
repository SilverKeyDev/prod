import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useSearchViewStore } from "packages/store";
import { clearPreloadScheduler, flush } from "packages/utils/domain/feed";

/**
 * Runs cleanup when switching away from Reels:
 * - Cancel in-flight feed fetches
 * - Flush telemetry
 * - Clear preload scheduler
 */
export function useReelsCleanup() {
  const queryClient = useQueryClient();
  const prevModeRef = useRef(useSearchViewStore.getState().mode);

  useEffect(() => {
    const unsub = useSearchViewStore.subscribe((state) => {
      const nextMode = state.mode;
      if (prevModeRef.current === "reels" && nextMode === "map") {
        void queryClient.cancelQueries({ queryKey: ["feed"] });
        flush();
        clearPreloadScheduler();
      }
      prevModeRef.current = nextMode;
    });
    return unsub;
  }, [queryClient]);
}
