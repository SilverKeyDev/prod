import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { useAuthStore } from "packages/store";

export function mockAuthSelectors(
  partial: { isAuthenticated?: boolean; authReady?: boolean } = {}
): void {
  const isAuthenticated = partial.isAuthenticated ?? true;
  const authReady = partial.authReady ?? true;
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({
      isAuthenticated,
      authReady,
    } as ReturnType<typeof useAuthStore>)
  );
}

export function createUserDataTestQueryContext(): {
  createWrapper: () => (props: { children: ReactNode }) => React.ReactElement;
  getQueryClient: () => QueryClient | undefined;
} {
  let queryClient: QueryClient | undefined;
  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient! }, children);
  };
  return { createWrapper, getQueryClient: () => queryClient };
}
