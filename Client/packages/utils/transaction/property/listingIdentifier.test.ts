import { describe, expect, it } from "vitest";

import { isLikelyInternalAppListingKey } from "./listingIdentifier";

describe("isLikelyInternalAppListingKey", () => {
  it("flags RFC4122 UUIDs", () => {
    expect(isLikelyInternalAppListingKey("3938fbed-65de-4816-b67b-a24fae9a9678")).toBe(true);
  });

  it("flags fav- and temp_ prefixes", () => {
    expect(isLikelyInternalAppListingKey("fav-8c2e9b1a-4d3f-5e6a-7b8c-9d0e1f2a3b4c")).toBe(true);
    expect(isLikelyInternalAppListingKey("temp_123")).toBe(true);
  });

  it("does not flag numeric zpids or MLS-style ids", () => {
    expect(isLikelyInternalAppListingKey("12345678")).toBe(false);
    expect(isLikelyInternalAppListingKey("mls-abc-001")).toBe(false);
  });
});
