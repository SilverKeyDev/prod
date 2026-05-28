import type { PrimaryOnboardingRole } from "packages/features/profile/utils/onboarding/onboardingRoleSelection";

/** Primary role for flow resolution; includes future brokerage signup (no public picker yet). */
export type OnboardingFlowPrimaryRole = PrimaryOnboardingRole | "brokerage";

export type ProfileFlowSurface = "onboarding" | "personalization";

export type ProfileFlowPlatform = "web" | "mobile";

export type ProfileFlowContext = {
  surface: ProfileFlowSurface;
  platform?: ProfileFlowPlatform;
  isAgent?: boolean;
  primaryRole?: OnboardingFlowPrimaryRole;
  excludeFinancial?: boolean;
};

export type FlowTemplateId =
  | "buyer_onboarding"
  | "agent_onboarding"
  | "minimal_onboarding"
  | "brokerage_onboarding"
  | "buyer_personalization"
  | "agent_personalization";
