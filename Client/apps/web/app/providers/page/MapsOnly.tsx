import { Suspense, type ReactNode } from "react";

export function MapsOnly({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
