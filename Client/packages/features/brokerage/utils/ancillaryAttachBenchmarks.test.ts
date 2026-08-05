import { describe, expect, it } from "vitest";

import {
  ANCILLARY_ATTACH_BENCHMARKS,
  FALL_OFF_KEEP_BENCHMARK,
  fallOffOpportunityDollars,
  gapToBenchmarkPp,
  isLeakageBenchmarkService,
  opportunityDollars,
  opportunityDollarsPrecise,
} from "./ancillaryAttachBenchmarks";

describe("ancillaryAttachBenchmarks", () => {
  it("exposes leakage catalog with current below industry avg", () => {
    for (const service of ["title", "lending", "escrow", "home_warranty"] as const) {
      const row = ANCILLARY_ATTACH_BENCHMARKS[service];
      expect(row.current).toBeLessThan(row.industryAvg);
      expect(row.industryAvg).toBeLessThanOrEqual(row.industryHigh);
      expect(row.fee).toBeGreaterThan(0);
    }
    expect(isLeakageBenchmarkService("title")).toBe(true);
    expect(isLeakageBenchmarkService("foo")).toBe(false);
  });

  it("gapToBenchmarkPp clamps negative gaps to zero", () => {
    expect(gapToBenchmarkPp(18, 15)).toBe(0);
    expect(gapToBenchmarkPp(13, 15)).toBe(2);
  });

  it("opportunityDollars rounds attaches before multiplying fee", () => {
    // 100 closings * 2pp / 100 = 2 attaches * $150 = $300
    expect(opportunityDollars(100, 13, 15, 150)).toBe(300);
    // Small volume: 4 * 2pp / 100 = 0.08 → rounds to 0 attaches
    expect(opportunityDollars(4, 13, 15, 150)).toBe(0);
  });

  it("opportunityDollarsPrecise rounds dollars so small-n stays non-zero", () => {
    // 4 closings * 6pp * $150 / 100 = 36
    expect(opportunityDollarsPrecise(4, 9, 15, 150)).toBe(36);
    expect(opportunityDollarsPrecise(4, 13, 15, 150)).toBe(12);
  });

  it("fallOffOpportunityDollars uses keep-rate high gap and GCI fee", () => {
    expect(FALL_OFF_KEEP_BENCHMARK.current).toBe(72);
    expect(FALL_OFF_KEEP_BENCHMARK.industryHigh).toBe(76);
    expect(FALL_OFF_KEEP_BENCHMARK.fee).toBe(400);
    // 100 * 4pp / 100 = 4 saved closings * $400 = $1600
    expect(fallOffOpportunityDollars(100)).toBe(1600);
  });
});
