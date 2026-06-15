import { describe, expect, it } from "vitest";

import { isPlaceholderWorkspace } from "./isPlaceholderWorkspace";

describe("isPlaceholderWorkspace", () => {
  it("returns false for seller, brokerage, and integration_partner", () => {
    expect(isPlaceholderWorkspace("seller")).toBe(false);
    expect(isPlaceholderWorkspace("brokerage")).toBe(false);
    expect(isPlaceholderWorkspace("integration_partner")).toBe(false);
  });

  it("returns false for buyer and agent", () => {
    expect(isPlaceholderWorkspace("buyer")).toBe(false);
    expect(isPlaceholderWorkspace("agent")).toBe(false);
  });
});
