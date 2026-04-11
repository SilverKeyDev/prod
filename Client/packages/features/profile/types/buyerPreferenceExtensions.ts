/** Mirrors server `extended_buyer_preferences` v1 sections (whitelist-validated on write). */

export const BUYER_PREFERENCE_EXTENSIONS_VERSION = 1 as const;

export type BuyerPriceFinancing = {
  hoa_ok?: boolean;
  hoa_fee_max_monthly?: number;
};

export type BuyerLocationPrefs = {
  flood_importance?: string;
  noise_importance?: string;
};

export type BuyerPhysicalPrefs = {
  garage_required?: boolean;
  garage_min_cars?: number;
  stories_preference?: string;
  parking_type?: string;
  accessibility_needs?: string;
  outdoor_space_importance?: string;
  fireplace_preference?: string;
  view_importance?: string;
};

export type BuyerConditionPrefs = {
  prefer_price_reduced?: boolean;
  prefer_virtual_tour?: boolean;
  prefer_open_house?: boolean;
  foreclosure_ok?: boolean;
};

export type BuyerUtilitiesPrefs = {
  hvac_preference?: string;
  utilities_included_importance?: string;
  solar_interest?: string;
  ev_charger_interest?: string;
};

export type BuyerNeighborhoodPrefs = {
  walkability_importance?: string;
  crime_importance?: string;
  pet_friendly_area?: string;
};

export type BuyerPreferenceExtensions = {
  v: typeof BUYER_PREFERENCE_EXTENSIONS_VERSION;
  price_financing?: BuyerPriceFinancing;
  location_prefs?: BuyerLocationPrefs;
  physical?: BuyerPhysicalPrefs;
  condition?: BuyerConditionPrefs;
  utilities?: BuyerUtilitiesPrefs;
  neighborhood?: BuyerNeighborhoodPrefs;
};

const EXT_SECTION_KEYS = [
  "price_financing",
  "location_prefs",
  "physical",
  "condition",
  "utilities",
  "neighborhood",
] as const;

export function toBuyerPreferenceExtensions(
  value: unknown,
): BuyerPreferenceExtensions | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const o = value as Record<string, unknown>;
  if ("v" in o && o.v !== 1 && o.v !== undefined) return undefined;
  const out: BuyerPreferenceExtensions = { v: 1 };
  for (const key of EXT_SECTION_KEYS) {
    const s = o[key];
    if (s && typeof s === "object" && !Array.isArray(s)) {
      (out as Record<string, unknown>)[key] = s;
    }
  }
  return out;
}
