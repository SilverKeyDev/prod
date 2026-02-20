import { type ReactNode, Suspense } from "react";

export function MapsOnly({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
