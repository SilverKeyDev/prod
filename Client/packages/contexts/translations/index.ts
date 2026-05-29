/**
 * English translation strings. Aggregated from shared and feature-owned types/translations.
 * LocalizationContext consumes TRANSLATIONS. Feature strings live in packages/features/<name>/types/translations.ts.
 */
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
import { partnersFeatureTranslations } from "packages/features/partners/types/translations";
import { PROFILE_TRANSLATIONS } from "packages/features/profile/types/i18n/translations";
import { PROPERTY_DETAILS_TRANSLATIONS } from "packages/features/propertyDetails/types/translations";
import { SAVED_TRANSLATIONS } from "packages/features/saved/types/translations";
import { SEARCH_TRANSLATIONS } from "packages/features/search/types/domain/translations";
import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";
import { WORKSPACE_TRANSLATIONS } from "packages/features/workspace/types/translations";

import { ERRORS_TRANSLATIONS } from "./errors";
import { SHARED_TRANSLATIONS } from "./shared";

export const TRANSLATIONS: Record<string, string> = {
  ...SHARED_TRANSLATIONS,
  ...ERRORS_TRANSLATIONS,
  ...AUTH_TRANSLATIONS,
  ...BROKERAGE_TRANSLATIONS,
  ...WORKSPACE_TRANSLATIONS,
  ...SELLER_TRANSLATIONS,
  ...ADMIN_TRANSLATIONS,
  ...SEARCH_TRANSLATIONS,
  ...PROPERTY_DETAILS_TRANSLATIONS,
  ...SAVED_TRANSLATIONS,
  ...DOCUMENTS_TRANSLATIONS,
  ...FEED_TRANSLATIONS,
  ...COMPARE_TRANSLATIONS,
  ...NEGOTIATE_TRANSLATIONS,
  ...DASHBOARD_TRANSLATIONS,
  ...PROFILE_TRANSLATIONS,
  ...AGENT_TRANSLATIONS,
  ...CHECKLISTS_TRANSLATIONS,
  ...partnersFeatureTranslations,
};
