import { describe, expect, it } from "vitest";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";

import {
  canSendConnectionRequest,
  indexInitiatedRequestsByAgentId,
  resolveAgentConnectionDisplayStatus,
} from "./connectionRequestStatus";

function req(
  partial: Partial<AgentConnectionRequest> & Pick<AgentConnectionRequest, "agent_id" | "status">
): AgentConnectionRequest {
  return {
    id: partial.id ?? "req-1",
    agent_id: partial.agent_id,
    client_id: partial.client_id ?? "client-1",
    requested_by_agent: partial.requested_by_agent ?? false,
    status: partial.status,
    created_at: partial.created_at ?? "2024-01-01T00:00:00.000Z",
    message: partial.message ?? null,
    other_party_name: partial.other_party_name ?? null,
    other_party_email: partial.other_party_email ?? null,
  };
}

describe("resolveAgentConnectionDisplayStatus", () => {
  it("returns accepted when agent is in messaging graph", () => {
    const status = resolveAgentConnectionDisplayStatus(
      "agent-a",
      new Set(["agent-a"]),
      new Map([["agent-a", req({ agent_id: "agent-a", status: "pending" })]])
    );
    expect(status).toBe("accepted");
  });

  it("returns pending for latest initiated pending request", () => {
    const byAgent = indexInitiatedRequestsByAgentId([
      req({ agent_id: "agent-a", status: "rejected", created_at: "2024-01-01T00:00:00.000Z" }),
      req({ agent_id: "agent-a", status: "pending", created_at: "2024-02-01T00:00:00.000Z" }),
    ]);
    expect(resolveAgentConnectionDisplayStatus("agent-a", new Set(), byAgent)).toBe("pending");
  });

  it("returns declined for rejected request", () => {
    const byAgent = indexInitiatedRequestsByAgentId([
      req({ agent_id: "agent-a", status: "rejected" }),
    ]);
    expect(resolveAgentConnectionDisplayStatus("agent-a", new Set(), byAgent)).toBe("declined");
  });

  it("allows connect when none or declined", () => {
    expect(canSendConnectionRequest("none")).toBe(true);
    expect(canSendConnectionRequest("declined")).toBe(true);
    expect(canSendConnectionRequest("pending")).toBe(false);
    expect(canSendConnectionRequest("accepted")).toBe(false);
  });

  it("returns accepted from initiated request when not yet in conversations", () => {
    const byAgent = indexInitiatedRequestsByAgentId([
      req({ agent_id: "agent-a", status: "accepted" }),
    ]);
    expect(resolveAgentConnectionDisplayStatus("agent-a", new Set(), byAgent)).toBe("accepted");
  });

  it("returns none when agent has no requests", () => {
    expect(resolveAgentConnectionDisplayStatus("agent-x", new Set(), new Map())).toBe("none");
  });
});

describe("indexInitiatedRequestsByAgentId", () => {
  it("keeps the latest request per agent by created_at", () => {
    const map = indexInitiatedRequestsByAgentId([
      req({
        id: "old",
        agent_id: "a1",
        status: "rejected",
        created_at: "2024-01-01T00:00:00.000Z",
      }),
      req({ id: "new", agent_id: "a1", status: "pending", created_at: "2024-03-01T00:00:00.000Z" }),
      req({ agent_id: "a2", status: "pending" }),
    ]);
    expect(map.get("a1")?.id).toBe("new");
    expect(map.get("a2")?.status).toBe("pending");
  });
});
