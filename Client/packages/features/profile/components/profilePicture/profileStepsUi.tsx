import React from "react";

import { Icon } from "@ui/icons";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  getOnboardingSteps,
  getPersonalizationSteps,
  type GetPersonalizationStepsOptions,
  primaryOnboardingRoleFromForm,
  type ProfileStep,
  type ProfileStepId,
} from "packages/features/profile/utils";
import type { NavItem } from "packages/navigation";
import type { IconName } from "packages/ui/types/icons";

type StepWithIcon = ProfileStep & {
  icon: React.ComponentType<{ size?: number; className?: string }> | undefined;
};

const iconNameForStepId = (id: ProfileStepId): IconName | undefined => {
  switch (id) {
    case "onboarding_role":
      return "users";
    case "demographics":
      return "user";
    case "availability":
      return "calendar";
    case "agent_brokerage":
      return "building-2";
    case "agent_licensing":
      return "file-signature";
    case "agent_profile":
      return "sparkles";
    case "housing_essentials":
      return "home";
    case "housing_ranges":
      return "sliders-horizontal";
    case "location":
      return "map-pin";
    case "search_property":
      return "settings-2";
    case "privacy_data":
      return "shield";
    case "financial":
      return "building";
    case "seller_shell_setup":
      return "home";
    case "renter_shell_setup":
      return "home";
    case "brokerage_shell_setup":
      return "building-2";
    case "integration_partner_shell_setup":
      return "settings-2";
    default:
      return undefined;
  }
};

const iconForStepId = (id: ProfileStepId): StepWithIcon["icon"] => {
  const name = iconNameForStepId(id);
  if (!name) return undefined;
  return (props) => <Icon name={name} {...props} />;
};
const withIcons = (steps: ProfileStep[]): StepWithIcon[] =>
  steps.map((step) => ({ ...step, icon: iconForStepId(step.id) }));

/** Onboarding steps with optional agent step; pass formData to include agent when primary role is agent. */
export const getOnboardingStepsUi = (formData?: OnboardingData): StepWithIcon[] => {
  const primaryRole = formData ? primaryOnboardingRoleFromForm(formData) : undefined;
  const isAgent = primaryRole === "agent";
  const excludeFinancial = primaryRole !== "buyer";
  return withIcons(getOnboardingSteps({ excludeFinancial, isAgent, primaryRole }));
};

/** Personalization steps; pass isAgent true to include Brokerage, Licensing, Profile tabs. */
export const getPersonalizationStepsUi = (isAgent: boolean = false): StepWithIcon[] =>
  withIcons(getPersonalizationSteps(isAgent ? { isAgent: true } : undefined));

export const convertStepsToNavItems = (steps: StepWithIcon[]): NavItem[] =>
  steps.map((step) => ({
    key: step.id,
    to: `#${step.id}`,
    label: step.title,
    icon: step.icon,
  }));

/** Nav items for personalization; pass isAgent to include agent steps. */
export const getPersonalizationNavItems = (options?: GetPersonalizationStepsOptions): NavItem[] =>
  convertStepsToNavItems(getPersonalizationStepsUi(Boolean(options?.isAgent)));
