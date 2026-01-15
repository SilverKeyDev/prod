import type { ReactNode } from "react";
import { useDocumentsStoreIntegration } from "../../../../../packages/hooks/store/documents/useDocumentsStoreIntegration";

export function DocsOnly({ children }: { children: ReactNode }) {
  // Initialize documents only on docs-related routes
  useDocumentsStoreIntegration();
  return <>{children}</>;
}
