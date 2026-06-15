import type { ReactNode } from "react";

import { useDocumentsStoreIntegration } from "@/features/documents/hooks/store";

export function DocsOnly({ children }: { children: ReactNode }) {
  // Initialize documents only on docs-related routes
  useDocumentsStoreIntegration();
  return <>{children}</>;
}
