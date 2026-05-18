import { describe, expect, it } from "vitest";

import { ADMIN_TRANSLATIONS } from "packages/features/admin/types/translations";
import { AGENT_TRANSLATIONS } from "packages/features/agent/types/translations";
import { BROKERAGE_TRANSLATIONS } from "packages/features/brokerage/types/translations";
import { CHECKLISTS_TRANSLATIONS } from "packages/features/checklists/types/translations";
import { COMPARE_TRANSLATIONS } from "packages/features/compare/types/translations";
import { DASHBOARD_TRANSLATIONS } from "packages/features/dashboard/types/translations";
import { DOCUMENTS_TRANSLATIONS } from "packages/features/documents/types/translations";
import { FEED_TRANSLATIONS } from "packages/features/feed/types/translations";
import { AUTH_TRANSLATIONS } from "packages/features/homeauth/types/translations";
import { NEGOTIATE_TRANSLATIONS } from "packages/features/negotiate/types/translations";
import { PROFILE_TRANSLATIONS } from "packages/features/profile/types/translations";
import { PROPERTY_DETAILS_TRANSLATIONS } from "packages/features/propertyDetails/types/translations";
import { SAVED_TRANSLATIONS } from "packages/features/saved/types/translations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { assertKeysResolve } from "packages/utils/test/translationAssertions";

import { TRANSLATIONS } from "./index";
import { SHARED_TRANSLATIONS } from "./shared";

const FEATURE_MODULES = {
  SHARED_TRANSLATIONS,
  AUTH_TRANSLATIONS,
  BROKERAGE_TRANSLATIONS,
  ADMIN_TRANSLATIONS,
  SEARCH_TRANSLATIONS,
  PROPERTY_DETAILS_TRANSLATIONS,
  SAVED_TRANSLATIONS,
  DOCUMENTS_TRANSLATIONS,
  FEED_TRANSLATIONS,
  COMPARE_TRANSLATIONS,
  NEGOTIATE_TRANSLATIONS,
  DASHBOARD_TRANSLATIONS,
  PROFILE_TRANSLATIONS,
  AGENT_TRANSLATIONS,
  CHECKLISTS_TRANSLATIONS,
} as const;

function findDuplicateKeysAcrossModules(modules: Record<string, Record<string, string>>): string[] {
  const ownerByKey = new Map<string, string>();
  const duplicates: string[] = [];

  for (const [moduleName, map] of Object.entries(modules)) {
    for (const key of Object.keys(map)) {
      const existing = ownerByKey.get(key);
      if (existing) {
        duplicates.push(`${key} (${existing}, ${moduleName})`);
      } else {
        ownerByKey.set(key, moduleName);
      }
    }
  }

  return duplicates;
}

describe("TRANSLATIONS aggregator", () => {
  it("includes every key from each feature translation module", () => {
    for (const [moduleName, map] of Object.entries(FEATURE_MODULES)) {
      for (const key of Object.keys(map)) {
        expect(TRANSLATIONS[key], `${moduleName} missing in TRANSLATIONS: ${key}`).toBe(map[key]);
      }
    }
  });

  it("has no duplicate keys across translation modules", () => {
    const duplicates = findDuplicateKeysAcrossModules(FEATURE_MODULES);
    expect(duplicates, duplicates.join("; ")).toEqual([]);
  });

  it("resolves cross-feature keys used from dashboard UI", () => {
    assertKeysResolve(TRANSLATIONS, [
      "dashboard.tab_roadmap",
      "dashboard.tab_profile",
      "checklists.loading",
      "checklists.buyer_journey.title",
      "saved.loading_agreements",
      "saved.no_agreements_yet",
      "saved.tab_agreements",
      "common.cancel",
    ]);
  });

  it("does not expose raw key strings for resolved cross-feature entries", () => {
    for (const key of ["common.cancel", "saved.tab_agreements", "checklists.buyer_journey.title"]) {
      const value = TRANSLATIONS[key];
      expect(value).toBeDefined();
      expect(value).not.toBe(key);
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});
