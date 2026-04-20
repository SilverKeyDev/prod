import { describe, expect, it } from "vitest";

import { buildAgentPublicProfileViewModel } from "./agentPublicProfileViewModel";

describe("buildAgentPublicProfileViewModel", () => {
  it("derives contact and MLS cards", () => {
    const model = buildAgentPublicProfileViewModel(
      {
        id: "u1",
        name: "Test Agent",
        email: "a@b.co",
        phone: "(555) 111-2222",
        mls_id: "X1",
        mls_affiliations: [{ mls_id: "A", name: "Board" }],
      },
      "Fallback"
    );
    expect(model.displayName).toBe("Test Agent");
    expect(model.hasContact).toBe(true);
    expect(model.telHref).toBe("tel:5551112222");
    expect(model.mlsCards.length).toBe(1);
    expect(model.mlsCards[0].map((r) => r.label)).toContain("Mls Id");
    expect(model.mlsCards[0].map((r) => r.label)).toContain("Name");
  });

  it("uses fallback display name", () => {
    const model = buildAgentPublicProfileViewModel(
      {
        id: "u1",
        name: "",
        email: "a@b.co",
      },
      "Agent"
    );
    expect(model.displayName).toBe("Agent");
  });
});
