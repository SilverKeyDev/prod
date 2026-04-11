import type { ProfileStep } from "packages/features/profile/types/onboarding";
import type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

export type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

const AGENT_STEPS: ProfileStep[] = [
  { id: "agent_brokerage", title: "Brokerage" },
  { id: "agent_licensing", title: "Licensing" },
  { id: "agent_profile", title: "Territory" },
];

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
];

const PERSONALIZATION_STEPS: ProfileStep[] = [
  { id: "housing_essentials", title: "Essentials" },
  { id: "location", title: "Location" },
  { id: "financial", title: "Finance" },
  { id: "housing_ranges", title: "Size" },
  { id: "search_property", title: "Features" },
  { id: "demographics", title: "About" },
];

function orderStepsWithFinancialLast(steps: ProfileStep[]): ProfileStep[] {
  const financial = steps.find((step) => step.id === "financial");
  const others = steps.filter((step) => step.id !== "financial");
  return [...others, ...(financial ? [financial] : [])];
}

/**
 * Buyer steps, or demographics + agent steps + buyer preference steps when `isAgent`.
 * Financial is always last when present.
 */
function getProfileFlowSteps(isAgent: boolean): ProfileStep[] {
  if (isAgent) {
    const demographics = ALL_STEPS.find((s) => s.id === "demographics");
    const financial = ALL_STEPS.find((s) => s.id === "financial");
    return [
      ...(demographics ? [demographics] : []),
      ...AGENT_STEPS,
      ...HOUSING_STEPS,
      ...BUYER_LOCATION_AND_SEARCH_STEPS,
      ...(financial ? [financial] : []),
    ];
  }
  return orderStepsWithFinancialLast(ALL_STEPS);
}

function getOnboardingStepsBase(
  options?: GetOnboardingStepsOptions,
): ProfileStep[] {
  return getProfileFlowSteps(Boolean(options?.isAgent));
}

export const getOnboardingSteps = (
  options?: GetOnboardingStepsOptions,
): ProfileStep[] => {
  const steps = getOnboardingStepsBase(options);
  if (options?.excludeFinancial) {
    return steps.filter((step) => step.id !== "financial");
  }
  return steps;
};

/**
 * Profile / settings: same buyer sections for everyone; agents also see brokerage,
 * licensing, and profile tabs after About You (optional-buyer sections use in-flow disclaimers).
 */
export const getPersonalizationSteps = (
  options?: GetPersonalizationStepsOptions,
): ProfileStep[] =>
  options?.isAgent
    ? [...AGENT_STEPS, ...PERSONALIZATION_STEPS]
    : [...PERSONALIZATION_STEPS];

/**
 * Onboarding steps for mobile. Excludes financial step.
 * Pass isAgent: true to include agent steps after demographics.
 */
export const getOnboardingStepsMobile = (
  options?: GetOnboardingStepsOptions,
): ProfileStep[] => {
  return getOnboardingSteps({
    excludeFinancial: true,
    isAgent: options?.isAgent,
  });
};
