import type { ReactNode } from "react";

// AuthProvider and UserProvider removed - using Zustand stores instead

import { ErrorProvider } from "./ErrorProvider";
import { QueryProvider } from "./QueryProvider";
import { ServiceProvider } from "../../core/contexts/ServiceContext";
import { ThemeProvider } from "../../core/contexts/ThemeContext";
import { LocalizationProvider } from "../../core/contexts/LocalizationContext";

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider>
      <QueryProvider>
        <ServiceProvider>
          <ThemeProvider>
            <LocalizationProvider>{children}</LocalizationProvider>
          </ThemeProvider>
        </ServiceProvider>
      </QueryProvider>
    </ErrorProvider>
  );
}
