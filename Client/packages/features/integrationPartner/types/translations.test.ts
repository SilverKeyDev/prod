import { describe, expect, it } from "vitest";

import { INTEGRATION_PARTNER_TRANSLATIONS } from "./translations";

describe("INTEGRATION_PARTNER_TRANSLATIONS", () => {
  it("is empty until integration partner operator UX ships", () => {
    expect(Object.keys(INTEGRATION_PARTNER_TRANSLATIONS)).toHaveLength(0);
  });
});
