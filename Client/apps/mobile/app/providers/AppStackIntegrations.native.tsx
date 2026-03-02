import type { ReactNode } from "react";

import { useReportsStoreIntegration } from "packages/features/documents";
import { useSavedHomesStoreIntegration } from "packages/features/search";

/**
 * Runs store integrations (reports, saved homes) inside the App Stack.
 * useDataPolling and useDataInitialization depend on React Router; add RN equivalents later.
 * Only mount when user is authenticated (wraps the tab navigator).
 */
export function AppStackIntegrations({ children }: { children: ReactNode }) {
  useReportsStoreIntegration();
  useSavedHomesStoreIntegration();
  return <>{children}</>;
}
