import React from "react";

import { Icon } from "@ui/icons";

import type { NavItem } from "packages/navigation";
import type { IconName } from "packages/ui/types/icons";

import type { OnboardingData } from "@/features/profile/types/onboarding";
import {
  getOnboardingSteps,
  getPersonalizationSteps,
  type GetPersonalizationStepsOptions,
  type ProfileStep,
  type ProfileStepId,
} from "@/features/profile/utils";

type StepWithIcon = ProfileStep & {
  icon: React.ComponentType<{ size?: number; className?: string }> | undefined;
};

const iconNameForStepId = (id: ProfileStepId): IconName | undefined => {
  switch (id) {
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

/** Onboarding steps with optional agent step; pass formData to include agent when is_agent is yes/am_agent. */
export const getOnboardingStepsUi = (formData?: OnboardingData): StepWithIcon[] => {
  const isAgent = formData?.is_agent === "yes" || formData?.is_agent === "am_agent";
  return withIcons(getOnboardingSteps({ excludeFinancial: true, isAgent }));
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
