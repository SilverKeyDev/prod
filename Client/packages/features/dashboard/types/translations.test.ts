import { describe, it } from "vitest";

import { assertKeysResolve, assertTranslationMap } from "packages/utils/test/translationAssertions";

import { DASHBOARD_TRANSLATIONS } from "./translations";

describe("DASHBOARD_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    assertTranslationMap(DASHBOARD_TRANSLATIONS, "dashboard.");
  });

  it("includes keys used by client hub and calendar surfaces", () => {
    assertKeysResolve(DASHBOARD_TRANSLATIONS, [
      "dashboard.tab_roadmap",
      "dashboard.tab_profile",
      "dashboard.tab_liked_homes",
      "dashboard.tab_library",
      "dashboard.tab_schedule",
      "dashboard.client_calendar_not_connected_title",
      "dashboard.client_calendar_permission_title",
    ]);
  });
});
