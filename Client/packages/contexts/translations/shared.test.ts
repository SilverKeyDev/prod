import { describe, it } from "vitest";

import { assertTranslationMapWithAllowedPrefixes } from "packages/utils/core/test/translationAssertions";

import { SHARED_TRANSLATIONS } from "./shared";

describe("SHARED_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(SHARED_TRANSLATIONS, [
      "common.",
      "profile.",
      "form.",
      "validation.",
      "feedback.",
      "house.",
    ]);
  });
});
