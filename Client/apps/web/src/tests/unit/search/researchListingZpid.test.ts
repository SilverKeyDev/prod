import { describe, expect, it } from "vitest";

import { researchListingZpid } from "packages/utils/property";

describe("researchListingZpid", () => {
  it("uses string zpid", () => {
    expect(researchListingZpid({ id: "x", zpid: " 12345 " })).toBe("12345");
  });

  it("stringifies numeric zpid from search results", () => {
    expect(researchListingZpid({ id: "123", zpid: 12_345_678 })).toBe("12345678");
  });

  it("falls back to numeric id when zpid missing", () => {
    expect(researchListingZpid({ id: "9876543210" })).toBe("9876543210");
  });

  it("uses non-numeric id when zpid missing (MLS-style listing id)", () => {
    expect(researchListingZpid({ id: "mls-abc", zpid: undefined })).toBe("mls-abc");
  });

  it("returns undefined when id and zpid are empty", () => {
    expect(researchListingZpid({ id: "", zpid: undefined })).toBeUndefined();
    expect(researchListingZpid({ id: "   ", zpid: " " })).toBeUndefined();
  });

  it("ignores favorite-row UUID so address-only Slipstream lookup can run", () => {
    const uid = "3938fbed-65de-4816-b67b-a24fae9a9678";
    expect(researchListingZpid({ id: uid, zpid: undefined })).toBeUndefined();
    expect(researchListingZpid({ id: "mls-fallback", zpid: uid })).toBe("mls-fallback");
  });

  it("ignores fav- prefixed ids", () => {
    expect(
      researchListingZpid({
        id: "fav-8c2e9b1a-4d3f-5e6a-7b8c-9d0e1f2a3b4c",
        zpid: undefined,
      })
    ).toBeUndefined();
  });

  it("uses zpid when id is an internal UUID (e.g. shared saved-home row)", () => {
    const uid = "3938fbed-65de-4816-b67b-a24fae9a9678";
    expect(researchListingZpid({ id: uid, zpid: "12345678" })).toBe("12345678");
  });

  it("falls back to mls_home_id when id is UUID and zpid missing", () => {
    const uid = "3938fbed-65de-4816-b67b-a24fae9a9678";
    expect(researchListingZpid({ id: uid, zpid: undefined, mls_home_id: "MLS-XYZ" })).toBe(
      "MLS-XYZ"
    );
  });
});
