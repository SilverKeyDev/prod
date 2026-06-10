import type { PrimaryOnboardingRole } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";

/** Primary role for onboarding flow resolution. */
export type OnboardingFlowPrimaryRole = PrimaryOnboardingRole;

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
  | "seller_onboarding"
  | "renter_onboarding"
  | "brokerage_onboarding"
  | "integration_partner_onboarding"
  | "buyer_personalization"
  | "agent_personalization";
