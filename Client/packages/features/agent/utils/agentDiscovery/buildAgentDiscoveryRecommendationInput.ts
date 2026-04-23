import type { SearchFilterOverrides } from "packages/features/search/store/searchContext.slice";
import type { UserPreferences } from "packages/types";

export type AgentDiscoveryRecommendationInput = {
  zip?: string;
  state?: string;
  intent?: string;
};

const US_STATE_PATTERN = /\b([A-Z]{2})\s+\d{5}\b/;

function digitsOnlyZip(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 5) return digits.slice(0, 5);
  return undefined;
}

function zipFromPreferences(prefs: UserPreferences | null): string | undefined {
  if (!prefs) return undefined;
  const flat = prefs as Record<string, unknown>;
  const fin = prefs.financial_profile as Record<string, unknown> | undefined;
  const raw =
    (typeof fin?.ideal_zip_code === "string" && fin.ideal_zip_code) ||
    (typeof flat.ideal_zip_code === "string" && flat.ideal_zip_code) ||
    undefined;
  return raw ? digitsOnlyZip(raw) : undefined;
}

function zipFromLocationLabel(label: string | null | undefined): string | undefined {
  if (!label?.trim()) return undefined;
  const five = label.match(/\b(\d{5})(?:-\d{4})?\b/);
  return five ? five[1] : undefined;
}

function stateFromLocationLabel(label: string | null | undefined): string | undefined {
  if (!label?.trim()) return undefined;
  const m = label.toUpperCase().match(US_STATE_PATTERN);
  return m ? m[1] : undefined;
}

function buildIntent(
  prefs: UserPreferences | null,
  overrides: SearchFilterOverrides
): string | undefined {
  const parts: string[] = [];
  const hp = prefs?.housing_preferences as Record<string, unknown> | undefined;
  const re = prefs?.real_estate as Record<string, unknown> | undefined;

  if (hp?.preferred_housing_type != null && String(hp.preferred_housing_type).trim()) {
    parts.push(String(hp.preferred_housing_type));
  }
  if (typeof hp?.preferred_bedrooms_min === "number") {
    parts.push(`${hp.preferred_bedrooms_min}+ bed`);
  }
  if (typeof hp?.preferred_bathrooms_min === "number") {
    parts.push(`${hp.preferred_bathrooms_min}+ bath`);
  }
  if (re?.listing_status != null && String(re.listing_status).trim()) {
    parts.push(String(re.listing_status));
  }

  if (overrides.must_have?.length) {
    parts.push(...overrides.must_have);
  }
  if (overrides.preferred_home_features?.length) {
    parts.push(...overrides.preferred_home_features);
  }

  const intent = parts.join(" ").replace(/\s+/g, " ").trim();
  return intent.length ? intent.slice(0, 500) : undefined;
}

export function buildAgentDiscoveryRecommendationInput(args: {
  preferences: UserPreferences | null;
  locationPlaceLabel: string | null;
  searchFilterOverrides: SearchFilterOverrides;
}): AgentDiscoveryRecommendationInput {
  const { preferences, locationPlaceLabel, searchFilterOverrides } = args;
  const zip =
    zipFromLocationLabel(locationPlaceLabel) ?? zipFromPreferences(preferences) ?? undefined;
  const state = stateFromLocationLabel(locationPlaceLabel) ?? undefined;
  const intent = buildIntent(preferences, searchFilterOverrides);
  const out: AgentDiscoveryRecommendationInput = {};
  if (zip) out.zip = zip;
  if (state) out.state = state;
  if (intent) out.intent = intent;
  return out;
}

export function serializeAgentDiscoveryRecommendationInput(
  input: AgentDiscoveryRecommendationInput
): string {
  return JSON.stringify({
    z: input.zip ?? null,
    s: input.state ?? null,
    i: input.intent ?? null,
  });
}
