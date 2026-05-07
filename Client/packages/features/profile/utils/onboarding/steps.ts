import type { ProfileStep } from "packages/features/profile/types/onboarding";
import { BUYER_PERSONALIZATION_SECTION_IDS } from "packages/features/profile/types/profileStepIds";
import { SECTION_TITLES } from "packages/utils/domain/profile/labels";
import type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

export type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

const ONBOARDING_ROLE_STEP: ProfileStep = {
  id: "onboarding_role",
  title: SECTION_TITLES.ONBOARDING_ROLE,
};

const AGENT_STEPS: ProfileStep[] = [
  { id: "agent_brokerage", title: "Brokerage" },
  { id: "agent_licensing", title: "Licensing" },
  { id: "agent_profile", title: "Territory" },
];

const PRIVACY_DATA_STEP: ProfileStep = { id: "privacy_data", title: "Privacy & data" };

const HOUSING_STEPS: ProfileStep[] = [
  { id: "housing_essentials", title: "Essentials" },
  { id: "housing_ranges", title: "Size" },
];

/** Location (map + schools prefs) then property search prefs (details + physical/condition/utilities). */
const BUYER_LOCATION_AND_SEARCH_STEPS: ProfileStep[] = [
  { id: "location", title: "Location" },
  { id: "search_property", title: "Features" },
];

const ALL_STEPS: ProfileStep[] = [
  { id: "demographics", title: "About" },
  ...HOUSING_STEPS,
  ...BUYER_LOCATION_AND_SEARCH_STEPS,
  { id: "financial", title: "Finance" },
  { id: "availability", title: "Availability" },
];

const PERSONALIZATION_STEPS: ProfileStep[] = [
  { id: "housing_essentials", title: "Essentials" },
  { id: "location", title: "Location" },
  { id: "financial", title: "Finance" },
  { id: "housing_ranges", title: "Size" },
  { id: "search_property", title: "Features" },
  { id: "demographics", title: "About" },
  { id: "availability", title: "Availability" },
];

const BUYER_HOME_SEARCH_PERSONALIZATION_IDS = new Set<string>(BUYER_PERSONALIZATION_SECTION_IDS);

function orderStepsWithAvailabilityLast(steps: ProfileStep[]): ProfileStep[] {
  const availability = steps.find((step) => step.id === "availability");
  const others = steps.filter((step) => step.id !== "availability");
  return [...others, ...(availability ? [availability] : [])];
}

/**
 * Buyer: full flow with availability last when present.
 * Agent: onboarding role picker, demographics then professional (brokerage / licensing / territory) only —
 * no buyer home-search steps.
 */
function getProfileFlowSteps(isAgent: boolean): ProfileStep[] {
  if (isAgent) {
    const demographics = ALL_STEPS.find((s) => s.id === "demographics");
    return [
      ONBOARDING_ROLE_STEP,
      ...(demographics ? [demographics] : []),
      ...AGENT_STEPS,
    ];
  }
  return [ONBOARDING_ROLE_STEP, ...orderStepsWithAvailabilityLast(ALL_STEPS)];
}

function getOnboardingStepsBase(options?: GetOnboardingStepsOptions): ProfileStep[] {
  return getProfileFlowSteps(Boolean(options?.isAgent));
}

export const getOnboardingSteps = (options?: GetOnboardingStepsOptions): ProfileStep[] => {
  const steps = getOnboardingStepsBase(options);
  if (options?.excludeFinancial) {
    return steps.filter((step) => step.id !== "financial");
  }
  return steps;
};

/**
 * Profile / settings: buyers see all preference sections; agents see brokerage, licensing,
 * territory, and About only (no finance / size / features / location / essentials).
 */
export const getPersonalizationSteps = (options?: GetPersonalizationStepsOptions): ProfileStep[] =>
  options?.isAgent
    ? [
        ...AGENT_STEPS,
        ...PERSONALIZATION_STEPS.filter((s) => !BUYER_HOME_SEARCH_PERSONALIZATION_IDS.has(s.id)),
        PRIVACY_DATA_STEP,
      ]
    : [...PERSONALIZATION_STEPS, PRIVACY_DATA_STEP];

/**
 * Onboarding steps for mobile. Excludes financial step.
 * Pass isAgent: true to include agent steps after demographics.
 */
export const getOnboardingStepsMobile = (options?: GetOnboardingStepsOptions): ProfileStep[] => {
  return getOnboardingSteps({
    excludeFinancial: true,
    isAgent: options?.isAgent,
  }).filter((s) => s.id !== "availability");
};
