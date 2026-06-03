import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type {
  ProfileSectionCompletionMap,
  ProfileSectionCompletionStatus,
  ProfileSectionId,
} from "packages/features/profile/types/sections/profileSections";
import { parseHousingTypes } from "packages/features/profile/utils/public/constants";

import { isAgentFormSelection } from "@/features/profile/utils/onboarding/role/agentFormSelection";
import { primaryOnboardingRoleFromForm } from "@/features/profile/utils/onboarding/role/onboardingRoleSelection";

function preferenceExtensionSectionHasAny(section: unknown): boolean {
  if (section == null || typeof section !== "object" || Array.isArray(section)) return false;
  return Object.values(section as Record<string, unknown>).some((v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return true;
    if (typeof v === "boolean") return v === true;
    if (Array.isArray(v)) return v.length > 0;
    return false;
  });
}

function statusFor(hasAny: boolean, isComplete: boolean): ProfileSectionCompletionStatus {
  if (!hasAny) return "empty";
  if (isComplete) return "complete";
  return "needs_attention";
}

function demographicsPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const name = (formData.name ?? "").toString().trim();
  const hasAny =
    name.length > 0 ||
    primaryOnboardingRoleFromForm(formData) != null ||
    formData.age != null ||
    (formData.marital_status ?? "").toString().trim().length > 0;
  const ageOk = formData.age != null && formData.age > 0;
  return { any: hasAny, complete: name.length > 0 && ageOk };
}

function housingEssentialsPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const housingTypes = parseHousingTypes(formData.preferred_housing_type);
  const hasListingType =
    Array.isArray(formData.listing_type) && formData.listing_type.some((x) => String(x).trim());
  const hasMustHave =
    Array.isArray(formData.must_have) && formData.must_have.some((x) => String(x).trim());
  const hasAny =
    formData.preferred_bedrooms_min != null ||
    formData.preferred_bathrooms_min != null ||
    housingTypes.length > 0 ||
    hasListingType ||
    hasMustHave;
  const complete =
    formData.preferred_bedrooms_min != null &&
    formData.preferred_bathrooms_min != null &&
    housingTypes.length > 0;
  return { any: hasAny, complete };
}

function housingRangesPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    formData.preferred_sqft_min != null ||
    formData.preferred_sqft_max != null ||
    formData.preferred_lot_size_min != null ||
    formData.preferred_lot_size_max != null ||
    formData.preferred_home_age_min != null ||
    formData.preferred_home_age_max != null ||
    formData.days_on_market_min != null ||
    formData.days_on_market_max != null;
  return { any: hasAny, complete: hasAny };
}

function housingDetailsPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    (Array.isArray(formData.other_requirements) && formData.other_requirements.length > 0) ||
    (typeof formData.preferred_architectural_style === "string" &&
      formData.preferred_architectural_style.trim().length > 0) ||
    (typeof formData.walkability_importance === "string" &&
      formData.walkability_importance.trim().length > 0) ||
    (typeof formData.intended_property_use === "string" &&
      formData.intended_property_use.trim().length > 0) ||
    (typeof formData.renovation_preference === "string" &&
      formData.renovation_preference.trim().length > 0);
  return { any: hasAny, complete: hasAny };
}

function locationPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    Array.isArray(formData.important_locations) &&
    formData.important_locations.some((loc) => (loc?.address ?? "").toString().trim().length > 0);
  return { any: hasAny, complete: hasAny };
}

function financialPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const idealZip =
    typeof formData.ideal_zip_code === "string" ? formData.ideal_zip_code.trim() : "";
  const payingCash = formData.paying_cash === true;
  const hasAny =
    payingCash ||
    formData.gross_income != null ||
    formData.down_payment != null ||
    idealZip.length > 0 ||
    formData.credit_score_range != null;
  const complete =
    payingCash ||
    (formData.gross_income != null && formData.down_payment != null && idealZip.length > 0);
  return { any: hasAny, complete };
}

function nonEmptyStr(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function tagArrayAny(v: unknown): boolean {
  return Array.isArray(v) && v.some((x) => typeof x === "string" && x.trim().length > 0);
}

function agentBrokeragePair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (nonEmptyStr(formData.agent_brokerage_name) ||
      nonEmptyStr(formData.agent_brokerage_bic_name) ||
      nonEmptyStr(formData.agent_brokerage_address) ||
      nonEmptyStr(formData.agent_brokerage_email) ||
      nonEmptyStr(formData.agent_brokerage_phone) ||
      nonEmptyStr(formData.agent_physical_mailing_address));
  return { any: hasAny, complete: isAgent && nonEmptyStr(formData.agent_brokerage_name) };
}

function agentLicensingPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (tagArrayAny(formData.agent_licensed_states) ||
      tagArrayAny(formData.agent_license_numbers) ||
      tagArrayAny(formData.agent_license_types) ||
      tagArrayAny(formData.agent_license_expiration_dates));
  return { any: hasAny, complete: isAgent && tagArrayAny(formData.agent_license_numbers) };
}

function agentProfilePair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  const hasAny =
    isAgent &&
    (nonEmptyStr(formData.agent_bio) ||
      tagArrayAny(formData.agent_primary_service_zips) ||
      tagArrayAny(formData.agent_specialties));
  return { any: hasAny, complete: hasAny };
}

function availabilityPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const isAgent = isAgentFormSelection(primaryOnboardingRoleFromForm(formData));
  if (!isAgent) {
    return { any: false, complete: true };
  }
  const extRec = formData.buyerPreferenceExtensions as Record<string, unknown> | undefined;
  const hasAny = preferenceExtensionSectionHasAny(extRec?.availability);
  return { any: hasAny, complete: hasAny };
}

function searchExtensionPairs(formData: OnboardingData): {
  financing: { any: boolean; complete: boolean };
  locationSchools: { any: boolean; complete: boolean };
  property: { any: boolean; complete: boolean };
  neighborhood: { any: boolean; complete: boolean };
} {
  const extRec = formData.buyerPreferenceExtensions as Record<string, unknown> | undefined;
  const financingAny =
    preferenceExtensionSectionHasAny(extRec?.price_financing) ||
    formData.home_budget_min != null ||
    formData.home_budget_max != null;
  const locationSchoolsAny = preferenceExtensionSectionHasAny(extRec?.location_prefs);
  const propertyAny =
    preferenceExtensionSectionHasAny(extRec?.physical) ||
    preferenceExtensionSectionHasAny(extRec?.condition) ||
    preferenceExtensionSectionHasAny(extRec?.utilities) ||
    (typeof formData.listing_status === "string" && formData.listing_status.trim().length > 0);
  const neighborhoodAny = preferenceExtensionSectionHasAny(extRec?.neighborhood);

  const same = (b: boolean) => ({ any: b, complete: b });
  return {
    financing: same(financingAny),
    locationSchools: same(locationSchoolsAny),
    property: same(propertyAny),
    neighborhood: same(neighborhoodAny),
  };
}

function mergedComplete(parts: ReadonlyArray<{ any: boolean; complete: boolean }>): {
  any: boolean;
  complete: boolean;
} {
  const hasAny = parts.some((p) => p.any);
  const complete =
    hasAny &&
    parts.every((p) => {
      if (!p.any) return true;
      return p.complete;
    });
  return { any: hasAny, complete };
}

export const getProfileSectionCompletion = (
  formData: OnboardingData
): ProfileSectionCompletionMap => {
  const demo = demographicsPair(formData);
  const he = housingEssentialsPair(formData);
  const hr = housingRangesPair(formData);
  const hd = housingDetailsPair(formData);
  const loc = locationPair(formData);
  const fin = financialPair(formData);
  const search = searchExtensionPairs(formData);
  const br = agentBrokeragePair(formData);
  const lic = agentLicensingPair(formData);
  const prof = agentProfilePair(formData);
  const av = availabilityPair(formData);

  const locationMerged = mergedComplete([loc, search.locationSchools, search.neighborhood]);
  const financialMerged = mergedComplete([fin, search.financing]);
  const propertyMerged = mergedComplete([hd, search.property]);

  return {
    demographics: statusFor(demo.any, demo.complete),
    housing_essentials: statusFor(he.any, he.complete),
    housing_ranges: statusFor(hr.any, hr.complete),
    location: statusFor(locationMerged.any, locationMerged.complete),
    search_property: statusFor(propertyMerged.any, propertyMerged.complete),
    financial: statusFor(financialMerged.any, financialMerged.complete),
    agent_brokerage: statusFor(br.any, br.complete),
    agent_licensing: statusFor(lic.any, lic.complete),
    agent_profile: statusFor(prof.any, prof.complete),
    availability: statusFor(av.any, av.complete),
    // Informational / legal tools — not a preferences form; keep neutral in tab affordances.
    privacy_data: "empty",
  };
};

/**
 * Map validation / missing-field messages to the best-matching profile settings section.
 * Order matters: first matching rule wins.
 */
function resolveMissingProfileSectionId(missingField: string): ProfileSectionId | undefined {
  const m = missingField;
  const l = missingField.toLowerCase();

  const rules: ReadonlyArray<{ match: () => boolean; id: ProfileSectionId }> = [
    {
      match: () =>
        m.includes("Age") || m.includes("Gender") || m.includes("Occupation") || m.includes("Pet"),
      id: "demographics",
    },
    {
      match: () =>
        m.includes("income") ||
        m.includes("budget") ||
        m.includes("credit") ||
        m.includes("payment"),
      id: "financial",
    },
    {
      match: () =>
        m.includes("bedroom") ||
        m.includes("bathroom") ||
        l.includes("listing type") ||
        l.includes("must-have") ||
        l.includes("must have") ||
        l.includes("housing type") ||
        l.includes("home type"),
      id: "housing_essentials",
    },
    {
      match: () =>
        l.includes("square feet") ||
        l.includes("sqft") ||
        m.includes("lot") ||
        l.includes("days on market") ||
        l.includes("home age"),
      id: "housing_ranges",
    },
    {
      match: () =>
        m.includes("renovation") ||
        l.includes("architectural") ||
        l.includes("intended property") ||
        l.includes("walkability") ||
        l.includes("other requirements"),
      id: "search_property",
    },
    {
      match: () => m.includes("housing") || m.includes("home"),
      id: "housing_essentials",
    },
    {
      match: () => m.includes("property"),
      id: "search_property",
    },
    {
      match: () =>
        m.includes("location") && !l.includes("school") && !l.includes("neighborhood tag"),
      id: "location",
    },
    {
      match: () => l.includes("hoa"),
      id: "financial",
    },
    {
      match: () =>
        l.includes("school district") ||
        l.includes("flood importance") ||
        l.includes("noise importance") ||
        l.includes("neighborhood tag") ||
        l.includes("walk score") ||
        l.includes("crime importance") ||
        l.includes("transit importance") ||
        l.includes("pet friendly area"),
      id: "location",
    },
    {
      match: () =>
        l.includes("listing status") ||
        l.includes("garage") ||
        l.includes("stories") ||
        l.includes("parking type") ||
        l.includes("accessibility") ||
        l.includes("outdoor space") ||
        l.includes("fireplace") ||
        l.includes("view importance") ||
        l.includes("foreclosure") ||
        l.includes("virtual tour") ||
        l.includes("open house") ||
        l.includes("hvac") ||
        l.includes("utilities included") ||
        l.includes("solar") ||
        l.includes("ev charger"),
      id: "search_property",
    },
    {
      match: () => l.includes("real estate agent"),
      id: "demographics",
    },
    {
      match: () =>
        l.includes("brokerage") ||
        l.includes("physical mailing") ||
        (l.includes("bic") && l.includes("brokerage")),
      id: "agent_brokerage",
    },
    {
      match: () =>
        l.includes("licensed state") ||
        l.includes("license number") ||
        l.includes("license type") ||
        l.includes("license expiration"),
      id: "agent_licensing",
    },
    {
      match: () => l.includes("bio") || l.includes("specialt") || l.includes("primary service"),
      id: "agent_profile",
    },
    {
      match: () =>
        l.includes("communication") ||
        l.includes("information detail") ||
        l.includes("buyer") ||
        l.includes("looking for"),
      id: "demographics",
    },
  ];

  for (const { match, id } of rules) {
    if (match()) return id;
  }
  return undefined;
}

/** Navigate to section based on missing field type */
export const navigateToMissingFieldSection = (
  missingField: string,
  setActiveSection: (section: string) => void
): void => {
  const id = resolveMissingProfileSectionId(missingField);
  if (id) setActiveSection(id);
};
