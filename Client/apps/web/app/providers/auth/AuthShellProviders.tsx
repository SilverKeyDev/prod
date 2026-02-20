import type { ReactNode } from "react";

import { useReportsStoreIntegration } from "packages/hooks/store/documents/useReportsStoreIntegration";
import { useSavedHomesStoreIntegration } from "packages/hooks/store/search/useSavedHomesStoreIntegration";

/**
 * Full auth shell providers for standard and specialized routes
 *
 * Note: Data is now prefetched on login via useDataInitialization hook.
 * These store integrations sync React Query cache to Zustand stores for components
 * that access data via store selectors. They do not trigger data fetching.
 */
export function AuthShellProviders({ children }: { children: ReactNode }) {
  // Sync reports data from React Query cache to Zustand store
  // Data is already prefetched on login, this just syncs to store
  useReportsStoreIntegration();

  // Sync saved homes data from React Query cache to Zustand store
  // Data is already prefetched on login, this just syncs to store
  useSavedHomesStoreIntegration();

  return <>{children}</>;
}
