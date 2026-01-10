/**
 * Feature Flag Guard
 * Conditionally renders components based on feature flags
 */

import { EyeOff } from "lucide-react";
import { type ReactNode } from "react";

import Card from "../../components/layout/Card";
import { useFeatureFlag } from "./useFeatureFlag";

type FeatureFlagGuardProps = {
  children: ReactNode;
  flag: string;
  fallback?: ReactNode;
  showFallbackInDev?: boolean;
};

export function FeatureFlagGuard({
  children,
  flag,
  fallback,
  showFallbackInDev = true,
}: FeatureFlagGuardProps) {
  const isEnabled = useFeatureFlag(flag);

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
