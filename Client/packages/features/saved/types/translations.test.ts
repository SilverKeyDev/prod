import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithAnyPrefix,
} from "packages/utils/core/test/translationAssertions";

import { SAVED_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("SAVED_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(SAVED_TRANSLATIONS, ["saved.", "why_not.", "modals."]);
  });

  it("resolves keys used in saved feature UI", () => {
    const used = keysWithAnyPrefix(collectTranslationKeysUsedInDir(featureRoot), [
      "saved.",
      "why_not.",
      "modals.",
    ]);
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(SAVED_TRANSLATIONS, used);
  });
});
