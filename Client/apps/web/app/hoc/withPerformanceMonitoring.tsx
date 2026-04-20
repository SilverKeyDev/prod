import React, { useEffect } from "react";

import type { PerformanceMonitoringOptions } from "packages/hooks/store/performance/usePerformanceMonitoring";
import { usePerformanceMonitoring } from "packages/hooks/store/performance/usePerformanceMonitoring";

/**
 * Higher-order component for automatic performance monitoring
 * Wraps a component and tracks its render performance automatically
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: PerformanceMonitoringOptions
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

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithPerformanceMonitoring;
}
