/**
 * Shared types for performance monitoring (used by usePerformanceMonitoring and performanceMonitoringHelpers).
 * Kept in a separate file to avoid circular dependency between the hook and helpers.
 */

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
