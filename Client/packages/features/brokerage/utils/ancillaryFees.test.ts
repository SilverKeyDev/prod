import { describe, expect, it } from "vitest";

import {
  ANCILLARY_FEES,
  ANCILLARY_SERVICE_ORDER,
  attachRateLiftPp,
  feeForService,
  recoveredDollars,
} from "./ancillaryFees";

describe("ancillaryFees", () => {
  it("uses placement-share fee assumptions", () => {
    expect(ANCILLARY_FEES.title).toBe(150);
    expect(ANCILLARY_FEES.lending).toBe(250);
    expect(ANCILLARY_FEES.escrow).toBe(100);
    expect(ANCILLARY_FEES.home_warranty).toBe(75);
    expect(ANCILLARY_FEES.homeowners_insurance).toBe(50);
    expect(ANCILLARY_FEES.move_concierge).toBe(40);
  });

  it("service order matches Leakage by_service order", () => {
    expect([...ANCILLARY_SERVICE_ORDER]).toEqual(["title", "lending", "escrow", "home_warranty"]);
  });

  it("computes lift and recovered dollars", () => {
    expect(attachRateLiftPp(22, 26)).toBe(4);
    expect(recoveredDollars(56, feeForService("title"))).toBe(8400);
  });
});
