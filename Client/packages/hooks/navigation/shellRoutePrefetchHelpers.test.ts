import { describe, expect, it } from "vitest";

import { isAlreadyOnShellRoute, normalizeShellRoutePath } from "./shellRoutePrefetchHelpers";

describe("shellRoutePrefetchHelpers", () => {
  it("strips workspace prefix from paths", () => {
    expect(normalizeShellRoutePath("/buyer/search")).toBe("/search");
    expect(normalizeShellRoutePath("/brokerage/dashboard")).toBe("/dashboard");
  });

  it("detects when already on the target shell route", () => {
    expect(isAlreadyOnShellRoute("/buyer/search", "/search")).toBe(true);
    expect(isAlreadyOnShellRoute("/search", "/search")).toBe(true);
    expect(isAlreadyOnShellRoute("/buyer/dashboard", "/search")).toBe(false);
    expect(isAlreadyOnShellRoute("/buyer/saved", "/library")).toBe(false);
  });
});
