/**
 * Feature Flag Guard
 * Conditionally renders components based on feature flags
 */

import { EyeOff } from "lucide-react";
import { type ReactNode } from "react";

import Card from "../../components/layout/Card";

type FeatureFlagGuardProps = {
  children: ReactNode;
  flag: string;
  fallback?: ReactNode;
  showFallbackInDev?: boolean;
};

// Mock feature flag service - replace with your actual implementation
const getFeatureFlag = (flag: string): boolean => {
  // In development, you might want to use localStorage or environment variables
  if (import.meta.env.DEV) {
    const devFlags = localStorage.getItem("dev-feature-flags");
    if (devFlags) {
      try {
        const flags = JSON.parse(devFlags) as Record<string, unknown>;
        return Boolean(flags[flag]) || false;
      } catch {
        return false;
      }
    }
  }

  // In production, this would connect to your feature flag service
  // Example: LaunchDarkly, Split.io, or custom service
  const featureFlags: Record<string, boolean> = {
    "new-dashboard": false,
    "advanced-search": true,
    "beta-features": false,
    "ai-recommendations": true,
    "dark-mode": false,
  };

  return featureFlags[flag] ?? false;
};

export function FeatureFlagGuard({
  children,
  flag,
  fallback,
  showFallbackInDev = true,
}: FeatureFlagGuardProps) {
  const isEnabled = getFeatureFlag(flag);

  if (isEnabled) {
    return <>{children}</>;
  }

  // Show fallback in development for debugging
  if (import.meta.env.DEV && showFallbackInDev) {
    return (
      fallback ?? (
        <Card
          className="border-2 border-dashed border-gray-300 bg-gray-50"
          padding="sm"
        >
          <div className="flex items-center justify-center text-sm text-gray-500">
            <EyeOff className="mr-2 h-4 w-4" />
            Feature "{flag}" is disabled
          </div>
        </Card>
      )
    );
  }

  return fallback ? <>{fallback}</> : null;
}

export default FeatureFlagGuard;
