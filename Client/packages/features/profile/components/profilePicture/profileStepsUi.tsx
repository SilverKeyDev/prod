import React from "react";

import { Icon } from "@ui/icons";

import type { NavItem } from "packages/navigation";
import type { IconName } from "packages/ui/types/icons";

import {
  getOnboardingSteps,
  getPersonalizationSteps,
  type ProfileStep,
} from "@/features/profile/utils";

type StepWithIcon = ProfileStep & {
  icon: React.ComponentType<{ size?: number; className?: string }> | undefined;
};

const iconNameForStepId = (id: string): IconName | undefined => {
  switch (id) {
    case "demographics":
      return "user";
    case "housing":
      return "home";
    case "location":
      return "map-pin";
    case "communication":
      return "message-square";
    case "financial":
      return "building";
    default:
      return undefined;
  }
};

const iconForStepId = (id: string): StepWithIcon["icon"] => {
  const name = iconNameForStepId(id);
  if (!name) return undefined;
  return (props) => <Icon name={name} {...props} />;
};
const withIcons = (steps: ProfileStep[]): StepWithIcon[] =>
  steps.map((step) => ({ ...step, icon: iconForStepId(step.id) }));
export const getOnboardingStepsUi = (): StepWithIcon[] =>
  withIcons(getOnboardingSteps({ excludeFinancial: true }));
export const getPersonalizationStepsUi = (): StepWithIcon[] => withIcons(getPersonalizationSteps());
export const convertStepsToNavItems = (steps: StepWithIcon[]): NavItem[] =>
  steps.map((step) => ({
    key: step.id,
    to: `#${step.id}`,
    label: step.title,
    icon: step.icon,
  }));
export const getPersonalizationNavItems = (): NavItem[] =>
  convertStepsToNavItems(getPersonalizationStepsUi());
