import { describe, expect, it } from "vitest";

import { effectiveIsAgentForOptionalBuyerUi, isAgentFormSelection } from "./agentFormSelection";

describe("isAgentFormSelection", () => {
  it("is true when primary onboarding role is agent", () => {
    expect(isAgentFormSelection("agent")).toBe(true);
  });

  it("is false for non-agent or empty roles", () => {
    expect(isAgentFormSelection("buyer")).toBe(false);
    expect(isAgentFormSelection(undefined)).toBe(false);
  });
});

describe("effectiveIsAgentForOptionalBuyerUi", () => {
  it("is true when auth marks the user as an agent", () => {
    expect(
      effectiveIsAgentForOptionalBuyerUi({ authIsAgent: true, formPrimaryRole: "buyer" })
    ).toBe(true);
  });

  it("is true when the form draft marks agent before auth updates", () => {
    expect(
      effectiveIsAgentForOptionalBuyerUi({ authIsAgent: false, formPrimaryRole: "agent" })
    ).toBe(true);
  });

  it("is false when neither auth nor form indicates agent", () => {
    expect(
      effectiveIsAgentForOptionalBuyerUi({ authIsAgent: false, formPrimaryRole: "buyer" })
    ).toBe(false);
  });
});
