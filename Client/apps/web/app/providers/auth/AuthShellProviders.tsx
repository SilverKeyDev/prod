import type { ReactNode } from "react";

import { useSavedHomesStoreIntegration } from "packages/hooks/store";
import { useAgentDashboardStore } from "packages/store";

import { useReportsStoreIntegration } from "@/features/documents/hooks/store/useReportsStoreIntegration";

/**
 * Single integration for saved homes: follows agent dashboard "view as client" selection
 * so Search, Saved, and Zustand stay aligned.
 */
function SavedHomesShellIntegration() {
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const clientId = selectedClientId ?? undefined;
  useSavedHomesStoreIntegration(clientId);
  return null;
}

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

  return (
    <>
      <SavedHomesShellIntegration />
      {children}
    </>
  );
}
