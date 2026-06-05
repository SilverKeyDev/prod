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
    expect(ids).not.toContain("seller_shell_setup");
  });

  it("seller flow includes shell setup step", () => {
    const ids = getOnboardingSteps({
      excludeFinancial: true,
      isAgent: false,
      primaryRole: "seller",
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "seller_shell_setup"]);
  });

  it("brokerage flow includes shell setup step", () => {
    const ids = getOnboardingSteps({
      excludeFinancial: true,
      primaryRole: "brokerage",
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "brokerage_shell_setup"]);
  });

  it("integration partner flow includes shell setup step", () => {
    const ids = getOnboardingSteps({
      excludeFinancial: true,
      primaryRole: "integration_partner",
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "integration_partner_shell_setup"]);
  });

  it("agent flow includes agent professional steps", () => {
    const ids = getOnboardingSteps({ excludeFinancial: true, isAgent: true }).map((s) => s.id);
    expect(ids).toContain("agent_brokerage");
    expect(ids).not.toContain("housing_essentials");
  });
});
