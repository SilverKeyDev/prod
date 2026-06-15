import { createElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceConversationsApi } from "packages/features/messaging/api/workspaceConversations";

import { useWorkspaceEligibleContacts } from "./useWorkspaceEligibleContacts";

vi.mock("packages/features/messaging/api/workspaceConversations", () => ({
  workspaceConversationsApi: {
    listEligibleContacts: vi.fn(),
  },
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useWorkspaceEligibleContacts", () => {
  beforeEach(() => {
    vi.mocked(workspaceConversationsApi.listEligibleContacts).mockReset();
  });

  it("fetches and filters actionable contacts", async () => {
    vi.mocked(workspaceConversationsApi.listEligibleContacts).mockResolvedValue({
      success: true,
      contacts: [
        {
          contact_id: "agent-1",
          contact_type: "agent",
          display_name: "Agent",
          kind: "brokerage_agent",
          metadata: { brokerage_org_id: "org-1" },
        },
        {
          contact_id: "self",
          contact_type: "self_agent",
          display_name: "You",
          kind: "brokerage_agent",
        },
      ],
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useWorkspaceEligibleContacts(["brokerage_agent"]), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.contact_id).toBe("agent-1");
  });

  it("does not fetch when kinds array is empty", () => {
    const client = new QueryClient();
    renderHook(() => useWorkspaceEligibleContacts([]), { wrapper: wrapper(client) });
    expect(workspaceConversationsApi.listEligibleContacts).not.toHaveBeenCalled();
  });
});
