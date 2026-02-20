import type { ReactNode } from "react";

import { LocalizationProvider } from "packages/contexts";

import { AuthProvider } from "./auth/AuthProvider";
import { ErrorProvider } from "./ErrorProvider";
import { QueryProvider } from "./QueryProvider";
import { ThemeProviderWeb } from "./theme";

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider>
      <ThemeProviderWeb>
        <AuthProvider>
          <QueryProvider>
            <LocalizationProvider>{children}</LocalizationProvider>
          </QueryProvider>
        </AuthProvider>
      </ThemeProviderWeb>
    </ErrorProvider>
  );
}
