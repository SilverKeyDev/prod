import { describe, it } from "vitest";

import { assertTranslationMapWithAllowedPrefixes } from "packages/utils/test/translationAssertions";

import { PROPERTY_DETAILS_TRANSLATIONS } from "./translations";

const PROPERTY_DETAILS_PREFIXES = [
  "property_details.",
  "property_details_gallery.",
  "property_details_list.",
  "property_analysis.",
];

describe("PROPERTY_DETAILS_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(
      PROPERTY_DETAILS_TRANSLATIONS,
      PROPERTY_DETAILS_PREFIXES
    );
  });
});
