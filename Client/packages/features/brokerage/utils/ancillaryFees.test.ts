import { describe, expect, it } from "vitest";

import {
  ANCILLARY_FEES,
  ANCILLARY_SERVICE_ORDER,
  attachRateLiftPp,
  feeForService,
  recoveredDollars,
} from "./ancillaryFees";

describe("ancillaryFees", () => {
  it("matches SIL-277 leakage fee assumptions", () => {
    expect(ANCILLARY_FEES.title).toBe(500);
    expect(ANCILLARY_FEES.lending).toBe(1000);
    expect(ANCILLARY_FEES.escrow).toBe(400);
    expect(ANCILLARY_FEES.home_warranty).toBe(150);
  });

  it("service order matches Leakage by_service order", () => {
    expect([...ANCILLARY_SERVICE_ORDER]).toEqual(["title", "lending", "escrow", "home_warranty"]);
  });

  it("computes lift and recovered dollars", () => {
    expect(attachRateLiftPp(22, 26)).toBe(4);
    expect(recoveredDollars(56, feeForService("title"))).toBe(28000);
  });
});
