import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { COMPARE_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("COMPARE_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(COMPARE_TRANSLATIONS, [
      "compare.",
      "compare_floating.",
    ]);
  });

  it("resolves keys used in compare feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "compare.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(COMPARE_TRANSLATIONS, used);
  });
});
