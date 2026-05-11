import { describe, expect, it } from "vitest";

import {
  formatEventRequestRangeSummaryEnUs,
  formatOptionalDateStringEnUs,
} from "./displayLocaleEnUs";

describe("formatOptionalDateStringEnUs", () => {
  it("returns empty for null, undefined, empty, or unparseable", () => {
    expect(formatOptionalDateStringEnUs(null)).toBe("");
    expect(formatOptionalDateStringEnUs(undefined)).toBe("");
    expect(formatOptionalDateStringEnUs("")).toBe("");
    expect(formatOptionalDateStringEnUs("   ")).toBe("");
    expect(formatOptionalDateStringEnUs("not-a-date")).toBe("");
  });

  it("formats ISO and MM/DD/YYYY leniently", () => {
    expect(formatOptionalDateStringEnUs("2024-03-15T12:00:00.000Z")).toMatch(/Mar/);
    expect(formatOptionalDateStringEnUs("03/15/2024")).toMatch(/Mar/);
  });
});

describe("formatEventRequestRangeSummaryEnUs", () => {
  it("includes date and time range", () => {
    const s = formatEventRequestRangeSummaryEnUs(
      "2025-06-10T14:00:00.000Z",
      "2025-06-10T15:30:00.000Z"
    );
    expect(s).toContain(" at ");
    expect(s).toContain("–");
  });
});
