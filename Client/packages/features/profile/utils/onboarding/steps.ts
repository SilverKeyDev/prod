import type { ProfileStep } from "packages/features/profile/types/onboarding";
import type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

import { buildOnboardingFlowFromOptions, buildPersonalizationFlowFromOptions } from "./registry";

export type {
  GetOnboardingStepsOptions,
  GetPersonalizationStepsOptions,
} from "packages/features/profile/types/stepsOptions";

/**
 * Buyer: full onboarding flow (home search + finance).
 * Seller / integration partner: coming soon on role picker (not selectable).
 * Agent: role → demographics → brokerage / licensing / territory.
 */
export const getOnboardingSteps = (options?: GetOnboardingStepsOptions): ProfileStep[] =>
  buildOnboardingFlowFromOptions({
    isAgent: options?.isAgent,
    primaryRole: options?.primaryRole,
    excludeFinancial: options?.excludeFinancial,
    platform: "web",
  });

/**
 * Profile / settings: buyers see all preference sections; agents see brokerage, licensing,
 * territory, and About only (no finance / size / features / location / essentials).
 */
export const getPersonalizationSteps = (options?: GetPersonalizationStepsOptions): ProfileStep[] =>
  buildPersonalizationFlowFromOptions({ isAgent: options?.isAgent });

/**
 * Onboarding steps for mobile. Excludes financial step.
 * Pass isAgent: true to include agent steps after demographics.
 */
export const getOnboardingStepsMobile = (options?: GetOnboardingStepsOptions): ProfileStep[] =>
  buildOnboardingFlowFromOptions({
    isAgent: options?.isAgent,
    primaryRole: options?.primaryRole,
    excludeFinancial: true,
    platform: "mobile",
  });
