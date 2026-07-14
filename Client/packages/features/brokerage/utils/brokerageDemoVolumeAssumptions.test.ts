import { describe, expect, it } from "vitest";

import { YEAR_CLOSING_TOTAL } from "./analytics/closingsTrend";
import {
  DEMO_AGENT_COUNT,
  DEMO_BROKERAGE_PERSONA_NOTE,
  MONTH_TRANSACTIONS,
  transactionsForPeriod,
  VOLUME_ASSUMPTION_FOOTNOTE,
  YEAR_TRANSACTIONS,
} from "./brokerageDemoVolumeAssumptions";

describe("brokerageDemoVolumeAssumptions", () => {
  it("anchors volume to Kaggle overview closings", () => {
    expect(DEMO_AGENT_COUNT).toBe(500);
    expect(MONTH_TRANSACTIONS).toBe(1854);
    expect(YEAR_TRANSACTIONS).toBe(YEAR_CLOSING_TOTAL);
    expect(YEAR_TRANSACTIONS).toBe(22_576);
  });

  it("scales periods from the month baseline; year uses trend sum", () => {
    expect(transactionsForPeriod("month")).toBe(MONTH_TRANSACTIONS);
    expect(transactionsForPeriod("year")).toBe(YEAR_TRANSACTIONS);
    expect(transactionsForPeriod("year")).not.toBe(Math.round(MONTH_TRANSACTIONS * 12));
    expect(transactionsForPeriod("week")).toBeLessThan(transactionsForPeriod("month"));
  });

  it("exposes audience-safe volume footnote without Kaggle wording", () => {
    expect(VOLUME_ASSUMPTION_FOOTNOTE).toBe("500 agents · 1,854 closings/month");
    expect(VOLUME_ASSUMPTION_FOOTNOTE.toLowerCase()).not.toContain("kaggle");
    expect(DEMO_BROKERAGE_PERSONA_NOTE).toContain("National-scale");
  });
});
