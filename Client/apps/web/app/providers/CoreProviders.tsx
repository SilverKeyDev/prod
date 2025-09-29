import type { ReactNode } from "react";

import { AuthProvider } from "./auth/AuthProvider";
import { ErrorProvider } from "./ErrorProvider";
import { QueryProvider } from "./QueryProvider";

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <QueryProvider>{children}</QueryProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}
