import { describe, expect, it } from "vitest";

import {
  formatCompactCurrency,
  formatLiftPp,
  formatSignedLiftPp,
  pacePercent,
} from "./analyticsFormat";

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

  it("formats lift pp to three significant figures", () => {
    expect(formatLiftPp(4)).toBe("4.00");
    expect(formatLiftPp(3)).toBe("3.00");
    expect(formatLiftPp(12.34)).toBe("12.3");
    expect(formatLiftPp(0.4567)).toBe("0.457");
    expect(formatLiftPp(0)).toBe("0.00");
    expect(formatSignedLiftPp(4)).toBe("+4.00");
    expect(formatSignedLiftPp(-1.25)).toBe("-1.25");
  });
});
