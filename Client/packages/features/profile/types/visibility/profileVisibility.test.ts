import { describe, expect, it } from "vitest";

import { shouldShowAgentOptionalBuyerCallout } from "./profileVisibility";

describe("shouldShowAgentOptionalBuyerCallout", () => {
  it("shows only on onboarding when the user is an agent", () => {
    expect(
      shouldShowAgentOptionalBuyerCallout({
        surface: "onboarding",
        authIsAgent: true,
        formPrimaryRole: undefined,
      })
    ).toBe(true);
    expect(
      shouldShowAgentOptionalBuyerCallout({
        surface: "onboarding",
        authIsAgent: false,
        formPrimaryRole: "agent",
      })
    ).toBe(true);
  });

  it("hides on profile and settings surfaces even for agents", () => {
    expect(
      shouldShowAgentOptionalBuyerCallout({
        surface: "personalization",
        authIsAgent: true,
      })
    ).toBe(false);
    expect(
      shouldShowAgentOptionalBuyerCallout({
        surface: "settings_modal",
        authIsAgent: true,
        formPrimaryRole: "agent",
      })
    ).toBe(false);
  });

  it("hides on onboarding when the user is not an agent", () => {
    expect(
      shouldShowAgentOptionalBuyerCallout({
        surface: "onboarding",
        authIsAgent: false,
        formPrimaryRole: "buyer",
      })
    ).toBe(false);
  });
});
