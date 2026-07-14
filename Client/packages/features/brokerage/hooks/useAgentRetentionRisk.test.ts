import { describe, expect, it } from "vitest";

import { buildRetentionData } from "./useAgentRetentionRisk";

describe("buildRetentionData period matrix", () => {
  it("scales agent GCI and transactions", () => {
    const week = buildRetentionData("week");
    const month = buildRetentionData("month");
    const year = buildRetentionData("year");
    expect(week.agents[0]?.estimated_gci).toBeLessThan(month.agents[0]?.estimated_gci ?? 0);
    expect(month.agents[0]?.estimated_gci).toBeLessThan(year.agents[0]?.estimated_gci ?? 0);
    expect(week.summary.estimated_at_risk_gci).toBeLessThan(year.summary.estimated_at_risk_gci);
  });
});
