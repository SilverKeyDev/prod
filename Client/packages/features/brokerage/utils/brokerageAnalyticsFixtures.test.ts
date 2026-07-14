import { describe, expect, it } from "vitest";

import { isBlendedScoreConsistent } from "packages/features/brokerage/utils/analytics/flightRiskFactors";
import {
  BROKERAGE_AGENT_RETENTION_FIXTURE,
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { DEMO_AGENT_COUNT } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

describe("brokerageAnalyticsFixtures roster", () => {
  it("materializes the full demo agent count", () => {
    expect(BROKERAGE_AGENTS_FIXTURE).toHaveLength(DEMO_AGENT_COUNT);
    expect(new Set(BROKERAGE_AGENTS_FIXTURE.map((a) => a.id)).size).toBe(DEMO_AGENT_COUNT);
  });
});

describe("brokerageAnalyticsFixtures copy", () => {
  it("has no em-dashes in retention recommended_action strings", () => {
    for (const agent of BROKERAGE_AGENT_RETENTION_FIXTURE.agents) {
      expect(agent.recommended_action).not.toMatch(/—/);
    }
  });

  it("has no em-dashes in engagement suggested_action strings", () => {
    for (const agent of BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE.flagged_agents) {
      expect(agent.suggested_action).not.toMatch(/—/);
    }
  });
});

describe("brokerageAnalyticsFixtures retention ML scores", () => {
  it("describes blended ML methodology", () => {
    expect(BROKERAGE_AGENT_RETENTION_FIXTURE.methodology).toMatch(/blended ML score/i);
    expect(BROKERAGE_AGENT_RETENTION_FIXTURE.methodology).toMatch(/equal-weight/i);
  });

  it("keeps risk_score as rounded mean of factor_scores", () => {
    for (const agent of BROKERAGE_AGENT_RETENTION_FIXTURE.agents) {
      expect(isBlendedScoreConsistent(agent.risk_score, agent.factor_scores)).toBe(true);
    }
  });
});
