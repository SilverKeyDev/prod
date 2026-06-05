import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { openAgentPublicProfileExternal } from "packages/utils/growth/agent";

import { AgentDiscoveryView } from "./AgentDiscoveryView";

const navigateToPath = vi.fn();
const getConnectionStatus = vi.fn(() => "none" as const);

let mockRecommendedAgents = [
  { id: "agent-new", name: "New Agent", email: "new@example.com" },
  { id: "agent-waiting", name: "Waiting Agent", email: "wait@example.com" },
];

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

vi.mock("packages/navigation", () => ({
  useNavigation: () => ({
    navigateToPath,
    getCurrentRoute: () => ({ pathname: "/checklist", search: "" }),
  }),
}));

vi.mock("@/features/agent/hooks/data/discovery/useAgentDiscoveryContext", () => ({
  useAgentDiscoveryContext: () => ({}),
}));

vi.mock("@/features/agent/hooks/data/discovery/useRecommendedAgents", () => ({
  useRecommendedAgents: () => ({
    recommendedAgents: mockRecommendedAgents,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/agent/hooks/data/connections/useAgentConnectionDisplayStatus", () => ({
  useAgentConnectionDisplayStatus: () => ({ getConnectionStatus }),
}));

vi.mock("@/features/agent/hooks/data/connections/useConnectionRequests", () => ({
  useConnectionRequests: () => ({
    createRequestAsInitiator: vi.fn(),
    isCreatingRequest: false,
  }),
}));

vi.mock("packages/hooks/data/auth/useUserData", () => ({
  useUserData: () => ({ userProfile: { id: "client-1" } }),
}));

vi.mock("packages/store", () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: { id: "client-1" } }),
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ enqueueToast: vi.fn() }),
}));

vi.mock("packages/utils/growth/agent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/utils/growth/agent")>();
  return { ...actual, openAgentPublicProfileExternal: vi.fn() };
});

vi.mock("@/features/agent/components/search/AgentDirectoryRow", () => ({
  AgentDirectoryRow: ({ agent }: { agent: { name: string } }) => (
    <div data-testid={`recommended-row-${agent.name}`}>{agent.name}</div>
  ),
}));

vi.mock("@/features/agent/components/search/AgentSearchContent", () => ({
  AgentSearchContent: ({
    onOpenAgentProfile,
  }: {
    onOpenAgentProfile?: (agent: { id: string; name: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onOpenAgentProfile?.({ id: "agent-1", name: "Taylor Agent" })}
    >
      trigger-open-profile
    </button>
  ),
}));

describe("AgentDiscoveryView", () => {
  beforeEach(() => {
    navigateToPath.mockClear();
    vi.mocked(openAgentPublicProfileExternal).mockClear();
    getConnectionStatus.mockReset();
    getConnectionStatus.mockImplementation(() => "none");
    mockRecommendedAgents = [
      { id: "agent-new", name: "New Agent", email: "new@example.com" },
      { id: "agent-waiting", name: "Waiting Agent", email: "wait@example.com" },
    ];
  });

  it("hides recommended agents that already have a connection relationship", () => {
    getConnectionStatus.mockImplementation((agentId: string) =>
      agentId === "agent-waiting" ? "pending" : "none"
    );
    render(<AgentDiscoveryView isActive />);
    expect(screen.getByTestId("recommended-row-New Agent")).toBeTruthy();
    expect(screen.queryByTestId("recommended-row-Waiting Agent")).toBeNull();
  });

  it("opens agent profile in a new tab when profileTarget is external", () => {
    render(<AgentDiscoveryView isActive profileTarget="external" />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-open-profile" }));
    expect(openAgentPublicProfileExternal).toHaveBeenCalledWith({
      id: "agent-1",
      name: "Taylor Agent",
    });
    expect(navigateToPath).not.toHaveBeenCalled();
  });

  it("navigates in-app when profileTarget is navigate (default)", () => {
    render(<AgentDiscoveryView isActive />);
    fireEvent.click(screen.getByRole("button", { name: "trigger-open-profile" }));
    expect(openAgentPublicProfileExternal).not.toHaveBeenCalled();
    expect(navigateToPath).toHaveBeenCalled();
  });
});
