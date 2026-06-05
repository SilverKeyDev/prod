import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMap,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/core/test/translationAssertions";

import { AUTH_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("AUTH_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMap(AUTH_TRANSLATIONS, "auth.");
  });

  it("resolves keys used in homeauth feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "auth.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(AUTH_TRANSLATIONS, used);
  });
});
