import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

export interface PerformanceMetrics {
  /** Render time in milliseconds */
  renderTime: number;
  /** Memory usage in bytes */
  memoryUsage: number;
  /** Number of re-renders */
  reRenderCount: number;
  /** Component mount time */
  mountTime: number;
  /** Last update time */
  lastUpdateTime: number;
}

export interface PerformanceThresholds {
  /** Maximum acceptable render time in milliseconds */
  maxRenderTime: number;
  /** Maximum acceptable memory usage in bytes */
  maxMemoryUsage: number;
  /** Maximum acceptable re-render count */
  maxReRenders: number;
}

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

      // Check thresholds
      if (enableLogging) {
        if (renderTime > finalThresholds.maxRenderTime) {
          console.warn(
            `⚠️ [${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${finalThresholds.maxRenderTime}ms)`,
          );
        }

        if (reRenderCount.current > finalThresholds.maxReRenders) {
          console.warn(
            `⚠️ [${componentName}] High re-render count: ${reRenderCount.current} (threshold: ${finalThresholds.maxReRenders})`,
          );
        }
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
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as PerformanceWithMemory)
    ) {
      const memory = (window.performance as PerformanceWithMemory).memory;
      const memoryUsage = memory?.usedJSHeapSize ?? 0;

      setMetrics((prev) => ({
        ...prev,
        memoryUsage,
      }));

      if (enableLogging && memoryUsage > finalThresholds.maxMemoryUsage) {
        console.warn(
          `⚠️ [${componentName}] High memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: ${(finalThresholds.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)`,
        );
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

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    const report = {
      componentName,
      metrics,
      thresholds: finalThresholds,
      warnings: [] as string[],
    };

    if (metrics.renderTime > finalThresholds.maxRenderTime) {
      report.warnings.push(`Slow render: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.memoryUsage > finalThresholds.maxMemoryUsage) {
      report.warnings.push(
        `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    if (metrics.reRenderCount > finalThresholds.maxReRenders) {
      report.warnings.push(`High re-render count: ${metrics.reRenderCount}`);
    }

    return report;
  }, [componentName, metrics, finalThresholds]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions = [];

    if (metrics.renderTime > finalThresholds.maxRenderTime) {
      suggestions.push("Consider using React.memo() for expensive components");
      suggestions.push(
        "Use useCallback() and useMemo() to prevent unnecessary re-renders",
      );
      suggestions.push("Consider code splitting for large components");
    }

    if (metrics.memoryUsage > finalThresholds.maxMemoryUsage) {
      suggestions.push("Check for memory leaks in useEffect cleanup");
      suggestions.push("Consider lazy loading for heavy components");
      suggestions.push("Review object creation in render methods");
    }

    if (metrics.reRenderCount > finalThresholds.maxReRenders) {
      suggestions.push("Review dependency arrays in useEffect and useCallback");
      suggestions.push(
        "Consider using useRef for values that don't need to trigger re-renders",
      );
      suggestions.push("Check for unnecessary state updates");
    }

    return suggestions;
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

      console.log(
        `⏱️ [${operationName}] Operation completed in ${duration.toFixed(2)}ms`,
      );
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
