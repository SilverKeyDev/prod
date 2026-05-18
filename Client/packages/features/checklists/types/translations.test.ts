import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { CHECKLISTS_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("CHECKLISTS_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(CHECKLISTS_TRANSLATIONS, ["checklists.", "close."]);
  });

  it("resolves keys used in checklists feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "checklists.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(CHECKLISTS_TRANSLATIONS, used);
  });
});
