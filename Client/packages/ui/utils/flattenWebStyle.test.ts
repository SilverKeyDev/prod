import { describe, expect, it } from "vitest";

import { flattenWebStyle } from "./flattenWebStyle";

describe("flattenWebStyle", () => {
  it("returns {} for undefined/null/false", () => {
    expect(flattenWebStyle(undefined)).toEqual({});
    expect(flattenWebStyle(null)).toEqual({});
    expect(flattenWebStyle(false)).toEqual({});
  });

  it("returns the same object for a plain style", () => {
    const s = { color: "red", fontSize: 12 };
    expect(flattenWebStyle(s)).toBe(s);
  });

  it("merges arrays in order", () => {
    expect(
      flattenWebStyle([{ color: "blue" }, { fontWeight: 600 }, null, false, { color: "red" }])
    ).toEqual({ color: "red", fontWeight: 600 });
  });
});
