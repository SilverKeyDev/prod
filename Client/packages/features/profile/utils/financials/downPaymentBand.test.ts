import { describe, expect, it } from "vitest";

import { downPaymentBandMidpointPercent, downPaymentDollarsFromBand } from "./downPaymentBand";

describe("downPaymentBand", () => {
  it("derives dollar amount from band midpoint and budget max", () => {
    expect(downPaymentDollarsFromBand("5_10", 400_000)).toBe(30_000);
    expect(downPaymentDollarsFromBand("20_plus", 800_000)).toBe(200_000);
    expect(downPaymentDollarsFromBand("not_sure", 500_000)).toBe(50_000);
  });

  it("exposes midpoint percentages", () => {
    expect(downPaymentBandMidpointPercent("less_5")).toBe(0.025);
    expect(downPaymentBandMidpointPercent("10_20")).toBe(0.15);
  });
});
