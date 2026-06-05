import { describe, expect, it } from "vitest";

import { BROKERAGE_TRANSLATIONS } from "./translations";

describe("BROKERAGE_TRANSLATIONS", () => {
  it("includes shell onboarding copy", () => {
    expect(BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_SETUP_TITLE).toBeTruthy();
    expect(BROKERAGE_TRANSLATIONS.BROKERAGE_SHELL_TEST_INPUT_LABEL).toBeTruthy();
  });
});
