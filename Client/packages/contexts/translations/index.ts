/**
 * English translation strings. Aggregated from shared and feature-owned types/translations.
 * LocalizationContext consumes TRANSLATIONS. Feature strings live in packages/features/<name>/types/translations.ts.
 */
import { AGENT_TRANSLATIONS } from "packages/features/agent/types/translations";
import { CHECKLISTS_TRANSLATIONS } from "packages/features/checklists/types/translations";
import { COMPARE_TRANSLATIONS } from "packages/features/compare/types/translations";
import { DASHBOARD_TRANSLATIONS } from "packages/features/dashboard/types/translations";
import { DOCUMENTS_TRANSLATIONS } from "packages/features/documents/types/translations";
import { AUTH_TRANSLATIONS } from "packages/features/homeauth/types/translations";
import { NEGOTIATE_TRANSLATIONS } from "packages/features/negotiate/types/translations";
import { PROFILE_TRANSLATIONS } from "packages/features/profile/types/translations";
import { PROPERTY_DETAILS_TRANSLATIONS } from "packages/features/propertyDetails/types/translations";
import { SAVED_TRANSLATIONS } from "packages/features/saved/types/translations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/translations";

import { SHARED_TRANSLATIONS } from "./shared";

export const TRANSLATIONS: Record<string, string> = {
  ...SHARED_TRANSLATIONS,
  ...AUTH_TRANSLATIONS,
  ...SEARCH_TRANSLATIONS,
  ...PROPERTY_DETAILS_TRANSLATIONS,
  ...SAVED_TRANSLATIONS,
  ...DOCUMENTS_TRANSLATIONS,
  ...COMPARE_TRANSLATIONS,
  ...NEGOTIATE_TRANSLATIONS,
  ...DASHBOARD_TRANSLATIONS,
  ...PROFILE_TRANSLATIONS,
  ...AGENT_TRANSLATIONS,
  ...CHECKLISTS_TRANSLATIONS,
};
