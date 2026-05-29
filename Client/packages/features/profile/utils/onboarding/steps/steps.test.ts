import { describe, expect, it } from "vitest";

import { getOnboardingSteps } from "./steps";

describe("getOnboardingSteps", () => {
  it("buyer flow includes housing and location steps", () => {
    const ids = getOnboardingSteps({ excludeFinancial: true, primaryRole: "buyer" }).map(
      (s) => s.id
    );
    expect(ids[0]).toBe("onboarding_role");
    expect(ids).toContain("housing_essentials");
    expect(ids).toContain("location");
    expect(ids).not.toContain("seller_shell");
  });

  it("seller flow is role picker only", () => {
    const ids = getOnboardingSteps({
      excludeFinancial: true,
      isAgent: false,
      primaryRole: "seller",
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role"]);
  });

  it("agent flow includes agent professional steps", () => {
    const ids = getOnboardingSteps({ excludeFinancial: true, isAgent: true }).map((s) => s.id);
    expect(ids).toContain("agent_brokerage");
    expect(ids).not.toContain("housing_essentials");
  });

  it("integration_partner is role-picker only when draft role is set", () => {
    const ids = getOnboardingSteps({
      excludeFinancial: true,
      primaryRole: "integration_partner",
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role"]);
  });
});
