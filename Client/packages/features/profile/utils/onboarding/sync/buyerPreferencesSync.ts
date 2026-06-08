/**
 * Maps buyer About Me + Financing flat form fields ↔ extended_buyer_preferences sections.
 */

import type {
  BuyerAboutMePrefs,
  BuyerMovingWithValue,
  BuyerPetTypeValue,
} from "packages/features/profile/types/buyerAboutMe";
import type {
  BuyerPriceFinancingPrefs,
  DownPaymentBandValue,
} from "packages/features/profile/types/buyerFinancing";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { BuyerPreferenceExtensions } from "packages/features/profile/types/sections/buyerPreferenceExtensions";
import { downPaymentDollarsFromBand } from "packages/features/profile/utils/financials/downPaymentBand";

/** Flat keys stripped from top-level preferences payload (stored in ext JSON or other tables). */
export const BUYER_FLAT_KEYS = [
  "buyer_about_moving_with",
  "buyer_about_kids_ages",
  "buyer_about_has_pets",
  "buyer_about_pet_types",
  "buyer_about_move_motivation",
  "lender_status",
  "lender_name",
  "want_lender_connection",
  "loan_type",
  "down_payment_band",
  "first_home",
  "max_monthly_payment",
  "rent_or_own",
  "need_to_sell_first",
  "move_timeline",
] as const;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

function mergeAboutMeSection(formData: OnboardingData): BuyerAboutMePrefs | undefined {
  const moving = toStringArray(formData.buyer_about_moving_with) as BuyerMovingWithValue[];
  const kidsAges = formData.buyer_about_kids_ages?.trim();
  const petTypes = toStringArray(formData.buyer_about_pet_types) as BuyerPetTypeValue[];
  const motivation = formData.buyer_about_move_motivation?.trim();
  if (moving.length === 0 && !kidsAges && petTypes.length === 0 && !motivation) {
    return undefined;
  }
  return {
    ...(moving.length > 0 ? { moving_with: moving } : {}),
    ...(kidsAges ? { kids_ages: kidsAges } : {}),
    ...(petTypes.length > 0 ? { pet_types: petTypes } : {}),
    ...(motivation ? { move_motivation: motivation } : {}),
  };
}

function mergePriceFinancingSection(
  formData: OnboardingData
): BuyerPriceFinancingPrefs | undefined {
  const section: BuyerPriceFinancingPrefs = {};
  const status = formData.lender_status;

  if (status) section.lender_status = status;

  if (status === "pre_approved" || status === "pre_qualified") {
    const name = formData.lender_name?.trim();
    if (name) section.lender_name = name;
  }

  if (status === "not_yet" && formData.want_lender_connection !== undefined) {
    section.want_lender_connection = formData.want_lender_connection;
  }

  if (formData.loan_type) section.loan_type = formData.loan_type;
  if (formData.down_payment_band) {
    section.down_payment_band = formData.down_payment_band as DownPaymentBandValue;
  }
  if (formData.first_home) section.first_home = formData.first_home;
  if (formData.max_monthly_payment != null) {
    section.max_monthly_payment = formData.max_monthly_payment;
  }
  if (formData.rent_or_own) section.rent_or_own = formData.rent_or_own;
  if (formData.rent_or_own === "own" && formData.need_to_sell_first) {
    section.need_to_sell_first = formData.need_to_sell_first;
  }
  if (formData.move_timeline) section.move_timeline = formData.move_timeline;

  // Preserve legacy HOA fields from prior ext when still present on form state.
  const legacyHoa = formData.buyerPreferenceExtensions?.price_financing;
  if (legacyHoa?.hoa_ok !== undefined) section.hoa_ok = legacyHoa.hoa_ok;
  if (legacyHoa?.hoa_fee_max_monthly != null) {
    section.hoa_fee_max_monthly = legacyHoa.hoa_fee_max_monthly;
  }

  return Object.keys(section).length > 0 ? section : undefined;
}

/** Merge flat buyer fields into buyerPreferenceExtensions for API payload. */
export function buildBuyerPreferenceExtensionsFromForm(
  formData: OnboardingData
): BuyerPreferenceExtensions | undefined {
  const aboutMe = mergeAboutMeSection(formData);
  const priceFinancing = mergePriceFinancingSection(formData);
  const prev = formData.buyerPreferenceExtensions ?? { v: 1 as const };
  const merged: BuyerPreferenceExtensions = {
    v: 1,
    ...(prev.location_prefs ? { location_prefs: prev.location_prefs } : {}),
    ...(prev.physical ? { physical: prev.physical } : {}),
    ...(prev.condition ? { condition: prev.condition } : {}),
    ...(prev.utilities ? { utilities: prev.utilities } : {}),
    ...(prev.neighborhood ? { neighborhood: prev.neighborhood } : {}),
    ...(prev.availability ? { availability: prev.availability } : {}),
    ...(aboutMe ? { buyer_about_me: aboutMe } : {}),
    ...(priceFinancing ? { price_financing: priceFinancing } : {}),
  };
  const hasSections = Object.keys(merged).some((k) => k !== "v");
  return hasSections ? merged : undefined;
}

/** Hydrate flat buyer fields from API preferences + extensions. */
export function applyBuyerFlatFieldsFromApi(
  data: OnboardingData,
  prefs: Record<string, unknown>
): OnboardingData {
  const ext = data.buyerPreferenceExtensions;
  const about = ext?.buyer_about_me;
  const pf = ext?.price_financing;

  const petsRaw = typeof prefs.pets === "string" ? prefs.pets.toLowerCase() : undefined;
  const hasPets = petsRaw === "yes" ? true : petsRaw === "no" ? false : undefined;

  const out: OnboardingData = {
    ...data,
    buyer_about_moving_with: about?.moving_with ?? data.buyer_about_moving_with,
    buyer_about_kids_ages: about?.kids_ages ?? data.buyer_about_kids_ages,
    buyer_about_has_pets: hasPets ?? data.buyer_about_has_pets,
    buyer_about_pet_types: about?.pet_types ?? data.buyer_about_pet_types,
    buyer_about_move_motivation: about?.move_motivation ?? data.buyer_about_move_motivation,
    preferred_contact_method:
      typeof prefs.preferred_contact_method === "string"
        ? prefs.preferred_contact_method
        : data.preferred_contact_method,
    lender_status: pf?.lender_status ?? data.lender_status,
    lender_name: pf?.lender_name ?? data.lender_name,
    want_lender_connection: pf?.want_lender_connection ?? data.want_lender_connection,
    loan_type: pf?.loan_type ?? data.loan_type,
    down_payment_band: pf?.down_payment_band ?? data.down_payment_band,
    first_home: pf?.first_home ?? data.first_home,
    max_monthly_payment: pf?.max_monthly_payment ?? data.max_monthly_payment,
    rent_or_own: pf?.rent_or_own ?? data.rent_or_own,
    need_to_sell_first: pf?.need_to_sell_first ?? data.need_to_sell_first,
    move_timeline: pf?.move_timeline ?? data.move_timeline,
  };

  if (
    out.down_payment_band &&
    out.home_budget_max != null &&
    (out.down_payment == null || out.down_payment === 0)
  ) {
    out.down_payment = downPaymentDollarsFromBand(
      out.down_payment_band as DownPaymentBandValue,
      out.home_budget_max
    );
  }

  return out;
}

export function stripBuyerFlatKeysFromPayload(payload: Record<string, unknown>): void {
  for (const key of BUYER_FLAT_KEYS) {
    delete payload[key];
  }
}
