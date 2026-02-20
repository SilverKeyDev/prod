import { log, LOG_CATEGORIES } from "logger";

import type {
  PerformanceMetrics,
  PerformanceThresholds,
} from "./performanceMonitoringTypes";

export function logRenderThresholdWarnings(
  componentName: string,
  renderTime: number,
  reRenderCount: number,
  thresholds: PerformanceThresholds,
) {
  if (renderTime > thresholds.maxRenderTime) {
    log.warn(LOG_CATEGORIES.PAGES, "Slow render detected", {
      componentName,
      renderTime,
      threshold: thresholds.maxRenderTime,
    });
  }
  if (reRenderCount > thresholds.maxReRenders) {
    log.warn(LOG_CATEGORIES.PAGES, "High re-render count", {
      componentName,
      reRenderCount,
      threshold: thresholds.maxReRenders,
    });
  }
}

export function buildPerformanceReport(
  componentName: string,
  metrics: PerformanceMetrics,
  thresholds: PerformanceThresholds,
) {
  const report = {
    componentName,
    metrics,
    thresholds,
    warnings: [] as string[],
  };
  if (metrics.renderTime > thresholds.maxRenderTime) {
    report.warnings.push(`Slow render: ${metrics.renderTime.toFixed(2)}ms`);
  }
  if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
    report.warnings.push(
      `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
    );
  }
  if (metrics.reRenderCount > thresholds.maxReRenders) {
    report.warnings.push(`High re-render count: ${metrics.reRenderCount}`);
  }
  return report;
}

export function buildOptimizationSuggestions(
  metrics: PerformanceMetrics,
  thresholds: PerformanceThresholds,
): string[] {
  const suggestions: string[] = [];
  if (metrics.renderTime > thresholds.maxRenderTime) {
    suggestions.push("Consider using React.memo() for expensive components");
    suggestions.push(
      "Use useCallback() and useMemo() to prevent unnecessary re-renders",
    );
    suggestions.push("Consider code splitting for large components");
  }
  if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
    suggestions.push("Check for memory leaks in useEffect cleanup");
    suggestions.push("Consider lazy loading for heavy components");
    suggestions.push("Review object creation in render methods");
  }
  if (metrics.reRenderCount > thresholds.maxReRenders) {
    suggestions.push("Review dependency arrays in useEffect and useCallback");
    suggestions.push(
      "Consider using useRef for values that don't need to trigger re-renders",
    );
    suggestions.push("Check for unnecessary state updates");
  }
  return suggestions;
}
