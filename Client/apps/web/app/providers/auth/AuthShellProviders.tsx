import { type ReactNode, useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { prefetchLibraryRouteQueryData } from "packages/hooks/data/polling/libraryRouteDataPrefetch";
import { useSavedHomesStoreIntegration } from "packages/hooks/store";
import { useAgentDashboardStore, useAuthStore } from "packages/store";

import { useReportsStoreIntegration } from "@/features/documents/hooks/store/useReportsStoreIntegration";

/**
 * Single integration for saved homes: follows agent dashboard "view as client" selection
 * so Search, Saved, and Zustand stay aligned.
 */
function SavedHomesShellIntegration() {
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const clientId = selectedClientId ?? undefined;
  useSavedHomesStoreIntegration(clientId);

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !selectedClientId) return;
    void prefetchLibraryRouteQueryData(queryClient, user, selectedClientId, {
      includeFormsLibrary: false,
    });
  }, [queryClient, user, selectedClientId]);

  return null;
}

/**
 * Full auth shell providers for standard and specialized routes
 *
 * Note: Data is prefetched on login via useDataInitialization hook.
 * Store integrations sync React Query cache to Zustand where needed.
 * SavedHomesShellIntegration keeps favorites in sync via `useSavedHomesStoreIntegration` and
 * prefetches the document library when an agent selects a client so Library avoids a cold fetch.
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
