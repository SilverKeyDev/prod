import { describe, expect, it } from "vitest";

import {
  parseSectionRatingValue,
  stripSectionRatingField,
  unwrapPropertyAnalysisSection,
} from "packages/utils/propertyDetails";

describe("parseSectionRatingValue", () => {
  it("parses finite numbers and clamps to 0–10", () => {
    expect(parseSectionRatingValue(8.5)).toBe(8.5);
    expect(parseSectionRatingValue(0)).toBe(0);
    expect(parseSectionRatingValue(10)).toBe(10);
    expect(parseSectionRatingValue(12)).toBe(10);
    expect(parseSectionRatingValue(-1)).toBe(0);
  });

  it("parses numeric strings and strips /10 suffix noise", () => {
    expect(parseSectionRatingValue("8.5")).toBe(8.5);
    expect(parseSectionRatingValue("  7.2/10  ")).toBe(7.2);
  });

  it("returns null for empty or non-numeric", () => {
    expect(parseSectionRatingValue(null)).toBeNull();
    expect(parseSectionRatingValue(undefined)).toBeNull();
    expect(parseSectionRatingValue("")).toBeNull();
    expect(parseSectionRatingValue("n/a")).toBeNull();
    expect(parseSectionRatingValue(Number.NaN)).toBeNull();
    expect(parseSectionRatingValue({})).toBeNull();
  });
});

describe("stripSectionRatingField", () => {
  it("removes first *_rating key and returns parsed rating", () => {
    const { rest, rating } = stripSectionRatingField({
      commute_rating: "8.5",
      summary: "ok",
    });
    expect(rating).toBe(8.5);
    expect(rest).toEqual({ summary: "ok" });
  });

  it("handles key rating", () => {
    const { rest, rating } = stripSectionRatingField({ rating: 6, other: 1 });
    expect(rating).toBe(6);
    expect(rest).toEqual({ other: 1 });
  });

  it("passes through when no rating key", () => {
    const input = { a: 1 };
    const { rest, rating } = stripSectionRatingField(input);
    expect(rating).toBeNull();
    expect(rest).toBe(input);
  });

  it("passes through non-objects", () => {
    expect(stripSectionRatingField(null)).toEqual({ rest: null, rating: null });
    expect(stripSectionRatingField([1, 2])).toEqual({
      rest: [1, 2],
      rating: null,
    });
    expect(stripSectionRatingField("x")).toEqual({ rest: "x", rating: null });
  });

  it("still strips key when value is unparseable", () => {
    const { rest, rating } = stripSectionRatingField({
      affordability_rating: "n/a",
      note: "x",
    });
    expect(rating).toBeNull();
    expect(rest).toEqual({ note: "x" });
  });
});

describe("unwrapPropertyAnalysisSection", () => {
  it("unwraps single-key section wrapper", () => {
    const inner = { commute_rating: "7.5", traffic: "Light" };
    expect(unwrapPropertyAnalysisSection("commute", { commute: inner })).toEqual(inner);
  });

  it("passes through flat payloads", () => {
    const flat = { commute_rating: "8", public_transport: "Bus" };
    expect(unwrapPropertyAnalysisSection("commute", flat)).toEqual(flat);
  });

  it("does not unwrap when multiple top-level keys", () => {
    const obj = { commute: { a: 1 }, other: 2 };
    expect(unwrapPropertyAnalysisSection("commute", obj)).toEqual(obj);
  });
});
