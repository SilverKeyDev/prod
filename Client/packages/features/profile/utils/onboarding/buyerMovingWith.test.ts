import { describe, expect, it } from "vitest";

import { toggleBuyerMovingWithSelection } from "./buyerMovingWith";

describe("toggleBuyerMovingWithSelection", () => {
  it("selecting just_me clears other options", () => {
    expect(toggleBuyerMovingWithSelection(["partner", "kids"], "just_me")).toEqual(["just_me"]);
  });

  it("deselecting just_me clears selection", () => {
    expect(toggleBuyerMovingWithSelection(["just_me"], "just_me")).toEqual([]);
  });

  it("selecting another option removes just_me", () => {
    expect(toggleBuyerMovingWithSelection(["just_me"], "partner")).toEqual(["partner"]);
  });

  it("allows combining non-just_me options", () => {
    expect(toggleBuyerMovingWithSelection(["partner"], "kids")).toEqual(["partner", "kids"]);
    expect(toggleBuyerMovingWithSelection(["partner", "kids"], "roommates")).toEqual([
      "partner",
      "kids",
      "roommates",
    ]);
  });

  it("deselecting a non-just_me option keeps the rest", () => {
    expect(toggleBuyerMovingWithSelection(["partner", "kids"], "kids")).toEqual(["partner"]);
  });
});
