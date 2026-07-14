import { describe, expect, it } from "vitest";

import {
  MONTH_DISTRIBUTION,
  WEEK_HEATMAP_DATA,
  YEAR_DISTRIBUTION,
} from "./activityDistributionFixtures";

describe("activityDistributionFixtures", () => {
  it("has week heatmap covering 7 days × 11 hours", () => {
    expect(WEEK_HEATMAP_DATA).toHaveLength(77);
    expect(WEEK_HEATMAP_DATA.every((c) => c.x >= 0 && c.x <= 10)).toBe(true);
    expect(WEEK_HEATMAP_DATA.every((c) => c.y >= 0 && c.y <= 6)).toBe(true);
  });

  it("has month distribution for 31 days", () => {
    expect(MONTH_DISTRIBUTION).toHaveLength(31);
    expect(MONTH_DISTRIBUTION[0]?.label).toBe("1");
    expect(MONTH_DISTRIBUTION[30]?.label).toBe("31");
    expect(MONTH_DISTRIBUTION.every((p) => p.value > 0)).toBe(true);
  });

  it("has year distribution for 12 months", () => {
    expect(YEAR_DISTRIBUTION).toHaveLength(12);
    expect(YEAR_DISTRIBUTION[0]?.label).toBe("Jan");
    expect(YEAR_DISTRIBUTION[11]?.label).toBe("Dec");
  });
});
