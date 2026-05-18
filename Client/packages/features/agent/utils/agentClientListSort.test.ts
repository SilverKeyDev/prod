import { describe, expect, it } from "vitest";

import type { AgentClient } from "packages/api";

import { getClientListActionInput } from "@/features/agent/utils/clientList/clientListActionPriority";

import {
  type AgentClientSortConversation,
  pipelineStageSortIndex,
  sortAgentClients,
} from "./agentClientListSort";

function client(
  partial: Partial<AgentClient> & Pick<AgentClient, "id" | "name" | "email">
): AgentClient {
  return {
    name: partial.name,
    email: partial.email,
    ...partial,
  };
}

describe("pipelineStageSortIndex", () => {
  it("maps known stages to stable ordering indices", () => {
    expect(pipelineStageSortIndex("search")).toBe(0);
    expect(pipelineStageSortIndex("offer")).toBe(1);
    expect(pipelineStageSortIndex("escrow")).toBe(2);
    expect(pipelineStageSortIndex("insurance")).toBe(5);
    expect(pipelineStageSortIndex("unknown")).toBe(6);
  });

  it("treats null and undefined as search", () => {
    expect(pipelineStageSortIndex(null)).toBe(0);
    expect(pipelineStageSortIndex(undefined)).toBe(0);
  });

  it("maps unknown strings to index 0 like search", () => {
    expect(pipelineStageSortIndex("not-a-stage")).toBe(0);
  });
});

describe("sortAgentClients", () => {
  it("sorts by name with email fallback when name is empty", () => {
    const a = client({
      id: "1",
      name: "",
      email: "zebra@example.com",
    });
    const b = client({
      id: "2",
      name: "",
      email: "alpha@example.com",
    });
    const out = sortAgentClients([a, b], "name", new Map());
    expect(out.map((c) => c.id)).toEqual(["2", "1"]);
  });

  it("sorts by pipeline stage then name", () => {
    const closing = client({
      id: "c",
      name: "Zed",
      email: "z@example.com",
      pipeline_stage: "closing",
    });
    const search = client({
      id: "a",
      name: "Amy",
      email: "a@example.com",
      pipeline_stage: "search",
    });
    const offer = client({
      id: "b",
      name: "Bob",
      email: "b@example.com",
      pipeline_stage: "offer",
    });
    const out = sortAgentClients([closing, search, offer], "stage", new Map());
    expect(out.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("ties same stage by name and treats unknown stage like search index", () => {
    const weird = client({
      id: "w",
      name: "Weird",
      email: "w@example.com",
      pipeline_stage: "custom" as AgentClient["pipeline_stage"],
    });
    const search = client({
      id: "s",
      name: "Sam",
      email: "s@example.com",
      pipeline_stage: "search",
    });
    const out = sortAgentClients([weird, search], "stage", new Map());
    expect(out.map((c) => c.id)).toEqual(["s", "w"]);
  });

  it("sorts by conversation recency then name", () => {
    const older = client({ id: "o", name: "Old", email: "o@example.com" });
    const newer = client({ id: "n", name: "New", email: "n@example.com" });
    const map = new Map<string, AgentClientSortConversation>([
      ["o", { last_message_at: "2024-01-01T00:00:00.000Z", updated_at: null, last_message: null }],
      ["n", { last_message_at: "2024-06-01T00:00:00.000Z", updated_at: null, last_message: null }],
    ]);
    const out = sortAgentClients([older, newer], "recent", map);
    expect(out.map((c) => c.id)).toEqual(["n", "o"]);
  });

  it("uses updated_at when last_message_at is absent", () => {
    const a = client({ id: "a", name: "A", email: "a@example.com" });
    const b = client({ id: "b", name: "B", email: "b@example.com" });
    const map = new Map<string, AgentClientSortConversation>([
      ["a", { last_message_at: null, updated_at: "2024-03-01T00:00:00.000Z", last_message: null }],
      ["b", { last_message_at: null, updated_at: "2024-04-01T00:00:00.000Z", last_message: null }],
    ]);
    const out = sortAgentClients([a, b], "recent", map);
    expect(out.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("breaks recency ties by name", () => {
    const b = client({ id: "b", name: "Bob", email: "b@example.com" });
    const a = client({ id: "a", name: "Amy", email: "a@example.com" });
    const t = "2024-01-01T00:00:00.000Z";
    const map = new Map<string, AgentClientSortConversation>([
      ["a", { last_message_at: t, updated_at: null, last_message: null }],
      ["b", { last_message_at: t, updated_at: null, last_message: null }],
    ]);
    const out = sortAgentClients([b, a], "recent", map);
    expect(out.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("sorts action-required clients before others, then by recency", () => {
    const quiet = client({ id: "q", name: "Quiet", email: "q@example.com" });
    const active = client({
      id: "a",
      name: "Active",
      email: "a@example.com",
      requires_signature: true,
    });
    const map = new Map<string, AgentClientSortConversation>([
      ["q", { last_message_at: "2024-09-01T00:00:00.000Z", updated_at: null, last_message: null }],
      ["a", { last_message_at: "2024-01-01T00:00:00.000Z", updated_at: null, last_message: null }],
    ]);
    const getAction = (c: AgentClient) =>
      getClientListActionInput(c, map.get(c.id)?.unread_count ?? 0);
    const out = sortAgentClients([quiet, active], "recent", map, getAction);
    expect(out.map((c) => c.id)).toEqual(["a", "q"]);
  });

  it("uses current_phase for stage sort when present", () => {
    const searchPhase = client({
      id: "s",
      name: "Sam",
      email: "s@example.com",
      pipeline_stage: "closing",
      current_phase: "search",
    });
    const closing = client({
      id: "c",
      name: "Cal",
      email: "c@example.com",
      pipeline_stage: "search",
      current_phase: "closing",
    });
    const out = sortAgentClients([closing, searchPhase], "stage", new Map());
    expect(out.map((c) => c.id)).toEqual(["s", "c"]);
  });
});
