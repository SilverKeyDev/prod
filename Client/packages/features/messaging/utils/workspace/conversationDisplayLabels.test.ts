import { describe, expect, it } from "vitest";

import { workspaceConversationTitle } from "./conversationDisplayLabels";

describe("workspaceConversationTitle", () => {
  it("labels platform support by category", () => {
    expect(
      workspaceConversationTitle(
        { kind: "platform_support", support_category: "brokerage" },
        "Support"
      )
    ).toBe("Brokerage support");
    expect(
      workspaceConversationTitle(
        { kind: "platform_support", support_category: "integrator" },
        "Support"
      )
    ).toBe("Integrator support");
  });

  it("uses contact map for agent threads", () => {
    const names = new Map([["agent-1", "Jane Agent"]]);
    expect(
      workspaceConversationTitle(
        { kind: "brokerage_agent", agent_user_id: "agent-1" },
        "Agents",
        names
      )
    ).toBe("Jane Agent");
  });
});
