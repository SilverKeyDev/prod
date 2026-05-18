import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PartnerAgentConnectedAgentsSection from "./PartnerAgentConnectedAgentsSection";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) =>
      ({
        "checklists.partner_agent.connected_section_title": "Connected agents",
        "checklists.partner_agent.empty_state":
          "When an agent accepts your connection request, they will appear here.",
      })[key] ?? key,
  }),
}));

vi.mock("@/features/agent/components/search/AgentConnectionStatusBadge", () => ({
  AgentConnectionStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="connection-status-badge">{status}</span>
  ),
}));

describe("PartnerAgentConnectedAgentsSection", () => {
  it("shows empty state when there are no connected agents", () => {
    render(<PartnerAgentConnectedAgentsSection agents={[]} />);
    expect(screen.getByRole("heading", { name: "Connected agents" })).toBeTruthy();
    expect(
      screen.getByText("When an agent accepts your connection request, they will appear here.")
    ).toBeTruthy();
  });

  it("lists connected agents with their connection status badge", () => {
    render(
      <PartnerAgentConnectedAgentsSection
        agents={[
          {
            agentId: "a1",
            displayName: "Pat Agent",
            email: "pat@example.com",
            profilePictureUrl: null,
            connectionStatus: "accepted",
          },
          {
            agentId: "a2",
            displayName: "Waiting Agent",
            email: null,
            profilePictureUrl: null,
            connectionStatus: "pending",
          },
        ]}
      />
    );
    expect(screen.getByText("Pat Agent")).toBeTruthy();
    expect(screen.getByText("pat@example.com")).toBeTruthy();
    expect(screen.getByText("Waiting Agent")).toBeTruthy();
    const badges = screen.getAllByTestId("connection-status-badge");
    expect(badges.map((b) => b.textContent).sort()).toEqual(["accepted", "pending"]);
  });
});
