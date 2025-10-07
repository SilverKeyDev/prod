import type { ReactNode } from "react";

import { useReportsStoreIntegration } from "../../../../../packages/hooks/store/useReportsStoreIntegration";

/**
 * Full auth shell providers for standard and specialized routes
 * Includes reports store integration for authenticated routes
 * These integrations fetch and initialize data when the component mounts
 */
export function AuthShellProviders({ children }: { children: ReactNode }) {
  // Initialize reports data for authenticated routes
  useReportsStoreIntegration();

  return <>{children}</>;
}
