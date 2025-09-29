import React, { type ReactNode } from "react";

import { FeatureFlagGuard } from "./FeatureFlagGuard";

/**
 * Higher-order component version of FeatureFlagGuard
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: string,
  fallback?: ReactNode,
) {
  return function FeatureFlaggedComponent(props: P) {
    return (
      <FeatureFlagGuard flag={flag} fallback={fallback}>
        <Component {...props} />
      </FeatureFlagGuard>
    );
  };
}
