import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useCalendarEventRequestForm } from "./useCalendarEventRequestForm";

const mockClients = [{ id: "client-1", name: "Alex", email: "alex@example.com" }];

vi.mock("@/features/agent/hooks/data/clients/useAgentClients", () => ({
  useAgentClients: () => ({
    clients: mockClients,
    isLoading: false,
  }),
}));

vi.mock("packages/hooks/store", () => ({
  useIsAgent: () => true,
}));

vi.mock("packages/hooks/data/user/useClientSettings", () => ({
  useClientSettings: () => ({ clientSettings: { viewing_tour: { anchors: [] } } }),
}));

vi.mock("packages/features/messaging/hooks/data/useAgentChats", () => ({
  useAgentChats: () => ({ conversations: [], sendMessage: vi.fn() }),
}));

vi.mock("packages/hooks/data/calendar/useEventRequestScheduleAvailability", () => ({
  useEventRequestScheduleAvailability: () => ({
    dateOptions: [],
    buildTimeOptionsForDate: () => [],
    isLoading: false,
  }),
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: "agent-1" } }),
  useUIStore: (selector: (s: { enqueueToast: () => void }) => unknown) =>
    selector({ enqueueToast: vi.fn() }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useCalendarEventRequestForm", () => {
  it("initializes with agent clients and no selected client", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() => useCalendarEventRequestForm({ onClose }), { wrapper });

    expect(result.current.isAgent).toBe(true);
    expect(result.current.clients).toEqual(mockClients);
    expect(result.current.selectedClientId).toBeNull();
    expect(result.current.isSending).toBe(false);
  });
});
