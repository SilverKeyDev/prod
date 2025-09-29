import type { ReactNode } from "react";
import { useBillingStoreIntegration } from "../../../../../packages/hooks/store/useBillingStoreIntegration";

export function BillingOnly({ children }: { children: ReactNode }) {
  // Initialize billing only on billing routes
  useBillingStoreIntegration();
  return <>{children}</>;
}
