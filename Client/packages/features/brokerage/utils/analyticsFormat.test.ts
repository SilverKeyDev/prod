import { describe, expect, it } from "vitest";

import { formatCompactCurrency, pacePercent } from "./analyticsFormat";

describe("analyticsFormat", () => {
  it("formats compact currency tiers", () => {
    expect(formatCompactCurrency(512_000)).toBe("$512K");
    expect(formatCompactCurrency(28_477_440)).toBe("$28.5M");
    expect(formatCompactCurrency(1_100_000_000)).toBe("$1.10B");
  });

  it("computes pace percent against target", () => {
    expect(pacePercent(86, 100)).toBe(86);
    expect(pacePercent(50, 0)).toBe(0);
  });
});
