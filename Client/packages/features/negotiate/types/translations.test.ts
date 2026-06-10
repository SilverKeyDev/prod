import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/core/test/translationAssertions";

import { NEGOTIATE_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("NEGOTIATE_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(NEGOTIATE_TRANSLATIONS, ["negotiate.", "negotiation."]);
  });

  it("resolves keys used in negotiate feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "negotiate.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(NEGOTIATE_TRANSLATIONS, used);
  });
});
