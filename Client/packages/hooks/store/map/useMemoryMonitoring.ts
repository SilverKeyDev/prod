import { useCallback, useEffect, useState } from "react";

import { log } from "packages/logger";
import { getWindow } from "packages/utils/platform";

/**
 * Memory monitoring utilities (map-related).
 * Exported for consumers that previously imported from useMapCleanup.
 */
export function useMemoryMonitoring() {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    percentage: number;
  }>({
    used: 0,
    total: 0,
    percentage: 0,
  });

  const checkMemoryUsage = useCallback(() => {
    type PerformanceWithMemory = Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    const win = getWindow();
    if (win && "performance" in win && "memory" in (win.performance as PerformanceWithMemory)) {
      const perf = win.performance as PerformanceWithMemory;
      const mem = perf.memory;
      if (!mem) return;
      const used = mem.usedJSHeapSize ?? 0;
      const total = mem.totalJSHeapSize ?? 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      setMemoryUsage({ used, total, percentage });

      if (percentage > 80) {
        log.warn("MAP_RENDERING", "High memory usage detected", {
          used,
          total,
          percentage,
        });
        const winGc = getWindow() as Window & { gc?: () => void };
        if (winGc && "gc" in winGc) {
          try {
            winGc.gc?.();
            log.debug("MAP_RENDERING", "Triggered garbage collection due to high memory usage");
          } catch (error) {
            log.warn("MAP_RENDERING", "Could not trigger garbage collection", error);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 30000);
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return { memoryUsage, checkMemoryUsage };
}
