import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConversation } from "packages/api";

import PartnerAgentSection from "./PartnerAgentSection";

const showWarningToast = vi.fn();
const refreshChats = vi.fn();
let capturedDiscoveryProps: Record<string, unknown> | null = null;

let mockConversations: AgentConversation[] = [
  {
    id: "conv-1",
    agent_id: "agent-1",
    client_id: "client-1",
    agent_name: "Pat Agent",
    agent_email: "pat@example.com",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
  },
];

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) =>
      ({
        "checklists.partner_agent.intro":
          "Search for an agent to send a connection request. After they accept, they appear under Connected agents and you can submit this step.",
        "checklists.partner_agent.incomplete_warning":
          "Connect with at least one agent (accepted request) before submitting.",
      })[key] ?? key,
  }),
}));

vi.mock("packages/hooks/ui/toast/useToast", () => ({
  showWarningToast: (...args: unknown[]) => showWarningToast(...args),
}));

vi.mock("packages/features/messaging/hooks/data/useAgentChats", () => ({
  useAgentChats: () => ({
    conversations: mockConversations,
    refreshChats,
  }),
}));

const mockInitiatedRequests = vi.hoisted(() => [] as Array<Record<string, unknown>>);
const invalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  };
});

vi.mock("@/features/agent/hooks/data/connections/useInitiatedConnectionRequests", () => ({
  initiatedConnectionRequestsQueryKey: ["agent", "connection-requests", "initiated"],
  useInitiatedConnectionRequests: () => ({
    requests: mockInitiatedRequests,
    isLoading: false,
  }),
}));

vi.mock("@/features/agent/components/agentDiscovery/AgentDiscoveryView", () => ({
  AgentDiscoveryView: (props: Record<string, unknown>) => {
    capturedDiscoveryProps = props;
    return <div data-testid="agent-discovery-view" />;
  },
}));

vi.mock("./PartnerAgentConnectedAgentsSection", () => ({
  default: ({ agents }: { agents: { displayName: string }[] }) => (
    <div data-testid="connected-agents-section">{agents.map((a) => a.displayName).join(",")}</div>
  ),
}));

vi.mock("packages/features/checklists/components/steps/ChecklistStepSubmitFooter", () => ({
  ChecklistStepSubmitFooter: ({
    disabled,
    onSubmit,
  }: {
    disabled?: boolean;
    onSubmit?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onSubmit}>
      Submit step
    </button>
  ),
}));

describe("PartnerAgentSection", () => {
  beforeEach(() => {
    mockConversations = [
      {
        id: "conv-1",
        agent_id: "agent-1",
        client_id: "client-1",
        agent_name: "Pat Agent",
        agent_email: "pat@example.com",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
    ];
    mockInitiatedRequests.length = 0;
    showWarningToast.mockClear();
    refreshChats.mockClear();
    invalidateQueries.mockClear();
    capturedDiscoveryProps = null;
  });

  it("renders intro, discovery (external profiles), connected agents, and submit", () => {
    render(<PartnerAgentSection onComplete={vi.fn()} />);
    expect(
      screen.getByText(
        "Search for an agent to send a connection request. After they accept, they appear under Connected agents and you can submit this step."
      )
    ).toBeTruthy();
    expect(screen.getByTestId("agent-discovery-view")).toBeTruthy();
    expect(screen.getByTestId("connected-agents-section").textContent).toBe("Pat Agent");
    expect(capturedDiscoveryProps).toMatchObject({
      isActive: true,
      profileTarget: "external",
    });
  });

  it("enables submit when at least one connected agent exists", () => {
    render(<PartnerAgentSection onComplete={vi.fn()} />);
    expect(
      (screen.getByRole("button", { name: "Submit step" }) as HTMLButtonElement).disabled
    ).toBe(false);
  });

  it("calls onComplete when submit is clicked and step is complete", () => {
    const onComplete = vi.fn();
    render(<PartnerAgentSection onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: "Submit step" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(showWarningToast).not.toHaveBeenCalled();
  });

  it("refreshes chats after a connection request is sent from discovery", () => {
    render(<PartnerAgentSection onComplete={vi.fn()} />);
    const onConnectionSuccess = capturedDiscoveryProps?.onConnectionSuccess as
      | (() => void)
      | undefined;
    expect(onConnectionSuccess).toBeTypeOf("function");
    onConnectionSuccess?.();
    expect(refreshChats).toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalled();
  });

  it("lists pending connection requests under connected agents", () => {
    mockConversations = [];
    mockInitiatedRequests.push({
      id: "req-1",
      agent_id: "agent-pending",
      client_id: "client-1",
      requested_by_agent: false,
      status: "pending",
      created_at: "2024-01-03T00:00:00.000Z",
      other_party_name: "Waiting Agent",
      other_party_email: "wait@example.com",
    });
    render(<PartnerAgentSection onComplete={vi.fn()} />);
    expect(screen.getByTestId("connected-agents-section").textContent).toBe("Waiting Agent");
  });

  it("disables submit when no accepted connection exists", () => {
    mockConversations = [];
    render(<PartnerAgentSection onComplete={vi.fn()} />);
    const submit = screen.getByRole("button", { name: "Submit step" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });
});
