import { describe, expect, it } from "vitest";

import { parseLogPath } from "./parseLogPath";

describe("parseLogPath", () => {
  it("parses top-level LogPath string", () => {
    const parsed = parseLogPath("AUTH");
    expect(parsed).toEqual({
      path: "AUTH",
      category: "AUTH",
      categoryLabel: "AUTH",
    });
  });

  it("parses another bare LogPath string", () => {
    const parsed = parseLogPath("SEARCH");
    expect(parsed.category).toBe("SEARCH");
    expect(parsed.categoryLabel).toBe("SEARCH");
  });

  it("parses API dot notation", () => {
    const parsed = parseLogPath("API.POLLING");
    expect(parsed).toEqual({
      path: "API.POLLING",
      category: "API",
      subcategory: "POLLING",
      categoryLabel: "API.POLLING",
    });
  });

  it("throws for unknown paths", () => {
    expect(() => parseLogPath("AUTH.LOGIN")).toThrow(/Unknown log path/);
  });
});
