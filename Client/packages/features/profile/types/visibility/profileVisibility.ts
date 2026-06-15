import type { ProfileStepId } from "packages/features/profile/types/onboarding/profileStepIds";
import { effectiveIsAgentForOptionalBuyerUi } from "packages/features/profile/utils/onboarding/role/agentFormSelection";
import type { PrimaryOnboardingRole } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import {
  getOnboardingSteps,
  getPersonalizationSteps,
} from "packages/features/profile/utils/onboarding/steps/steps";

/** Surfaces that show profile / onboarding section chrome differently by role. */
export type ProfileUiSurface = "personalization" | "onboarding" | "settings_modal";

/** Logical demographics blocks (for docs and optional-buyer UI rules). */
export type DemographicsSubBlockId = "buyer_preferences";

/** Buyer-facing preference fields inside demographics; optional callout when user is an agent. */
export const BUYER_FACING_DEMOGRAPHICS_FIELD_KEYS = [
  "why_joining_silverkey",
  "has_buyers_agent",
  "looking_for_buyers_agent",
] as const;

export type BuyerFacingDemographicsFieldKey = (typeof BUYER_FACING_DEMOGRAPHICS_FIELD_KEYS)[number];

/**
 * When true, agents still see buyer-preference demographics with an “optional for personal search” note.
 */
export function isBuyerFacingDemographicsOptionalForAgent(surface: ProfileUiSurface): boolean {
  return surface === "personalization" || surface === "onboarding" || surface === "settings_modal";
}

/**
 * “Optional for agents…” callouts appear only during onboarding — not in profile/settings.
 */
export function shouldShowAgentOptionalBuyerCallout(options: {
  surface: ProfileUiSurface;
  authIsAgent: boolean;
  formPrimaryRole?: PrimaryOnboardingRole;
}): boolean {
  if (options.surface !== "onboarding") {
    return false;
  }
  return effectiveIsAgentForOptionalBuyerUi({
    authIsAgent: options.authIsAgent,
    formPrimaryRole: options.formPrimaryRole,
  });
}

export type GetStepIdsForSurfaceOptions = {
  /** Mobile onboarding omits financial step. */
  excludeFinancialOnOnboarding?: boolean;
  /** Draft or resolved primary onboarding role (buyer, agent, seller, etc.). */
  primaryRole?: PrimaryOnboardingRole;
};

/**
 * Resolves ordered step ids for a surface; delegates to steps.ts as single source of truth.
 */
export function getStepIdsForSurface(
  surface: ProfileUiSurface,
  isAgent: boolean,
  options?: GetStepIdsForSurfaceOptions
): ProfileStepId[] {
  if (surface === "onboarding") {
    return getOnboardingSteps({
      isAgent,
      primaryRole: options?.primaryRole,
      excludeFinancial: options?.excludeFinancialOnOnboarding ?? false,
    }).map((s) => s.id as ProfileStepId);
  }
  if (surface === "settings_modal") {
    return getPersonalizationSteps(isAgent ? { isAgent: true } : undefined).map(
      (s) => s.id as ProfileStepId
    );
  }
  return getPersonalizationSteps(isAgent ? { isAgent: true } : undefined).map(
    (s) => s.id as ProfileStepId
  );
}
