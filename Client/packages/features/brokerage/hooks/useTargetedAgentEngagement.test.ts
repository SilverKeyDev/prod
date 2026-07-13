import { describe, expect, it } from "vitest";

import { buildEngagementData } from "./useTargetedAgentEngagement";

describe("buildEngagementData period matrix", () => {
  it("scales recoverable dollars and flagged agent leakage", () => {
    const week = buildEngagementData("week");
    const month = buildEngagementData("month");
    const all = buildEngagementData("all");
    expect(week.summary.estimated_recoverable_dollars).toBeLessThan(
      month.summary.estimated_recoverable_dollars
    );
    expect(month.summary.estimated_recoverable_dollars).toBeLessThan(
      all.summary.estimated_recoverable_dollars
    );
    expect(week.flagged_agents[0]?.total_transactions).toBeLessThan(
      all.flagged_agents[0]?.total_transactions ?? 0
    );
  });
});
