import { describe, expect, it } from "vitest";

import { researchListingZpid } from "packages/features/search";

describe("researchListingZpid", () => {
  it("uses string zpid", () => {
    expect(researchListingZpid({ id: "x", zpid: " 12345 " })).toBe("12345");
  });

  it("stringifies numeric zpid from search results", () => {
    expect(researchListingZpid({ id: "123", zpid: 12_345_678 })).toBe(
      "12345678",
    );
  });

  it("falls back to numeric id when zpid missing", () => {
    expect(researchListingZpid({ id: "9876543210" })).toBe("9876543210");
  });

  it("returns undefined when no usable listing id", () => {
    expect(
      researchListingZpid({ id: "mls-abc", zpid: undefined }),
    ).toBeUndefined();
  });
});
