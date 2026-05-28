import { describe, expect, it } from "vitest";

import { isPlaceholderWorkspace } from "./isPlaceholderWorkspace";

describe("isPlaceholderWorkspace", () => {
  it("returns true for seller, brokerage, and integration_partner", () => {
    expect(isPlaceholderWorkspace("seller")).toBe(true);
    expect(isPlaceholderWorkspace("brokerage")).toBe(true);
    expect(isPlaceholderWorkspace("integration_partner")).toBe(true);
  });

  it("returns false for buyer and agent", () => {
    expect(isPlaceholderWorkspace("buyer")).toBe(false);
    expect(isPlaceholderWorkspace("agent")).toBe(false);
  });
});
