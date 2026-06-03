import { describe, expect, it } from "vitest";

import { formatPriceRange } from "./searchFilterSummaries";

describe("formatPriceRange", () => {
  it("does not show trailing .0 for whole-thousand prices", () => {
    expect(formatPriceRange(135000, 1000000)).toBe("$135K – $1M");
  });
});
