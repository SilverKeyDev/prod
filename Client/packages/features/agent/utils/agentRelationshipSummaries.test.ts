import { describe, expect, it } from "vitest";

import type { AgentConversation } from "packages/api";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";

import {
  hasAgentConnectionRelationship,
  listAgentRelationshipSummaries,
} from "./agentRelationshipSummaries";

const conversation: AgentConversation = {
  id: "conv-1",
  agent_id: "agent-accepted",
  client_id: "client-1",
  agent_name: "Accepted Agent",
  agent_email: "accepted@example.com",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
};

function request(
  agentId: string,
  status: AgentConnectionRequest["status"],
  name: string
): AgentConnectionRequest {
  return {
    id: `req-${agentId}`,
    agent_id: agentId,
    client_id: "client-1",
    requested_by_agent: false,
    status,
    created_at: "2024-01-03T00:00:00.000Z",
    other_party_name: name,
    other_party_email: `${agentId}@example.com`,
  };
}

describe("hasAgentConnectionRelationship", () => {
  it("is false only for none", () => {
    expect(hasAgentConnectionRelationship("none")).toBe(false);
    expect(hasAgentConnectionRelationship("pending")).toBe(true);
    expect(hasAgentConnectionRelationship("accepted")).toBe(true);
    expect(hasAgentConnectionRelationship("declined")).toBe(true);
  });
});

describe("listAgentRelationshipSummaries", () => {
  it("includes messaging connections and pending or declined requests", () => {
    const summaries = listAgentRelationshipSummaries(
      [conversation],
      [
        request("agent-pending", "pending", "Waiting Agent"),
        request("agent-declined", "rejected", "Declined Agent"),
      ]
    );

    expect(summaries.map((s) => s.agentId).sort()).toEqual([
      "agent-accepted",
      "agent-declined",
      "agent-pending",
    ]);
    expect(summaries.find((s) => s.agentId === "agent-pending")?.connectionStatus).toBe("pending");
    expect(summaries.find((s) => s.agentId === "agent-declined")?.connectionStatus).toBe(
      "declined"
    );
    expect(summaries.find((s) => s.agentId === "agent-accepted")?.connectionStatus).toBe(
      "accepted"
    );
  });

  it("prefers conversation profile fields when both conversation and request exist", () => {
    const summaries = listAgentRelationshipSummaries(
      [conversation],
      [request("agent-accepted", "accepted", "Other Name")]
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.displayName).toBe("Accepted Agent");
    expect(summaries[0]?.email).toBe("accepted@example.com");
  });
});
