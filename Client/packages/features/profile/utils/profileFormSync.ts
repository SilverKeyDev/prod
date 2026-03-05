/**
 * Single source of truth for syncing API user preferences into profile form (OnboardingData).
 * Ensures every field in every section is normalized so autofill works consistently
 * across ProfileFeature, Settings, ProfileScreen.native, and PreferencesFormContent.
 */

import { parseUserPreferencesArray } from "./preferencesUtils";
import type { OnboardingData } from "./types";

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function toString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function toBool(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return undefined;
}

function toStringArray(value: unknown): string[] {
  const arr = parseUserPreferencesArray(value);
  return arr.filter((v): v is string => typeof v === "string");
}

function toImportantLocations(value: unknown): { address: string; commute_tolerance?: number }[] {
  const arr = parseUserPreferencesArray(value);
  return arr
    .filter(
      (v): v is Record<string, unknown> => typeof v === "object" && v !== null && "address" in v
    )
    .map((v) => ({
      address: typeof v.address === "string" ? v.address : String(v.address ?? ""),
      commute_tolerance:
        typeof v.commute_tolerance === "number" && !Number.isNaN(v.commute_tolerance)
          ? v.commute_tolerance
          : undefined,
    }))
    .filter((loc) => loc.address.trim() !== "");
}

/** Optional user profile; when provided, name is synced from profile (auth source of truth). */
export type UserProfileForSync = { name?: string | null } | null | undefined;

/**
 * Builds the payload to send to the preferences API (users_demographics). Omits
 * fields that belong to the users table (e.g. name) so the backend is not sent
 * identity columns that it does not persist in preferences.
 */
export function formDataToPreferencesPayload(
  formData: OnboardingData
): Omit<OnboardingData, "name"> & Record<string, unknown> {
  const { name: _name, ...rest } = formData;
  return rest as Omit<OnboardingData, "name"> & Record<string, unknown>;
}

/**
 * Maps raw API user preferences to OnboardingData with every field normalized.
 * Use this whenever populating the profile form from userPreferences so that
 * all sections (demographics, financial, housing, location, communication)
 * autofill correctly regardless of API response shape (strings vs numbers, etc.).
 * Pass userProfile when available so the name field syncs from the authenticated user profile.
 */
export function userPreferencesToOnboardingData(
  prefs: Record<string, unknown> | null | undefined,
  userProfile?: UserProfileForSync
): OnboardingData {
  if (!prefs || typeof prefs !== "object") return {};

  const get = (key: string): unknown => prefs[key];
  const nameFromProfile =
    userProfile != null && typeof userProfile.name === "string" && userProfile.name.trim() !== ""
      ? userProfile.name.trim()
      : undefined;

  return {
    // Metadata
    preferences_version: toString(get("preferences_version")),

    // Demographics — name from user profile (auth) when available, else from preferences
    name: nameFromProfile ?? toString(get("name")),
    is_agent: toString(get("is_agent")),
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

    // Housing
    preferred_housing_type: toString(get("preferred_housing_type")),
    preferred_bathrooms: toNumber(get("preferred_bathrooms")),
    preferred_bedrooms: toNumber(get("preferred_bedrooms")),
    preferred_bathrooms_max: toNumber(get("preferred_bathrooms_max")),
    preferred_bedrooms_max: toNumber(get("preferred_bedrooms_max")),
    listing_status: toString(get("listing_status")),
    preferred_lot_size: toString(get("preferred_lot_size")),
    preferred_home_age: toString(get("preferred_home_age")),
    preferred_lot_size_min: toNumber(get("preferred_lot_size_min")),
    preferred_lot_size_max: toNumber(get("preferred_lot_size_max")),
    preferred_home_age_max: toNumber(get("preferred_home_age_max")),
    preferred_architectural_style: toString(get("preferred_architectural_style")),
    preferred_home_features: toStringArray(get("preferred_home_features")),
    must_have: toStringArray(get("must_have")),
    preferred_sqft_min: toNumber(get("preferred_sqft_min")),
    preferred_sqft_max: toNumber(get("preferred_sqft_max")),
    listing_type: toStringArray(get("listing_type")),
    days_on_market_min: toNumber(get("days_on_market_min")),
    days_on_market_max: toNumber(get("days_on_market_max")),
    renovation_preference: toString(get("renovation_preference")),
    intended_property_use: toString(get("intended_property_use")),
    architectural_style_preference: toString(get("architectural_style_preference")),
    deal_breakers: toStringArray(get("deal_breakers")),

    // Location
    preferred_regions: parseUserPreferencesArray(get("preferred_regions"))
      .filter(
        (v): v is Record<string, unknown> => typeof v === "object" && v !== null && "address" in v
      )
      .map((v) => ({
        name: typeof v.name === "string" ? v.name : "",
        address: typeof v.address === "string" ? v.address : String(v.address ?? ""),
      }))
      .filter((r) => r.address.trim() !== ""),
    important_locations: toImportantLocations(get("important_locations")),
    walkability_importance: toString(get("walkability_importance")),

    // Communication
    communication_frequency: toString(get("communication_frequency")),
    information_detail_level: toString(get("information_detail_level")),
    has_buyers_agent: toString(get("has_buyers_agent")),
    looking_for_buyers_agent: toBool(get("looking_for_buyers_agent")),
  };
}
