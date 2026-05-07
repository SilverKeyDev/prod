import type { ReactNode } from "react";

import { useResumePendingAgentPublicConnect } from "packages/features/agent";
import { useReportsStoreIntegration } from "packages/features/documents";
import { useSavedHomesStoreIntegration } from "packages/hooks/store";
import { useAgentDashboardStore } from "packages/store";

function SavedHomesShellIntegrationNative() {
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  useSavedHomesStoreIntegration(selectedClientId ?? undefined);
  return null;
}

/**
 * Runs store integrations (reports, saved homes, pending agent connect) inside
 * the App Stack. Only mounted when the user is authenticated (wraps the tab navigator).
 */
export function AppStackIntegrations({ children }: { children: ReactNode }) {
  useReportsStoreIntegration();
  useResumePendingAgentPublicConnect();
  return (
    <>
      <SavedHomesShellIntegrationNative />
      {children}
    </>
  );
}
