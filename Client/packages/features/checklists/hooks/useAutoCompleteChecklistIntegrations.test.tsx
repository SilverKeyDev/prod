import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConversation } from "packages/api";
import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";

import { useAutoCompleteChecklistIntegrations } from "./useAutoCompleteChecklistIntegrations";

const toggleItem = vi.fn().mockResolvedValue(undefined);

const agentChatsState = vi.hoisted(() => ({
  conversations: [] as AgentConversation[],
  isLoading: false,
}));

const userPreferences = {
  preferences_version: "v1",
  home_budget_min: 400_000,
  home_budget_max: 800_000,
  paying_cash: true,
};

vi.mock("packages/hooks/data/auth/useUserData", () => ({
  useUserPreferences: () => ({
    userPreferences,
    isLoading: false,
  }),
}));

vi.mock("packages/features/messaging/hooks/data/useAgentChats", () => ({
  useAgentChats: () => ({
    conversations: agentChatsState.conversations,
    isLoading: agentChatsState.isLoading,
  }),
}));

vi.mock("packages/features/profile", () => ({
  userPreferencesToOnboardingData: (prefs: Record<string, unknown>) => prefs,
}));

const transactionAddressState = vi.hoisted(() => ({
  data: null as { address: string } | null,
  isLoading: false,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey?: unknown[]; enabled?: boolean }) => {
    const key = options.queryKey?.[0];
    if (key === "transaction" && options.enabled !== false) {
      return {
        data: transactionAddressState.data,
        isLoading: transactionAddressState.isLoading,
      };
    }
    return { data: undefined, isLoading: false };
  },
}));

function budgetItem(id: number): TaskChecklistItem {
  return {
    id,
    label: "Set budget",
    explanation: "",
    component_key: "set_budget",
    completionRequiresSubmit: true,
    allow_unordered_check: true,
  };
}

function partnerAgentItem(id: number): TaskChecklistItem {
  return {
    id,
    label: "Partner with a real estate agent",
    explanation: "",
    component_key: "partner_agent",
    completionRequiresSubmit: true,
  };
}

function findingHomeItem(id: number): TaskChecklistItem {
  return {
    id,
    label: "Decide on a home",
    explanation: "",
    component_key: "finding_home",
    completionRequiresSubmit: true,
  };
}

describe("useAutoCompleteChecklistIntegrations", () => {
  beforeEach(() => {
    toggleItem.mockClear();
    agentChatsState.conversations = [];
    agentChatsState.isLoading = false;
    transactionAddressState.data = null;
    transactionAddressState.isLoading = false;
  });

  it("calls toggleItem when preferences satisfy an unchecked integration step", async () => {
    renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [budgetItem(5)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "search",
      })
    );

    await waitFor(() => {
      expect(toggleItem).toHaveBeenCalledWith(5);
    });
  });

  it("skips toggle when canMarkChecked is false", async () => {
    renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [budgetItem(5)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: false,
        }),
        roadmapTab: "search",
      })
    );

    await waitFor(() => {
      expect(toggleItem).not.toHaveBeenCalled();
    });
  });

  it("skips already-checked items", async () => {
    renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [budgetItem(5)],
        checkedIds: [5],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "search",
      })
    );

    await waitFor(() => {
      expect(toggleItem).not.toHaveBeenCalled();
    });
  });

  it("auto-completes partner_agent when a connected agent conversation exists", async () => {
    agentChatsState.conversations = [
      {
        agent_id: "agent-42",
        agent_name: "Taylor Agent",
        agent_email: "taylor@example.com",
        agent_profile_picture: null,
        updated_at: "2026-05-17T12:00:00Z",
      } as AgentConversation,
    ];

    renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [partnerAgentItem(3)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "search",
      })
    );

    await waitFor(() => {
      expect(toggleItem).toHaveBeenCalledWith(3);
    });
  });

  it("waits for agent chats to finish loading before partner_agent auto-complete", async () => {
    agentChatsState.isLoading = true;
    agentChatsState.conversations = [
      {
        agent_id: "agent-42",
        agent_name: "Taylor Agent",
        updated_at: "2026-05-17T12:00:00Z",
      } as AgentConversation,
    ];

    const { rerender } = renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [partnerAgentItem(3)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "search",
      })
    );

    await waitFor(() => {
      expect(toggleItem).not.toHaveBeenCalled();
    });

    agentChatsState.isLoading = false;
    rerender();

    await waitFor(() => {
      expect(toggleItem).toHaveBeenCalledWith(3);
    });
  });

  it("auto-completes finding_home when a transaction address is saved", async () => {
    transactionAddressState.data = { address: "123 Main St, San Francisco, CA 94102" };

    renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [findingHomeItem(1)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "offer",
      })
    );

    await waitFor(() => {
      expect(toggleItem).toHaveBeenCalledWith(1);
    });
  });

  it("waits for transaction address to finish loading before finding_home auto-complete", async () => {
    transactionAddressState.isLoading = true;
    transactionAddressState.data = { address: "123 Main St" };

    const { rerender } = renderHook(() =>
      useAutoCompleteChecklistIntegrations({
        items: [findingHomeItem(1)],
        checkedIds: [],
        toggleItem,
        getItemToggleEligibility: () => ({
          canCheck: false,
          canUncheck: false,
          canMarkChecked: true,
        }),
        roadmapTab: "offer",
      })
    );

    await waitFor(() => {
      expect(toggleItem).not.toHaveBeenCalled();
    });

    transactionAddressState.isLoading = false;
    rerender();

    await waitFor(() => {
      expect(toggleItem).toHaveBeenCalledWith(1);
    });
  });
});
