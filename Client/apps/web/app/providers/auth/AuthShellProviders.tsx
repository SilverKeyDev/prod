import type { ReactNode } from "react";

import { useReportsStoreIntegration } from "../../../../../packages/hooks/store/useReportsStoreIntegration";
import { useSavedHomesStoreIntegration } from "../../../../../packages/hooks/store/useSavedHomesStoreIntegration";

/**
 * Full auth shell providers for standard and specialized routes
 * Includes all necessary store integrations: reports, saved homes
 * These integrations fetch and initialize data when the component mounts
 */
export function AuthShellProviders({ children }: { children: ReactNode }) {
  // Initialize reports data for authenticated routes
  useReportsStoreIntegration();

  // Initialize saved homes data for authenticated routes
  useSavedHomesStoreIntegration();

  return <>{children}</>;
}
