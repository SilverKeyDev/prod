import { Building, Home, MapPin, MessageSquare, User } from "lucide-react";

import type { NavItem } from "packages/navigation";

import {
  getOnboardingSteps,
  getPersonalizationSteps,
  type ProfileStep,
} from "@/features/profile/utils";
type StepWithIcon = ProfileStep & {
  icon: unknown;
};
const iconForStepId = (id: string) => {
  switch (id) {
    case "demographics":
      return User;
    case "housing":
      return Home;
    case "location":
      return MapPin;
    case "communication":
      return MessageSquare;
    case "financial":
      return Building;
    default:
      return undefined;
  }
};
const withIcons = (steps: ProfileStep[]): StepWithIcon[] =>
  steps.map((step) => ({ ...step, icon: iconForStepId(step.id) }));
export const getOnboardingStepsUi = (): StepWithIcon[] => withIcons(getOnboardingSteps());
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
