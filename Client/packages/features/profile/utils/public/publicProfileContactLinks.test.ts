import { describe, expect, it } from "vitest";

import { buildTelHref } from "./publicProfileContactLinks";

describe("buildTelHref", () => {
  it("normalizes phone to tel href", () => {
    expect(buildTelHref("(555) 123-4567")).toBe("tel:5551234567");
  });

  it("preserves leading plus", () => {
    expect(buildTelHref("+1 555 123 4567")).toBe("tel:+15551234567");
  });

  it("returns null for empty or non-digit content", () => {
    expect(buildTelHref("")).toBeNull();
    expect(buildTelHref("   ")).toBeNull();
    expect(buildTelHref("abc")).toBeNull();
  });
});
