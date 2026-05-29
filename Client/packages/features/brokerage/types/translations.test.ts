import { describe, expect, it } from "vitest";

import { BROKERAGE_TRANSLATIONS } from "./translations";

describe("BROKERAGE_TRANSLATIONS", () => {
  it("is empty until brokerage features ship", () => {
    expect(Object.keys(BROKERAGE_TRANSLATIONS)).toHaveLength(0);
  });
});
