import { describe, it } from "vitest";

import { assertKeysResolve, assertTranslationMap } from "packages/utils/test/translationAssertions";

import { BROKERAGE_TRANSLATIONS } from "./translations";

describe("BROKERAGE_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMap(BROKERAGE_TRANSLATIONS, "brokerage.");
  });

  it("includes keys used by brokerage dashboard page", () => {
    assertKeysResolve(BROKERAGE_TRANSLATIONS, [
      "brokerage.dashboard_title",
      "brokerage.dashboard_subtitle",
    ]);
  });
});
