import { describe, expect, it } from "vitest";

import {
  inventoryListingPinScore,
  inventoryPriceTierToPinScore,
  priceToInventoryTier,
} from "./inventoryPriceTier";

describe("inventoryPriceTier", () => {
  it("buckets prices into Atlanta-metro tiers", () => {
    expect(priceToInventoryTier(null)).toBe("unknown");
    expect(priceToInventoryTier(299_999)).toBe("lower");
    expect(priceToInventoryTier(300_000)).toBe("middle");
    expect(priceToInventoryTier(549_999)).toBe("middle");
    expect(priceToInventoryTier(550_000)).toBe("upper");
    expect(priceToInventoryTier(899_999)).toBe("upper");
    expect(priceToInventoryTier(900_000)).toBe("wealthy");
  });

  it("maps tiers and status onto pin scores by color mode", () => {
    expect(inventoryPriceTierToPinScore("wealthy")).toBe(90);
    expect(inventoryPriceTierToPinScore("upper")).toBe(75);
    expect(inventoryPriceTierToPinScore("middle")).toBe(60);
    expect(inventoryPriceTierToPinScore("lower")).toBe(30);

    expect(inventoryListingPinScore({ status: "active", price: 250_000 }, "price_tier")).toBe(30);
    expect(inventoryListingPinScore({ status: "sold", price: 1_200_000 }, "status")).toBe(30);
    expect(inventoryListingPinScore({ status: "active", price: 1_200_000 }, "status")).toBe(90);
  });
});
