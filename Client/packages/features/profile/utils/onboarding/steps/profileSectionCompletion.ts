import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type {
  ProfileSectionCompletionMap,
  ProfileSectionId,
} from "packages/features/profile/types/sections/profileSections";

import {
  agentBrokeragePair,
  agentLicensingPair,
  agentProfilePair,
  availabilityPair,
} from "./completion/agent";
import { demographicsPair } from "./completion/demographics";
import { housingDetailsPair, housingEssentialsPair, housingRangesPair } from "./completion/housing";
import { financialPair, locationPair, searchExtensionPairs } from "./completion/search";
import { mergedComplete, statusFor } from "./completion/shared";

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
    privacy_data: "empty",
  };
};

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
