import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  assertKeysResolve,
  assertTranslationMapWithAllowedPrefixes,
  collectTranslationKeysUsedInDir,
  keysWithPrefix,
} from "packages/utils/test/translationAssertions";

import { AGENT_TRANSLATIONS } from "./translations";

const featureRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("AGENT_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMapWithAllowedPrefixes(AGENT_TRANSLATIONS, ["agent.", "client_selector."]);
  });

  it("resolves keys used in agent feature UI", () => {
    const used = keysWithPrefix(collectTranslationKeysUsedInDir(featureRoot), "agent.");
    expect(used.length).toBeGreaterThan(0);
    assertKeysResolve(AGENT_TRANSLATIONS, used);
  });
});
