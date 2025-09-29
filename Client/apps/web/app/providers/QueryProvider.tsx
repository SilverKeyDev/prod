import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "../../../../packages/config/query/queryClient";

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * QueryProvider wraps the app with React Query's QueryClientProvider
 * This should be mounted after AuthProvider to ensure auth state is available
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
