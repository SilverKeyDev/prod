import { describe, expect, it } from "vitest";

import type { AgentConversation } from "packages/api";
import type { OnboardingData } from "packages/features/profile/types/onboarding";

import {
  isChooseSearchAreaStepComplete,
  isDefineCriteriaStepComplete,
  isPartnerWithAgentStepComplete,
  isSetBudgetStepComplete,
  listConnectedAgentsForPartnerStep,
} from "./checklistIntegrationCompleteness";

const baseBudget: Partial<OnboardingData> = {
  home_budget_min: 400_000,
  home_budget_max: 800_000,
  gross_income: 120_000,
  down_payment: 80_000,
  credit_score_range: "720-740",
  ideal_zip_code: "94102",
};

describe("isSetBudgetStepComplete", () => {
  it("requires budget; income only when not paying cash", () => {
    expect(isSetBudgetStepComplete({})).toBe(false);
    expect(
      isSetBudgetStepComplete({
        home_budget_min: 100,
        home_budget_max: 200,
        paying_cash: true,
      })
    ).toBe(true);
    expect(
      isSetBudgetStepComplete({
        home_budget_min: 100,
        home_budget_max: 200,
        gross_income: 50_000,
        paying_cash: true,
      })
    ).toBe(true);
  });

  it("requires financing fields when not paying cash", () => {
    expect(
      isSetBudgetStepComplete({
        ...baseBudget,
        paying_cash: false,
        down_payment: undefined,
      })
    ).toBe(false);
    expect(
      isSetBudgetStepComplete({
        ...baseBudget,
        paying_cash: false,
        credit_score_range: "",
      })
    ).toBe(false);
    expect(isSetBudgetStepComplete({ ...baseBudget, paying_cash: false })).toBe(true);
  });

  it("does not require ideal_zip_code when financing", () => {
    const { ideal_zip_code: _z, ...withoutZip } = baseBudget;
    void _z;
    expect(isSetBudgetStepComplete({ ...withoutZip, paying_cash: false })).toBe(true);
  });

  it("skips financing extras when paying cash", () => {
    expect(
      isSetBudgetStepComplete({
        home_budget_min: 300_000,
        home_budget_max: 500_000,
        paying_cash: true,
      })
    ).toBe(true);
  });

  it("when paying cash, fails if not OK with HOA", () => {
    expect(
      isSetBudgetStepComplete({
        home_budget_min: 300_000,
        home_budget_max: 500_000,
        paying_cash: true,
        buyerPreferenceExtensions: {
          v: 1,
          price_financing: { hoa_ok: false },
        },
      })
    ).toBe(false);
  });
});

describe("isChooseSearchAreaStepComplete", () => {
  it("requires at least one address", () => {
    expect(isChooseSearchAreaStepComplete({})).toBe(false);
    expect(
      isChooseSearchAreaStepComplete({
        important_locations: [{ address: " 123 Main St " }],
      })
    ).toBe(true);
  });
});

describe("isPartnerWithAgentStepComplete", () => {
  const conv = (overrides: Partial<AgentConversation>): AgentConversation => ({
    id: "c1",
    agent_id: "a1",
    client_id: "u1",
    agent_name: "Pat Agent",
    agent_email: "pat@example.com",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-02T00:00:00.000Z",
    ...overrides,
  });

  it("requires at least one conversation", () => {
    expect(isPartnerWithAgentStepComplete([])).toBe(false);
    expect(isPartnerWithAgentStepComplete([conv({})])).toBe(true);
  });

  it("dedupes multiple conversations with the same agent", () => {
    const rows = [
      conv({ id: "c1", updated_at: "2024-01-01T00:00:00.000Z" }),
      conv({ id: "c2", updated_at: "2024-01-03T00:00:00.000Z" }),
    ];
    expect(listConnectedAgentsForPartnerStep(rows)).toHaveLength(1);
    expect(listConnectedAgentsForPartnerStep(rows)[0]?.displayName).toBe("Pat Agent");
  });
});

describe("isDefineCriteriaStepComplete", () => {
  const core: Partial<OnboardingData> = {
    preferred_housing_type: "single_family",
    must_have: ["garage"],
    other_requirements: ["no hoa"],
    walkability_importance: "somewhat_important",
    preferred_bedrooms_min: 2,
    preferred_bedrooms_max: 4,
    preferred_bathrooms_min: 2,
    preferred_bathrooms_max: 3,
  };

  it("passes when core fields are set", () => {
    expect(isDefineCriteriaStepComplete(core)).toBe(true);
  });

  it("fails when ranges invalid", () => {
    expect(
      isDefineCriteriaStepComplete({
        ...core,
        preferred_bedrooms_min: 5,
        preferred_bedrooms_max: 2,
      })
    ).toBe(false);
  });
});
