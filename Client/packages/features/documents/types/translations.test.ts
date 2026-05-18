import { describe, it } from "vitest";

import { assertTranslationMapWithAllowedPrefixes } from "packages/utils/test/translationAssertions";

import { DOCUMENTS_TRANSLATIONS } from "./translations";

const DOCUMENT_PREFIXES = [
  "documents.",
  "documents_upload.",
  "secure_upload.",
  "reports.",
  "pdf.",
  "forms.",
  "docusign.",
];

describe("DOCUMENTS_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(DOCUMENTS_TRANSLATIONS, DOCUMENT_PREFIXES);
  });
});
