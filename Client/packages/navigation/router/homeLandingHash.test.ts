import { describe, expect, it } from "vitest";

import { homeLandingSectionIdFromHref } from "./homeLandingHash";

describe("homeLandingSectionIdFromHref", () => {
  it("parses /#section ids", () => {
    expect(homeLandingSectionIdFromHref("/#agents")).toBe("agents");
    expect(homeLandingSectionIdFromHref("/#buyers")).toBe("buyers");
    expect(homeLandingSectionIdFromHref("/#brokerages")).toBe("brokerages");
  });

  it("returns null for non-home-hash hrefs", () => {
    expect(homeLandingSectionIdFromHref("/privacy")).toBeNull();
    expect(homeLandingSectionIdFromHref("#agents")).toBeNull();
    expect(homeLandingSectionIdFromHref("/#")).toBeNull();
  });
});
