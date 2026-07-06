import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "packages/config/query/keys";

import { googleCalendarApi } from "@/features/calendar/api";
import { GOOGLE_RECONNECT_REQUIRED } from "@/features/calendar/utils/core/googleCalendarReconnect";

import { useGoogleCalendarConnectionState } from "./googleCalendarIntegrationHelpers";

vi.mock("@/features/calendar/api", () => ({
  googleCalendarApi: {
    isConnected: vi.fn(),
    getOrCreateSilverKeyCalendar: vi.fn(),
    clearConnectionStatus: vi.fn(),
  },
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

function createQueryWrapper(): {
  wrapper: (props: { children: ReactNode }) => React.ReactElement;
  queryClient: QueryClient;
} {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe("useGoogleCalendarConnectionState reconnect handling", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(googleCalendarApi.isConnected).mockResolvedValue(true);
    vi.mocked(googleCalendarApi.getOrCreateSilverKeyCalendar).mockResolvedValue({
      success: false,
      error: GOOGLE_RECONNECT_REQUIRED,
      message: "Google Calendar reconnection required.",
    });
  });

  afterEach(() => {
    queryClient?.clear();
  });

  it("sets needsGoogleReconnect and clears stale connection state on GOOGLE_RECONNECT_REQUIRED", async () => {
    const ctx = createQueryWrapper();
    queryClient = ctx.queryClient;

    const { result } = renderHook(() => useGoogleCalendarConnectionState(true), {
      wrapper: ctx.wrapper,
    });

    await waitFor(() => {
      expect(result.current.needsGoogleReconnect).toBe(true);
    });

    expect(googleCalendarApi.clearConnectionStatus).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData([...queryKeys.googleCalendar.all, "connection"])).toBe(false);
  });
});
