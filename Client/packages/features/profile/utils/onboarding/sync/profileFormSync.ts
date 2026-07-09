/**
 * Single source of truth for syncing API user preferences into profile form (OnboardingData).
 * Ensures every field in every section is normalized so autofill works consistently
 * across ProfileFeature, Settings, ProfileScreen, and PreferencesFormContent.
 */

import type { DownPaymentBandValue } from "packages/features/profile/types/buyerFinancing";
import type { UserProfileForSync } from "packages/features/profile/types/form/profileFormSync";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { toBuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { downPaymentDollarsFromBand } from "packages/features/profile/utils/financials/downPaymentBand";
import { primaryOnboardingRoleFromForm } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import {
  applyBuyerFlatFieldsFromApi,
  buildBuyerPreferenceExtensionsFromForm,
  stripBuyerFlatKeysFromPayload,
} from "packages/features/profile/utils/onboarding/sync/buyerPreferencesSync";
import { parseUserPreferencesArray } from "packages/features/profile/utils/onboarding/validation/preferencesUtils";

import {
  toBool,
  toDictArray,
  toImportantLocations,
  toNumber,
  toRecordString,
  toString,
  toStringArray,
  toTestimonialArray,
} from "./profileFormSyncCoercions";

export type { UserProfileForSync } from "packages/features/profile/types/form/profileFormSync";

/**
 * Bump "major.minor" for preferences_version (profile/onboarding saves stay aligned).
 */
export function nextPreferencesVersion(current?: string | null): string {
  const raw = (current ?? "1.0").trim();
  const base = raw.length > 0 ? raw : "1.0";
  const parts = base.split(".");
  const major = parseInt(parts[0] ?? "1", 10);
  const minor = parseInt(parts[1] ?? "0", 10);
  const m = Number.isNaN(major) ? 1 : major;
  const minorSafe = Number.isNaN(minor) ? 0 : minor;
  return `${m}.${minorSafe + 1}`;
}

/** Merge GET /preferences with local onboarding draft; draft wins on overlaps; keep server locations if draft has none. */
export function mergeOnboardingServerAndDraft(
  server: OnboardingData,
  draft: OnboardingData | null,
): OnboardingData {
  if (!draft) {
    const locs =
      server.important_locations?.filter(
        (l) => (l.address ?? "").trim() !== "",
      ) ?? [];
    return { ...server, important_locations: locs };
  }
  const draftLocs =
    draft.important_locations?.filter((l) => (l.address ?? "").trim() !== "") ??
    [];
  const serverLocs =
    server.important_locations?.filter(
      (l) => (l.address ?? "").trim() !== "",
    ) ?? [];
  const draftHasLocationsField = draft.important_locations !== undefined;
  const important_locations = draftHasLocationsField
    ? draftLocs
    : serverLocs.length > 0
      ? serverLocs
      : [];
  return {
    ...server,
    ...draft,
    important_locations,
  };
}

function isAgentFormData(
  formData: OnboardingData,
  userProfile?: UserProfileForSync,
): boolean {
  return (
    primaryOnboardingRoleFromForm(formData, { roles: userProfile?.roles }) ===
    "agent"
  );
}

/**
 * Builds the payload to send to the preferences API. Includes name so the backend
 * can persist it to User (single source of truth); GET preferences returns name from User.
 * When the user is not an agent (draft role or auth roles), agent_* fields are omitted.
 * Maps form keys to backend-expected keys (housing_type, preferred_*_min/max, important_locations, extended_buyer_preferences).
 */
export function formDataToPreferencesPayload(
  formData: OnboardingData,
  userProfile?: UserProfileForSync,
): Record<string, unknown> {
  const { name, important_locations, ...rest } = formData;
  const payload = {
    ...rest,
    ...(name !== undefined && name !== "" ? { name } : {}),
  } as Record<string, unknown>;

  // Backend expects housing_type (form: preferred_housing_type)
  if (formData.preferred_housing_type !== undefined) {
    payload.housing_type = formData.preferred_housing_type;
  }
  // preferred_bedrooms_min/max and preferred_bathrooms_min/max pass through via ...rest
  // Backend expects important_locations with max_commute_minutes (form: commute_tolerance).
  // Use `in` so an explicit empty list always clears the server (Partial form state must still send []).
  if (Object.prototype.hasOwnProperty.call(formData, "important_locations")) {
    const locs = Array.isArray(important_locations) ? important_locations : [];
    if (locs.length > 0) {
      payload.important_locations = locs.map((loc) => ({
        address: loc.address,
        max_commute_minutes:
          loc.commute_tolerance !== undefined && loc.commute_tolerance !== null
            ? loc.commute_tolerance
            : undefined,
      }));
    } else {
      payload.important_locations = [];
    }
  }

  // Backend expects extended_buyer_preferences (form: buyerPreferenceExtensions)
  const mergedExtensions = buildBuyerPreferenceExtensionsFromForm(formData);
  if (mergedExtensions !== undefined) {
    payload.extended_buyer_preferences = mergedExtensions;
  } else if (formData.buyerPreferenceExtensions !== undefined) {
    payload.extended_buyer_preferences = formData.buyerPreferenceExtensions;
  }
  delete payload.buyerPreferenceExtensions;

  // Map buyer pets boolean → demographics.pets yes/no
  if (formData.buyer_about_has_pets !== undefined) {
    payload.pets = formData.buyer_about_has_pets ? "yes" : "no";
  }

  // Derive down_payment dollars from band when financing
  if (
    !formData.paying_cash &&
    formData.down_payment_band &&
    formData.home_budget_max != null
  ) {
    payload.down_payment = downPaymentDollarsFromBand(
      formData.down_payment_band as DownPaymentBandValue,
      formData.home_budget_max,
    );
  }

  stripBuyerFlatKeysFromPayload(payload);

  if (!isAgentFormData(formData, userProfile)) {
    for (const key of Object.keys(payload)) {
      if (key.startsWith("agent_")) delete payload[key];
    }
  }
  delete payload.public_profile_slug;
  delete payload.agent_professional_headshot_url;
  delete payload.workspace_shell_test_input;
  return payload;
}

/**
 * Maps raw API user preferences to OnboardingData with every field normalized.
 * Use this whenever populating the profile form from userPreferences so that
 * all sections (demographics, financial, housing, location, optional legacy prefs)
 * autofill correctly regardless of API response shape (strings vs numbers, etc.).
 * Pass userProfile when available so the name field syncs from the authenticated user profile.
 */
export function userPreferencesToOnboardingData(
  prefs: Record<string, unknown> | null | undefined,
  userProfile?: UserProfileForSync,
): OnboardingData {
  if (!prefs || typeof prefs !== "object") return {};

  const get = (key: string): unknown => prefs[key];
  const nameFromProfile =
    userProfile != null &&
    typeof userProfile.name === "string" &&
    userProfile.name.trim() !== ""
      ? userProfile.name.trim()
      : undefined;

  // Backend sends extended_buyer_preferences; map to form key buyerPreferenceExtensions
  const extendedBuyerPrefs = get("extended_buyer_preferences");
  const buyerPreferenceExtensions = toBuyerPreferenceExtensions(
    extendedBuyerPrefs !== null &&
      extendedBuyerPrefs !== undefined &&
      typeof extendedBuyerPrefs === "object" &&
      !Array.isArray(extendedBuyerPrefs)
      ? extendedBuyerPrefs
      : undefined,
  );

  const data: OnboardingData = {
    // Metadata
    preferences_version: toString(get("preferences_version")),

    // Demographics — name from user profile (auth) when available, else from preferences
    name: nameFromProfile ?? toString(get("name")),
    pets: toString(get("pets")),
    age: toNumber(get("age")),
    why_joining_silverkey: toStringArray(get("why_joining_silverkey")),
    gender: toString(get("gender")),
    occupation: toString(get("occupation")),
    marital_status: toString(get("marital_status")),
    children_count: toNumber(get("children_count")),

    // Financial
    gross_income: toNumber(get("gross_income")),
    home_budget_min: toNumber(get("home_budget_min")),
    home_budget_max: toNumber(get("home_budget_max")),
    credit_score_range: toString(get("credit_score_range")),
    down_payment: toNumber(get("down_payment")),
    ideal_zip_code: toString(get("ideal_zip_code")),

    // Housing — map backend keys (housing_type, preferred_*_min/max) to form keys
    preferred_housing_type:
      toString(get("preferred_housing_type")) ?? toString(get("housing_type")),
    preferred_bedrooms_min: toNumber(get("preferred_bedrooms_min")),
    preferred_bedrooms_max: toNumber(get("preferred_bedrooms_max")),
    preferred_bathrooms_min:
      toNumber(get("preferred_bathrooms")) ??
      toNumber(get("preferred_bathrooms_min")),
    preferred_bathrooms_max: toNumber(get("preferred_bathrooms_max")),
    listing_status: toString(get("listing_status")),
    preferred_lot_size: toString(get("preferred_lot_size")),
    preferred_home_age: toString(get("preferred_home_age")),
    preferred_lot_size_min: toNumber(get("preferred_lot_size_min")),
    preferred_lot_size_max: toNumber(get("preferred_lot_size_max")),
    preferred_home_age_min: toNumber(get("preferred_home_age_min")),
    preferred_home_age_max: toNumber(get("preferred_home_age_max")),
    preferred_architectural_style: toString(
      get("preferred_architectural_style"),
    ),
    other_requirements:
      toStringArray(get("other_requirements")).length > 0
        ? toStringArray(get("other_requirements"))
        : [
            ...toStringArray(get("preferred_home_features")),
            ...toStringArray(get("deal_breakers")),
          ],
    preferred_home_features: toStringArray(get("preferred_home_features")),
    must_have: toStringArray(get("must_have")),
    preferred_sqft_min: toNumber(get("preferred_sqft_min")),
    preferred_sqft_max: toNumber(get("preferred_sqft_max")),
    listing_type: toStringArray(get("listing_type")),
    days_on_market_min: toNumber(get("days_on_market_min")),
    days_on_market_max: toNumber(get("days_on_market_max")),
    renovation_preference: toString(get("renovation_preference")),
    intended_property_use: toString(get("intended_property_use")),
    architectural_style_preference: toString(
      get("architectural_style_preference"),
    ),
    deal_breakers: toStringArray(get("deal_breakers")),

    // Location
    preferred_regions: parseUserPreferencesArray(get("preferred_regions"))
      .filter(
        (v): v is Record<string, unknown> =>
          typeof v === "object" && v !== null && "address" in v,
      )
      .map((v) => ({
        name: typeof v.name === "string" ? v.name : "",
        address:
          typeof v.address === "string" ? v.address : String(v.address ?? ""),
      }))
      .filter((r) => r.address.trim() !== ""),
    important_locations: toImportantLocations(get("important_locations")),
    walkability_importance:
      toString(get("walkability_importance")) ??
      toString(buyerPreferenceExtensions?.neighborhood?.walkability_importance),
    /** Backend key `extended_buyer_preferences` mapped to form key `buyerPreferenceExtensions` */
    buyerPreferenceExtensions,

    // Communication
    communication_frequency: toString(get("communication_frequency")),
    preferred_contact_method: toString(get("preferred_contact_method")),
    information_detail_level: toString(get("information_detail_level")),
    has_buyers_agent: toString(get("has_buyers_agent")),
    looking_for_buyers_agent: toBool(get("looking_for_buyers_agent")),

    // Financial — paying_cash from intent attributes
    paying_cash: toBool(get("paying_cash")),

    // Agent profile (when user has agent role; API returns these only for agents)
    agent_physical_mailing_address: toString(
      get("agent_physical_mailing_address"),
    ),
    agent_licensed_states: toStringArray(get("agent_licensed_states")),
    agent_license_types: toStringArray(get("agent_license_types")),
    agent_license_numbers: toStringArray(get("agent_license_numbers")),
    agent_license_expiration_dates: toStringArray(
      get("agent_license_expiration_dates"),
    ),
    agent_mls_affiliations: toDictArray(get("agent_mls_affiliations")),
    agent_testimonials: toTestimonialArray(get("agent_testimonials")),
    agent_brokerage_name: toString(get("agent_brokerage_name")),
    agent_brokerage_bic_name: toString(get("agent_brokerage_bic_name")),
    agent_brokerage_address: toString(get("agent_brokerage_address")),
    agent_brokerage_email: toString(get("agent_brokerage_email")),
    agent_brokerage_phone: toString(get("agent_brokerage_phone")),
    agent_bio: toString(get("agent_bio")),
    agent_primary_service_zips: toStringArray(
      get("agent_primary_service_zips"),
    ),
    agent_specialties: toStringArray(get("agent_specialties")),
    agent_social_links: toRecordString(get("agent_social_links")),
    // Brokerage onboarding (MVP)
    brokerage_legal_business_name: toString(get("brokerage_legal_business_name")),
    brokerage_dba_name: toString(get("brokerage_dba_name")),
    brokerage_primary_admin_name: toString(get("brokerage_primary_admin_name")),
    brokerage_primary_admin_email: toString(get("brokerage_primary_admin_email")),
    brokerage_primary_admin_phone: toString(get("brokerage_primary_admin_phone")),
    brokerage_primary_admin_title: toString(get("brokerage_primary_admin_title")),
    brokerage_admin_is_broker_of_record: toBool(get("brokerage_admin_is_broker_of_record")),
    brokerage_license_number: toString(get("brokerage_license_number")),
    brokerage_license_states: toStringArray(get("brokerage_license_states")),
    brokerage_broker_of_record_name: toString(get("brokerage_broker_of_record_name")),
    brokerage_broker_of_record_license_number: toString(
      get("brokerage_broker_of_record_license_number")
    ),
    brokerage_agent_count: toNumber(get("brokerage_agent_count")),
    brokerage_expected_monthly_users: toNumber(get("brokerage_expected_monthly_users")),
    brokerage_primary_markets: toStringArray(get("brokerage_primary_markets")),
    brokerage_office_name: toString(get("brokerage_office_name")),
    brokerage_office_address: toString(get("brokerage_office_address")),
    brokerage_office_state: toString(get("brokerage_office_state")),
    brokerage_account_manager_name: toString(get("brokerage_account_manager_name")),
    brokerage_account_manager_email: toString(get("brokerage_account_manager_email")),
    brokerage_branch_name: toString(get("brokerage_branch_name")),
    brokerage_branch_address: toString(get("brokerage_branch_address")),
    brokerage_is_branch: toBool(get("brokerage_is_branch")),
    brokerage_is_subteam: toBool(get("brokerage_is_subteam")),
    public_profile_slug: toString(get("public_profile_slug")),
  };

  const primaryRole = primaryOnboardingRoleFromForm(data, {
    roles: userProfile?.roles,
  });
  if (primaryRole) {
    data.primary_onboarding_role = primaryRole;
  }

  return applyBuyerFlatFieldsFromApi(data, prefs);
}
