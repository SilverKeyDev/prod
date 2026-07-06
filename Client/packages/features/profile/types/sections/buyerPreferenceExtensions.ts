/** Mirrors server `extended_buyer_preferences` v1 sections (whitelist-validated on write). */

import type { BuyerAboutMePrefs } from "packages/features/profile/types/buyerAboutMe";
import type { BuyerPriceFinancingPrefs } from "packages/features/profile/types/buyerFinancing";

export const BUYER_PREFERENCE_EXTENSIONS_VERSION = 1 as const;

export type BuyerPriceFinancing = BuyerPriceFinancingPrefs;

export type BuyerAboutMe = BuyerAboutMePrefs;

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

/** Weekly recurring availability (0 = Sunday …6 = Saturday). Stored in `extended_buyer_preferences.availability`. */
export type BuyerAvailabilityWeeklySlot = {
  id: string;
  weekday: number;
  start: string;
  end: string;
};

export type BuyerAvailabilityOneOff = {
  id: string;
  date: string;
  start: string;
  end: string;
};

export type BuyerAvailabilityException = {
  id: string;
  scope: "weekly";
  ruleId: string;
  date: string;
};

export type BuyerAvailabilityPrefs = {
  timezone?: string;
  weekly?: BuyerAvailabilityWeeklySlot[];
  oneOff?: BuyerAvailabilityOneOff[];
  exceptions?: BuyerAvailabilityException[];
};

export type BuyerPreferenceExtensions = {
  v: typeof BUYER_PREFERENCE_EXTENSIONS_VERSION;
  buyer_about_me?: BuyerAboutMe;
  price_financing?: BuyerPriceFinancing;
  location_prefs?: BuyerLocationPrefs;
  physical?: BuyerPhysicalPrefs;
  condition?: BuyerConditionPrefs;
  utilities?: BuyerUtilitiesPrefs;
  neighborhood?: BuyerNeighborhoodPrefs;
  availability?: BuyerAvailabilityPrefs;
};

const EXT_SECTION_KEYS = [
  "buyer_about_me",
  "price_financing",
  "location_prefs",
  "physical",
  "condition",
  "utilities",
  "neighborhood",
  "availability",
] as const;

export function toBuyerPreferenceExtensions(value: unknown): BuyerPreferenceExtensions | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const o = value as Record<string, unknown>;
  if ("v" in o && o.v !== 1 && o.v !== undefined) return undefined;
  const out: BuyerPreferenceExtensions = { v: 1 };
  for (const key of EXT_SECTION_KEYS) {
    const s = o[key];
    if (!s || typeof s !== "object" || Array.isArray(s)) continue;
    if (key === "availability") {
      const a = s as Record<string, unknown>;
      const availability: BuyerAvailabilityPrefs = {};
      if (typeof a.timezone === "string" && a.timezone.trim())
        availability.timezone = a.timezone.trim();
      if (Array.isArray(a.weekly)) availability.weekly = a.weekly as BuyerAvailabilityWeeklySlot[];
      if (Array.isArray(a.oneOff)) availability.oneOff = a.oneOff as BuyerAvailabilityOneOff[];
      if (Array.isArray(a.exceptions))
        availability.exceptions = a.exceptions as BuyerAvailabilityException[];
      if (
        availability.timezone ||
        availability.weekly?.length ||
        availability.oneOff?.length ||
        availability.exceptions?.length
      ) {
        (out as Record<string, unknown>).availability = availability;
      }
      continue;
    }
    (out as Record<string, unknown>)[key] = s;
  }
  return out;
}
