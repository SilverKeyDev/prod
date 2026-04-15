import { describe, expect, it } from "vitest";

import { formatFormsLibraryCategoryLabel } from "./formatFormsLibraryCategoryLabel";

describe("formatFormsLibraryCategoryLabel", () => {
  it("replaces underscores and title-cases words", () => {
    expect(formatFormsLibraryCategoryLabel("Buyer_broker_agreements")).toBe(
      "Buyer Broker Agreements",
    );
  });

  it("trims and collapses whitespace", () => {
    expect(formatFormsLibraryCategoryLabel("  a__b  c ")).toBe("A B C");
  });

  it("returns original when only whitespace", () => {
    expect(formatFormsLibraryCategoryLabel("   ")).toBe("   ");
  });
});
