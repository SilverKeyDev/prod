import { describe, expect, it } from "vitest";

import { inventoryStatusToPinScore } from "./inventoryStatusPinScore";

describe("inventoryStatusToPinScore", () => {
  it("maps status to match-score pin tiers", () => {
    expect(inventoryStatusToPinScore("active")).toBe(90);
    expect(inventoryStatusToPinScore("pending")).toBe(60);
    expect(inventoryStatusToPinScore("sold")).toBe(30);
  });
});
