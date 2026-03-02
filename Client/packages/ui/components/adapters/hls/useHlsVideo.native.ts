import { useCallback } from "react";

import type { UseHlsVideoParams } from "./useHlsVideoTypes";

/**
 * Native: no hls.js; expo-av / react-native-video play HLS via source URI.
 * Same interface so callers can use <Video source={{ uri: url }} />; destroyHls is a no-op.
 */
export function useHlsVideo(_params: UseHlsVideoParams) {
  const destroyHls = useCallback(() => {
    // No HLS instance on native; native Video component owns playback.
  }, []);
  return { destroyHls };
}
