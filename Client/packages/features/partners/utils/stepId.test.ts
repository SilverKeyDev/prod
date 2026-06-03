import { describe, expect, it } from "vitest";

import { buildStepId, parseStepId } from "packages/utils/checklists/stepId";

describe("buildStepId", () => {
  it("joins section and item id", () => {
    expect(buildStepId("closing", 13)).toBe("closing:13");
  });
});

describe("parseStepId", () => {
  it("round-trips canonical ids", () => {
    expect(parseStepId("closing:13")).toEqual({ section: "closing", itemId: 13 });
  });

  it("returns null for invalid ids", () => {
    expect(parseStepId("bad")).toBeNull();
    expect(parseStepId(":13")).toBeNull();
  });
});
