import { describe, expect, it } from "vitest";

import type { WorkspaceConversation } from "packages/features/messaging/api/workspaceConversations";
import {
  mapWorkspaceMessagesToChatMessages,
  workspaceConversationDisplayName,
  workspaceConversationToPseudoAgentConversation,
} from "packages/features/messaging/hooks/data/workspace/workspaceUnifiedMessagingMap";

describe("workspaceUnifiedMessagingMap", () => {
  it("maps own messages to user role and others to agent", () => {
    const mapped = mapWorkspaceMessagesToChatMessages(
      [
        {
          id: "1",
          message: "hello",
          role: "brokerage_admin",
          sender_id: "me",
          timestamp: "2026-01-01T12:00:00Z",
        },
        {
          id: "2",
          message: "hi",
          role: "support",
          sender_id: "admin",
          timestamp: "2026-01-01T12:01:00Z",
        },
      ],
      "me"
    );
    expect(mapped[0]?.role).toBe("user");
    expect(mapped[0]?.content).toBe("hello");
    expect(mapped[1]?.role).toBe("agent");
  });

  it("uses pinned support title for platform_support display name", () => {
    const conv = {
      id: "s1",
      kind: "platform_support",
      support_category: "brokerage",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as WorkspaceConversation;
    expect(workspaceConversationDisplayName(conv, new Map(), "SilverKey support")).toBe(
      "SilverKey support"
    );
  });

  it("builds a pseudo AgentConversation for Unified chrome", () => {
    const conv = {
      id: "c1",
      kind: "brokerage_agent",
      agent_user_id: "a1",
      subject_user_id: "u1",
      last_message: "yo",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    } as WorkspaceConversation;
    const pseudo = workspaceConversationToPseudoAgentConversation(conv, "Jane Agent");
    expect(pseudo.id).toBe("c1");
    expect(pseudo.agent_name).toBe("Jane Agent");
    expect(pseudo.agent_id).toBe("a1");
    expect(pseudo.client_id).toBe("u1");
    expect(pseudo.last_message).toBe("yo");
  });
});
