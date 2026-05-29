import { describe, expect, it } from "vitest";

import { LOG_CATEGORIES } from "./categories";
import { parseLogPath } from "./parseLogPath";

describe("parseLogPath", () => {
  it("parses legacy enum category", () => {
    const parsed = parseLogPath(LOG_CATEGORIES.AUTH);
    expect(parsed).toEqual({
      path: "AUTH",
      category: "AUTH",
      categoryLabel: "AUTH",
    });
  });

  it("parses bare LogPath string", () => {
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
