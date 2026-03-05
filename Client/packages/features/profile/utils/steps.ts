import type { ProfileStep } from "./types";

const ALL_STEPS: ProfileStep[] = [
  { id: "demographics", title: "About You" },
  { id: "housing", title: "Housing" },
  { id: "location", title: "Location" },
  { id: "communication", title: "Communication" },
  { id: "financial", title: "Finances" },
];

export type GetOnboardingStepsOptions = {
  /** When "mobile", financial step is excluded. Default "web" includes all steps. */
  platform?: "web" | "mobile";
};

function getOnboardingStepsBase(): ProfileStep[] {
  const filtered = ALL_STEPS.filter((step) => step.id !== "communication");
  const financial = filtered.find((step) => step.id === "financial");
  const others = filtered.filter((step) => step.id !== "financial");
  return [...others, ...(financial ? [financial] : [])];
}

export const getOnboardingSteps = (options?: GetOnboardingStepsOptions): ProfileStep[] => {
  const steps = getOnboardingStepsBase();
  if (options?.platform === "mobile") {
    return steps.filter((step) => step.id !== "financial");
  }
  return steps;
};

export const getPersonalizationSteps = (): ProfileStep[] => {
  const others = ALL_STEPS.filter((step) => step.id !== "communication");
  const demographics = others.find((step) => step.id === "demographics");
  const financial = others.find((step) => step.id === "financial");
  const middle = others.filter((step) => step.id !== "demographics" && step.id !== "financial");
  return [...(demographics ? [demographics] : []), ...middle, ...(financial ? [financial] : [])];
};

/**
 * Onboarding steps for mobile. Currently matches web (demographics, housing, location, financial).
 * To exclude the financial step on mobile, return getOnboardingSteps({ platform: "mobile" })
 * and align REQUIRED_FIELDS_ONBOARDING_MOBILE in constants.ts (see documentation/client/mobile-parity/DISPARITY_AUDIT_REMEDIATION.md).
 */
export const getOnboardingStepsMobile = (): ProfileStep[] => {
  return getOnboardingSteps();
};
