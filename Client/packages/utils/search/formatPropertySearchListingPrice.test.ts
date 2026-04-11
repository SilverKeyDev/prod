import { describe, expect, it } from "vitest";

import {
  displayListingPriceForCard,
  formatPropertySearchListingPrice,
} from "./formatPropertySearchListingPrice";

describe("formatPropertySearchListingPrice", () => {
  it("prefers unformattedPrice when price is missing", () => {
    expect(
      formatPropertySearchListingPrice({
        unformattedPrice: 450_000,
      }),
    ).toMatch(/450/);
  });

  it("uses listPrice when others missing", () => {
    expect(
      formatPropertySearchListingPrice({
        listPrice: 325_000,
      }),
    ).toMatch(/325/);
  });

  it("parses listPrice string with currency symbols", () => {
    expect(
      formatPropertySearchListingPrice({ listPrice: "$1,234,567" }),
    ).toContain("234");
  });

  it("formats numeric price 0 without falling back to unavailable", () => {
    expect(formatPropertySearchListingPrice({ price: 0 })).toBe("0");
  });

  it("returns fallback when no price fields", () => {
    expect(formatPropertySearchListingPrice({})).toBe("Price not available");
  });

  it("reads snake_case unformatted_price when price is null", () => {
    expect(
      formatPropertySearchListingPrice({
        price: null,
        unformatted_price: 899_000,
      }),
    ).toMatch(/899/);
  });

  it("ignores JSON null in numeric chain", () => {
    expect(
      formatPropertySearchListingPrice({
        price: null,
        listPrice: null,
        unformattedPrice: 100_000,
      }),
    ).toMatch(/100/);
  });
});

describe("displayListingPriceForCard", () => {
  it("maps null and empty string to unavailable copy", () => {
    expect(displayListingPriceForCard(null)).toBe("Price not available");
    expect(displayListingPriceForCard("")).toBe("Price not available");
  });

  it("maps string null to unavailable copy", () => {
    expect(displayListingPriceForCard("null")).toBe("Price not available");
  });

  it("prefixes formatted listing amount with dollar", () => {
    expect(displayListingPriceForCard("450,000")).toBe("$450,000");
  });
});
