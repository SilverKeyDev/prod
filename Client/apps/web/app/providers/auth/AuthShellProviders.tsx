import type { ReactNode } from "react";

/**
 * Auth shell providers for standard routes
 * SavedHomesProvider removed - saved homes functionality now handled by useSavedHomesStore
 * ReportsProvider removed - reports functionality now handled by useReportsStore
 * UserProvider is now at CoreProviders level to prevent remounting
 */
export function AuthShellProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
