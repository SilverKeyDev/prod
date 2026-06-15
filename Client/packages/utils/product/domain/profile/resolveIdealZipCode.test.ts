import { describe, expect, it } from "vitest";

import {
  extractZipFromAddress,
  resolveIdealZipCode,
} from "packages/utils/product/domain/profile/resolveIdealZipCode";

import { downPaymentDollarsFromBand } from "@/features/profile/utils/financials/downPaymentBand";

describe("downPaymentDollarsFromBand", () => {
  it("uses band midpoint percent of budget max", () => {
    expect(downPaymentDollarsFromBand("10_20", 400_000)).toBe(60_000);
    expect(downPaymentDollarsFromBand("less_5", 500_000)).toBe(12_500);
  });
});

describe("resolveIdealZipCode", () => {
  it("prefers explicit ideal_zip_code", () => {
    expect(
      resolveIdealZipCode({
        ideal_zip_code: "94102",
        important_locations: [{ address: "123 Main St, Austin, TX 78701" }],
      })
    ).toBe("94102");
  });

  it("extracts zip from first important location", () => {
    expect(
      resolveIdealZipCode({
        important_locations: [{ address: "777 W Middlefield Rd, Mountain View, CA 94043" }],
      })
    ).toBe("94043");
  });

  it("returns undefined when no zip found", () => {
    expect(
      resolveIdealZipCode({ important_locations: [{ address: "No zip here" }] })
    ).toBeUndefined();
  });
});

describe("extractZipFromAddress", () => {
  it("finds 5-digit zip at end of address", () => {
    expect(extractZipFromAddress("100 Market St, San Francisco, CA 94105")).toBe("94105");
  });
});
