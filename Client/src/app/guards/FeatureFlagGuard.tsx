/**
 * Feature Flag Guard
 * Conditionally renders components based on feature flags
 */

import React, { ReactNode } from 'react';
import Card from '../../components/layout/Card';
import { EyeOff } from 'lucide-react';

interface FeatureFlagGuardProps {
  children: ReactNode;
  flag: string;
  fallback?: ReactNode;
  showFallbackInDev?: boolean;
}

// Mock feature flag service - replace with your actual implementation
const getFeatureFlag = (flag: string): boolean => {
  // In development, you might want to use localStorage or environment variables
  if (import.meta.env.DEV) {
    const devFlags = localStorage.getItem('dev-feature-flags');
    if (devFlags) {
      try {
        const flags = JSON.parse(devFlags);
        return flags[flag] ?? false;
      } catch {
        return false;
      }
    }
  }

  // In production, this would connect to your feature flag service
  // Example: LaunchDarkly, Split.io, or custom service
  const featureFlags: Record<string, boolean> = {
    'new-dashboard': false,
    'advanced-search': true,
    'beta-features': false,
    'ai-recommendations': true,
    'dark-mode': false,
  };

  return featureFlags[flag] ?? false;
};

export function FeatureFlagGuard({ 
  children, 
  flag, 
  fallback,
  showFallbackInDev = true 
}: FeatureFlagGuardProps) {
  const isEnabled = getFeatureFlag(flag);

  if (isEnabled) {
    return <>{children}</>;
  }

  // Show fallback in development for debugging
  if (import.meta.env.DEV && showFallbackInDev) {
    return fallback || (
      <Card className="border-dashed border-2 border-gray-300 bg-gray-50" padding="sm">
        <div className="flex items-center justify-center text-gray-500 text-sm">
          <EyeOff className="w-4 h-4 mr-2" />
          Feature "{flag}" is disabled
        </div>
      </Card>
    );
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Higher-order component version of FeatureFlagGuard
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flag: string,
  fallback?: ReactNode
) {
  return function FeatureFlaggedComponent(props: P) {
    return (
      <FeatureFlagGuard flag={flag} fallback={fallback}>
        <Component {...props} />
      </FeatureFlagGuard>
    );
  };
}

/**
 * Hook to check feature flags
 */
export function useFeatureFlag(flag: string): boolean {
  return getFeatureFlag(flag);
}

/**
 * Hook to get multiple feature flags
 */
export function useFeatureFlags(flags: string[]): Record<string, boolean> {
  return flags.reduce((acc, flag) => {
    acc[flag] = getFeatureFlag(flag);
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * Development helper to toggle feature flags
 */
export function toggleFeatureFlag(flag: string): void {
  if (import.meta.env.DEV) {
    const devFlags = localStorage.getItem('dev-feature-flags');
    let flags: Record<string, boolean> = {};
    
    if (devFlags) {
      try {
        flags = JSON.parse(devFlags);
      } catch {
        flags = {};
      }
    }
    
    flags[flag] = !flags[flag];
    localStorage.setItem('dev-feature-flags', JSON.stringify(flags));
    
    // Trigger a page refresh to apply changes
    window.location.reload();
  }
}

export default FeatureFlagGuard;
