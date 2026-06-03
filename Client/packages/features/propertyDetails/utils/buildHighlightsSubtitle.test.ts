import { describe, expect, it } from "vitest";

import { buildHighlightsSubtitle } from "./buildHighlightsSubtitle";

const t = (key: string, opts?: { defaultValue?: string; percent?: number }) => {
  if (opts?.defaultValue) {
    return opts.defaultValue.replace("{{percent}}", String(opts.percent ?? ""));
  }
  return key;
};

describe("buildHighlightsSubtitle", () => {
  it("returns no-score copy when match score is missing", () => {
    expect(
      buildHighlightsSubtitle(t, {
        prosCount: 2,
        consCount: 1,
        propertyMatchScore: 0,
      })
    ).toContain("saved preferences");
  });

  it("emphasizes strengths when pros outnumber cons", () => {
    const subtitle = buildHighlightsSubtitle(t, {
      prosCount: 3,
      consCount: 1,
      propertyMatchScore: 85,
    });
    expect(subtitle).toContain("emphasize strengths");
    expect(subtitle).toMatch(/\d+%/);
  });

  it("emphasizes tradeoffs when cons outnumber pros", () => {
    const subtitle = buildHighlightsSubtitle(t, {
      prosCount: 1,
      consCount: 4,
      propertyMatchScore: 60,
    });
    expect(subtitle).toContain("tradeoffs");
  });

  it("uses balanced copy when pros and cons counts are equal", () => {
    const subtitle = buildHighlightsSubtitle(t, {
      prosCount: 2,
      consCount: 2,
      propertyMatchScore: 75,
    });
    expect(subtitle).toContain("strengths and tradeoffs are balanced");
  });
});
