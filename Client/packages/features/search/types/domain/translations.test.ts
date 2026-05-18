import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMap,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { SEARCH_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("SEARCH_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMap(SEARCH_TRANSLATIONS, "search.");
  });

  it("resolves keys used in search feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "search.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(SEARCH_TRANSLATIONS, used);
  });
});
