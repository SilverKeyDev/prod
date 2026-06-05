import { describe, expect, it } from "vitest";

import {
  buildOnboardingFlowFromOptions,
  buildPersonalizationFlowFromOptions,
  resolveTemplateId,
} from "./buildProfileFlow";

describe("resolveTemplateId", () => {
  it("maps shell workspace roles to dedicated onboarding templates", () => {
    expect(resolveTemplateId({ surface: "onboarding", primaryRole: "seller" })).toBe(
      "seller_onboarding"
    );
    expect(resolveTemplateId({ surface: "onboarding", primaryRole: "brokerage" })).toBe(
      "brokerage_onboarding"
    );
    expect(resolveTemplateId({ surface: "onboarding", primaryRole: "integration_partner" })).toBe(
      "integration_partner_onboarding"
    );
  });

  it("maps agent to agent_onboarding", () => {
    expect(resolveTemplateId({ surface: "onboarding", isAgent: true })).toBe("agent_onboarding");
    expect(resolveTemplateId({ surface: "onboarding", primaryRole: "agent" })).toBe(
      "agent_onboarding"
    );
  });

  it("defaults to buyer_onboarding", () => {
    expect(resolveTemplateId({ surface: "onboarding", primaryRole: "buyer" })).toBe(
      "buyer_onboarding"
    );
  });

  it("maps personalization by isAgent", () => {
    expect(resolveTemplateId({ surface: "personalization", isAgent: true })).toBe(
      "agent_personalization"
    );
    expect(resolveTemplateId({ surface: "personalization", isAgent: false })).toBe(
      "buyer_personalization"
    );
  });
});

describe("buildOnboardingFlowFromOptions", () => {
  it("seller flow includes shell setup step", () => {
    const ids = buildOnboardingFlowFromOptions({
      primaryRole: "seller",
      excludeFinancial: true,
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "seller_shell_setup"]);
  });

  it("brokerage flow includes shell setup step", () => {
    const ids = buildOnboardingFlowFromOptions({
      primaryRole: "brokerage",
      excludeFinancial: true,
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "brokerage_shell_setup"]);
  });

  it("integration partner flow includes shell setup step", () => {
    const ids = buildOnboardingFlowFromOptions({
      primaryRole: "integration_partner",
      excludeFinancial: true,
    }).map((s) => s.id);
    expect(ids).toEqual(["onboarding_role", "integration_partner_shell_setup"]);
  });

  it("excludes financial when excludeFinancial is true", () => {
    const ids = buildOnboardingFlowFromOptions({
      primaryRole: "buyer",
      excludeFinancial: true,
    }).map((s) => s.id);
    expect(ids).not.toContain("financial");
  });
});

describe("buildPersonalizationFlowFromOptions", () => {
  it("agent personalization includes agent sections and demographics", () => {
    const ids = buildPersonalizationFlowFromOptions({ isAgent: true }).map((s) => s.id);
    expect(ids).toContain("agent_brokerage");
    expect(ids).toContain("demographics");
    expect(ids).toContain("privacy_data");
    expect(ids).not.toContain("housing_essentials");
  });

  it("buyer personalization includes home search sections", () => {
    const ids = buildPersonalizationFlowFromOptions({ isAgent: false }).map((s) => s.id);
    expect(ids).toContain("housing_essentials");
    expect(ids).toContain("privacy_data");
  });
});
