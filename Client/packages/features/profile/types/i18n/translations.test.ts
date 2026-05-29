import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { PROFILE_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("PROFILE_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(PROFILE_TRANSLATIONS, ["profile.", "favorite_homes."]);
  });

  it("resolves keys used in profile feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "profile.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(PROFILE_TRANSLATIONS, used);
  });
});
