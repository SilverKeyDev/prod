import { describe, expect, it } from "vitest";

import { mergeDraft, removeDraftKey } from "./messagingComposerDraftModel";

describe("messagingComposerDraftModel", () => {
  it("mergeDraft adds and updates entries", () => {
    expect(mergeDraft({}, "c1", "hi")).toEqual({ c1: "hi" });
    expect(mergeDraft({ c1: "hi" }, "c1", "there")).toEqual({ c1: "there" });
  });

  it("mergeDraft returns null when unchanged", () => {
    expect(mergeDraft({ c1: "x" }, "c1", "x")).toBeNull();
  });

  it("removeDraftKey removes one id", () => {
    expect(removeDraftKey({ c1: "a", c2: "b" }, "c1")).toEqual({ c2: "b" });
  });

  it("removeDraftKey returns null when missing", () => {
    expect(removeDraftKey({ c2: "b" }, "c1")).toBeNull();
  });
});
