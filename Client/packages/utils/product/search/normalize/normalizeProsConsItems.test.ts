import { describe, expect, it } from "vitest";

import { normalizeConEntry, normalizeProEntry } from "./normalizeProsConsItems";

describe("normalizeProEntry", () => {
  it("ignores legacy string payloads", () => {
    expect(normalizeProEntry("  Great light  ")).toEqual({
      text: "",
      score: 3,
    });
  });

  it("maps object with score", () => {
    expect(normalizeProEntry({ text: "Low HOA", score: 5 })).toEqual({
      text: "Low HOA",
      score: 5,
    });
  });

  it("clamps score", () => {
    expect(normalizeProEntry({ text: "x", score: 99 })).toEqual({
      text: "x",
      score: 5,
    });
    expect(normalizeProEntry({ text: "y", score: -2 })).toEqual({
      text: "y",
      score: 1,
    });
  });
});

describe("normalizeConEntry", () => {
  it("ignores legacy string payloads", () => {
    expect(normalizeConEntry("Busy road")).toEqual({
      text: "",
      severity: "warning",
      score: 3,
    });
  });

  it("preserves red_flag", () => {
    expect(normalizeConEntry({ text: "Leak", severity: "red_flag", score: 4 })).toEqual({
      text: "Leak",
      severity: "red_flag",
      score: 4,
    });
  });

  it("normalizes redflag alias and unknown severity", () => {
    expect(normalizeConEntry({ text: "a", severity: "redflag", score: 2 })).toEqual({
      text: "a",
      severity: "red_flag",
      score: 2,
    });
    expect(normalizeConEntry({ text: "b", severity: "other", score: 2 })).toEqual({
      text: "b",
      severity: "warning",
      score: 2,
    });
  });
});
