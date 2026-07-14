import { describe, expect, it } from "vitest";

import {
  displayListingPriceForCard,
  formatPropertySearchListingPrice,
} from "./formatPropertySearchListingPrice";

describe("formatPropertySearchListingPrice", () => {
  describe("numeric price handling", () => {
    it("should format unformattedPrice when available", () => {
      const result = formatPropertySearchListingPrice({
        unformattedPrice: 350000,
      });

      expect(result).toBe("350,000");
    });

    it("should format numeric price when unformattedPrice absent", () => {
      const result = formatPropertySearchListingPrice({
        price: 450000,
      });

      expect(result).toBe("450,000");
    });

    it("should prefer unformattedPrice over price", () => {
      const result = formatPropertySearchListingPrice({
        unformattedPrice: 350000,
        price: 450000,
      });

      expect(result).toBe("350,000");
    });

    it("should handle snake_case keys", () => {
      const result = formatPropertySearchListingPrice({
        unformatted_price: 275000,
      });

      expect(result).toBe("275,000");
    });

    it("should fallback through all numeric keys", () => {
      const result = formatPropertySearchListingPrice({
        listing_price: 525000,
      });

      expect(result).toBe("525,000");
    });
  });

  describe("string price handling", () => {
    it("should parse string with dollar sign", () => {
      const result = formatPropertySearchListingPrice({
        price: "$350,000",
      });

      expect(result).toBe("350,000");
    });

    it("should parse string without dollar sign", () => {
      const result = formatPropertySearchListingPrice({
        price: "350000",
      });

      expect(result).toBe("350,000");
    });

    it("should return string price as-is when not numeric", () => {
      const result = formatPropertySearchListingPrice({
        price: "Contact for price",
      });

      expect(result).toBe("Contact for price");
    });

    it("should handle empty string price", () => {
      const result = formatPropertySearchListingPrice({
        price: "",
      });

      expect(result).toBe("Price not available");
    });

    it("should handle whitespace-only string", () => {
      const result = formatPropertySearchListingPrice({
        price: "   ",
      });

      expect(result).toBe("Price not available");
    });
  });

  describe("null and undefined handling", () => {
    it("should handle null price", () => {
      const result = formatPropertySearchListingPrice({
        price: null,
      });

      expect(result).toBe("Price not available");
    });

    it("should handle undefined price", () => {
      const result = formatPropertySearchListingPrice({
        price: undefined,
      });

      expect(result).toBe("Price not available");
    });

    it("should handle empty object", () => {
      const result = formatPropertySearchListingPrice({});

      expect(result).toBe("Price not available");
    });
  });

  describe("priority order", () => {
    it("should prioritize unformattedPrice over all others", () => {
      const result = formatPropertySearchListingPrice({
        unformattedPrice: 100000,
        unformatted_price: 200000,
        price: 300000,
        listPrice: 400000,
      });

      expect(result).toBe("100,000");
    });

    it("should use price when unformattedPrice is null", () => {
      const result = formatPropertySearchListingPrice({
        unformattedPrice: null,
        price: 300000,
      });

      expect(result).toBe("300,000");
    });
  });
});

describe("displayListingPriceForCard", () => {
  describe("numeric values", () => {
    it("should format number with dollar sign", () => {
      const result = displayListingPriceForCard(350000);

      expect(result).toBe("$350,000");
    });

    it("should handle zero", () => {
      const result = displayListingPriceForCard(0);

      expect(result).toBe("$0");
    });

    it("should handle decimal prices", () => {
      const result = displayListingPriceForCard(350000.5);

      expect(result).toBe("$350,000.5");
    });
  });

  describe("string values", () => {
    it("should format a raw numeric string with locale separators", () => {
      const result = displayListingPriceForCard("350000");

      expect(result).toBe("$350,000");
    });

    it("should format raw numeric strings without thousands separators", () => {
      const result = displayListingPriceForCard("425000");

      expect(result).toBe("$425,000");
    });

    it("should not duplicate dollar sign and keep formatting", () => {
      const result = displayListingPriceForCard("$350,000");

      expect(result).toBe("$350,000");
    });

    it("should handle custom price text", () => {
      const result = displayListingPriceForCard("Contact for price");

      expect(result).toBe("$Contact for price");
    });

    it("should handle empty string", () => {
      const result = displayListingPriceForCard("");

      expect(result).toBe("Price not available");
    });

    it("should handle 'null' string", () => {
      const result = displayListingPriceForCard("null");

      expect(result).toBe("Price not available");
    });

    it("should handle 'NULL' string (case insensitive)", () => {
      const result = displayListingPriceForCard("NULL");

      expect(result).toBe("Price not available");
    });

    it("should preserve 'Price not available' text", () => {
      const result = displayListingPriceForCard("Price not available");

      expect(result).toBe("Price not available");
    });
  });

  describe("null and undefined handling", () => {
    it("should handle null", () => {
      const result = displayListingPriceForCard(null);

      expect(result).toBe("Price not available");
    });

    it("should handle undefined", () => {
      const result = displayListingPriceForCard(undefined);

      expect(result).toBe("Price not available");
    });
  });

  describe("edge cases", () => {
    it("should handle NaN", () => {
      const result = displayListingPriceForCard(NaN);

      expect(result).toBe("Price not available");
    });

    it("should handle Infinity", () => {
      const result = displayListingPriceForCard(Infinity);

      expect(result).toBe("Price not available");
    });

    it("should handle negative Infinity", () => {
      const result = displayListingPriceForCard(-Infinity);

      expect(result).toBe("Price not available");
    });

    it("should handle very large numbers", () => {
      const result = displayListingPriceForCard(9999999999);

      expect(result).toBe("$9,999,999,999");
    });

    it("should handle negative numbers (edge case)", () => {
      const result = displayListingPriceForCard(-100);

      expect(result).toBe("$-100");
    });
  });
});
