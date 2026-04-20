import type { ReactNode } from "react";

import { useReportsStoreIntegration } from "packages/features/documents";
import { useSavedHomesStoreIntegration } from "packages/hooks/store";
import { useAgentDashboardStore } from "packages/store";

function SavedHomesShellIntegrationNative() {
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  useSavedHomesStoreIntegration(selectedClientId ?? undefined);
  return null;
}

/**
 * Runs store integrations (reports, saved homes) inside the App Stack.
 * useDataPolling and useDataInitialization depend on React Router; add RN equivalents later.
 * Only mount when user is authenticated (wraps the tab navigator).
 */
export function AppStackIntegrations({ children }: { children: ReactNode }) {
  useReportsStoreIntegration();
  return (
    <>
      <SavedHomesShellIntegrationNative />
      {children}
    </>
  );
}
