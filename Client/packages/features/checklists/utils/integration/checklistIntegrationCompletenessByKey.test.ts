import { describe, expect, it } from "vitest";

import {
  isChecklistIntegrationStepComplete,
  isPreferenceBackedChecklistIntegrationKey,
} from "./checklistIntegrationCompletenessByKey";

describe("isPreferenceBackedChecklistIntegrationKey", () => {
  it("recognizes preference-backed keys", () => {
    expect(isPreferenceBackedChecklistIntegrationKey("set_budget")).toBe(true);
    expect(isPreferenceBackedChecklistIntegrationKey("partner_agent")).toBe(false);
  });
});

describe("isChecklistIntegrationStepComplete", () => {
  it("evaluates set_budget from form data", () => {
    expect(
      isChecklistIntegrationStepComplete(
        "set_budget",
        {
          home_budget_min: 200_000,
          home_budget_max: 400_000,
          paying_cash: true,
        },
        []
      )
    ).toBe(true);
  });

  it("evaluates define_criteria with housing essentials only", () => {
    expect(
      isChecklistIntegrationStepComplete(
        "define_criteria",
        {
          preferred_housing_type: "single_family",
          preferred_bedrooms_min: 2,
          preferred_bathrooms_min: 2,
        },
        []
      )
    ).toBe(true);
  });

  it("evaluates partner_agent from messaging conversations only", () => {
    expect(isChecklistIntegrationStepComplete("partner_agent", null, [])).toBe(false);
    expect(
      isChecklistIntegrationStepComplete(
        "partner_agent",
        { home_budget_min: 1, home_budget_max: 2 },
        [
          {
            id: "c1",
            agent_id: "a1",
            client_id: "u1",
            created_at: "2024-01-01T00:00:00.000Z",
            updated_at: "2024-01-02T00:00:00.000Z",
          },
        ]
      )
    ).toBe(true);
  });
});
