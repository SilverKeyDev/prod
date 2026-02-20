import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { log, LOG_CATEGORIES } from "logger";

import { getWindow } from "packages/utils/core/platform";

import {
  buildOptimizationSuggestions,
  buildPerformanceReport,
  logRenderThresholdWarnings,
} from "./performanceMonitoringHelpers";
import type {
  PerformanceMetrics,
  PerformanceThresholds,
} from "./performanceMonitoringTypes";

export type {
  PerformanceMetrics,
  PerformanceThresholds,
} from "./performanceMonitoringTypes";

export interface PerformanceMonitoringOptions {
  /** Component name for logging */
  componentName: string;
  /** Performance thresholds */
  thresholds?: Partial<PerformanceThresholds>;
  /** Whether to enable automatic monitoring */
  enableAutoMonitoring?: boolean;
  /** Monitoring interval in milliseconds */
  monitoringInterval?: number;
  /** Whether to log performance warnings */
  enableLogging?: boolean;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60fps
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxReRenders: 10,
};

/**
 * Hook for monitoring component performance
 * Tracks render times, memory usage, and re-render counts
 */
export function usePerformanceMonitoring({
  componentName,
  thresholds = {},
  enableAutoMonitoring = true,
  monitoringInterval = 1000,
  enableLogging = true,
}: PerformanceMonitoringOptions) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    reRenderCount: 0,
    mountTime: 0,
    lastUpdateTime: 0,
  });

  const renderStartTime = useRef<number>(0);
  const reRenderCount = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());
  const lastUpdateTime = useRef<number>(Date.now());

  const finalThresholds = useMemo(
    () => ({ ...DEFAULT_THRESHOLDS, ...thresholds }),
    [thresholds],
  );

  // Measure render time
  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      reRenderCount.current += 1;
      lastUpdateTime.current = Date.now();

      setMetrics((prev) => ({
        ...prev,
        renderTime,
        reRenderCount: reRenderCount.current,
        lastUpdateTime: lastUpdateTime.current,
      }));

      if (enableLogging) {
        logRenderThresholdWarnings(
          componentName,
          renderTime,
          reRenderCount.current,
          finalThresholds,
        );
      }
    }
  }, [componentName, finalThresholds, enableLogging]);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    type PerformanceWithMemory = Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
    const win = getWindow();
    if (
      win &&
      "performance" in win &&
      "memory" in (win.performance as PerformanceWithMemory)
    ) {
      const memory = (win.performance as PerformanceWithMemory).memory;
      const memoryUsage = memory?.usedJSHeapSize ?? 0;

      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
      }));

      if (enableLogging && memoryUsage > finalThresholds.maxMemoryUsage) {
        log.warn(LOG_CATEGORIES.PAGES, "High memory usage", {
          componentName,
          memoryUsageMB: (memoryUsage / 1024 / 1024).toFixed(2),
          thresholdMB: (finalThresholds.maxMemoryUsage / 1024 / 1024).toFixed(
            2,
          ),
        });
      }
    }
  }, [componentName, finalThresholds, enableLogging]);

  // Auto monitoring
  useEffect(() => {
    if (!enableAutoMonitoring) return;

    const interval = setInterval(() => {
      measureMemoryUsage();
    }, monitoringInterval);

    return () => clearInterval(interval);
  }, [enableAutoMonitoring, monitoringInterval, measureMemoryUsage]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    reRenderCount.current = 0;
    mountTime.current = Date.now();
    lastUpdateTime.current = Date.now();

    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      reRenderCount: 0,
      mountTime: mountTime.current,
      lastUpdateTime: lastUpdateTime.current,
    });
  }, []);

  const getPerformanceReport = useCallback(() => {
    return buildPerformanceReport(componentName, metrics, finalThresholds);
  }, [componentName, metrics, finalThresholds]);

  const getOptimizationSuggestions = useCallback(() => {
    return buildOptimizationSuggestions(metrics, finalThresholds);
  }, [metrics, finalThresholds]);

  return {
    metrics,
    startRender,
    endRender,
    measureMemoryUsage,
    resetMetrics,
    getPerformanceReport,
    getOptimizationSuggestions,
  };
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: PerformanceMonitoringOptions,
) {
  const WithPerformanceMonitoring = (props: P) => {
    const { startRender, endRender } = usePerformanceMonitoring(options);

    useEffect(() => {
      startRender();
      return () => {
        endRender();
      };
    }, [startRender, endRender]);

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithPerformanceMonitoring;
}

// Hook for measuring specific operations
export function useOperationTimer(operationName: string) {
  const [operationTime, setOperationTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const startTime = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTime.current = performance.now();
    setIsRunning(true);
  }, []);

  const endTimer = useCallback(() => {
    if (startTime.current > 0) {
      const duration = performance.now() - startTime.current;
      setOperationTime(duration);
      setIsRunning(false);

      log.debug(LOG_CATEGORIES.PAGES, "Operation completed", {
        operationName,
        durationMs: duration.toFixed(2),
      });
    }
  }, [operationName]);

  const resetTimer = useCallback(() => {
    setOperationTime(0);
    setIsRunning(false);
    startTime.current = 0;
  }, []);

  return {
    operationTime,
    isRunning,
    startTimer,
    endTimer,
    resetTimer,
  };
}
