import { describe, expect, it } from "vitest";

import type {
  EligibleContact,
  WorkspaceConversation,
} from "packages/features/messaging/api/workspaceConversations";

import {
  eligibleContactsWithoutOpenThread,
  findPlatformSupportConversation,
  nonSupportConversations,
} from "./pinnedSupportSidebar";

function conv(partial: Partial<WorkspaceConversation> & { id: string; kind: string }) {
  return partial as WorkspaceConversation;
}

describe("pinnedSupportSidebar helpers", () => {
  it("finds the platform support conversation", () => {
    const support = conv({ id: "s1", kind: "platform_support" });
    const agent = conv({ id: "a1", kind: "brokerage_agent", agent_user_id: "u1" });
    expect(findPlatformSupportConversation([agent, support])).toEqual(support);
    expect(findPlatformSupportConversation([agent])).toBeUndefined();
  });

  it("excludes support from flat inbox list", () => {
    const support = conv({ id: "s1", kind: "platform_support" });
    const agent = conv({ id: "a1", kind: "brokerage_agent", agent_user_id: "u1" });
    expect(nonSupportConversations([support, agent])).toEqual([agent]);
  });

  it("filters contacts that already have an open thread", () => {
    const contacts: EligibleContact[] = [
      {
        kind: "brokerage_agent",
        contact_id: "agent-1",
        contact_type: "user",
        display_name: "Jane",
      },
      {
        kind: "brokerage_agent",
        contact_id: "agent-2",
        contact_type: "user",
        display_name: "Bob",
      },
    ];
    const conversations = [conv({ id: "c1", kind: "brokerage_agent", agent_user_id: "agent-1" })];
    expect(
      eligibleContactsWithoutOpenThread(contacts, conversations).map((c) => c.contact_id)
    ).toEqual(["agent-2"]);
  });
});
