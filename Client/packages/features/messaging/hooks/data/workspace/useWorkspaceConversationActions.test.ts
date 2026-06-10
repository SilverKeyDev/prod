import { createElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceConversationsApi } from "packages/features/messaging/api/workspaceConversations";

import { useWorkspaceConversationActions } from "./useWorkspaceConversationActions";

vi.mock("packages/features/messaging/api/workspaceConversations", () => ({
  workspaceConversationsApi: {
    createConversation: vi.fn(),
  },
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe("useWorkspaceConversationActions", () => {
  beforeEach(() => {
    vi.mocked(workspaceConversationsApi.createConversation).mockReset();
  });

  it("createSupportConversation uses integrator category for integrator persona", async () => {
    vi.mocked(workspaceConversationsApi.createConversation).mockResolvedValue({
      success: true,
      conversation: { id: "c-1", kind: "platform_support" },
    });

    const client = new QueryClient();
    const { result } = renderHook(() => useWorkspaceConversationActions("integrator"), {
      wrapper: wrapper(client),
    });

    await act(async () => {
      const conv = await result.current.createSupportConversation();
      expect(conv?.id).toBe("c-1");
    });

    expect(workspaceConversationsApi.createConversation).toHaveBeenCalledWith({
      kind: "platform_support",
      support_category: "integrator",
    });
  });
});
