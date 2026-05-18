import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMap,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { FEED_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("FEED_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMap(FEED_TRANSLATIONS, "feed.");
  });

  it("resolves keys used in feed feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "feed.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(FEED_TRANSLATIONS, used);
  });
});
