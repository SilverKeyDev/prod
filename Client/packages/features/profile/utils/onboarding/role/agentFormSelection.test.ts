import { describe, expect, it } from "vitest";

import { effectiveIsAgentForOptionalBuyerUi, isAgentFormSelection } from "./agentFormSelection";

describe("isAgentFormSelection", () => {
  it("is true for agent onboarding answers", () => {
    expect(isAgentFormSelection("yes")).toBe(true);
    expect(isAgentFormSelection("am_agent")).toBe(true);
  });

  it("is false for non-agent or empty values", () => {
    expect(isAgentFormSelection("no")).toBe(false);
    expect(isAgentFormSelection(undefined)).toBe(false);
    expect(isAgentFormSelection("")).toBe(false);
  });
});

describe("effectiveIsAgentForOptionalBuyerUi", () => {
  it("is true when auth marks the user as an agent", () => {
    expect(effectiveIsAgentForOptionalBuyerUi({ authIsAgent: true, formIsAgent: "no" })).toBe(true);
  });

  it("is true when the form draft marks agent before auth updates", () => {
    expect(effectiveIsAgentForOptionalBuyerUi({ authIsAgent: false, formIsAgent: "yes" })).toBe(
      true
    );
  });

  it("is false when neither auth nor form indicates agent", () => {
    expect(effectiveIsAgentForOptionalBuyerUi({ authIsAgent: false, formIsAgent: "no" })).toBe(
      false
    );
  });
});
