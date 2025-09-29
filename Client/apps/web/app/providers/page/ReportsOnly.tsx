import type { ReactNode } from "react";

// ReportsOnly provider removed - reports functionality now handled by useReportsStore
// The store integration is initialized in App.tsx
export function ReportsOnly({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
