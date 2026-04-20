import { describe, expect, it } from "vitest";

import { formatMlsAffiliationRecord } from "./formatPublicMlsAffiliations";

describe("formatMlsAffiliationRecord", () => {
  it("returns sorted humanized rows and skips empty values", () => {
    expect(
      formatMlsAffiliationRecord({
        mls_name: "Example MLS",
        empty: "",
        nested: { a: 1 },
      })
    ).toEqual([
      { label: "Mls Name", value: "Example MLS" },
      { label: "Nested", value: '{"a":1}' },
    ]);
  });

  it("joins string arrays", () => {
    expect(
      formatMlsAffiliationRecord({
        tags: ["a", "b"],
      })
    ).toEqual([{ label: "Tags", value: "a, b" }]);
  });
});
