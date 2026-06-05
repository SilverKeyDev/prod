import type { DropdownOption } from "packages/features/profile/types/onboarding/onboarding";

import { FIELD_LABELS } from "./labels";

/** Roles shown on the first onboarding screen. */
export type OnboardingRolePickerValue =
  | "buyer"
  | "seller"
  | "agent"
  | "brokerage"
  | "integration_partner";

export type OnboardingRolePickerOption = DropdownOption & {
  value: OnboardingRolePickerValue;
  enabled: boolean;
};

export const ONBOARDING_ROLE_COMING_SOON_LABEL = "Coming soon";

export const ONBOARDING_ROLE_PICKER_OPTIONS: OnboardingRolePickerOption[] = [
  { value: "buyer", label: FIELD_LABELS.ONBOARDING_ROLE_BUYER, enabled: true },
  { value: "seller", label: FIELD_LABELS.ONBOARDING_ROLE_SELLER, enabled: true },
  { value: "agent", label: FIELD_LABELS.ONBOARDING_ROLE_AGENT, enabled: true },
  { value: "brokerage", label: FIELD_LABELS.ONBOARDING_ROLE_BROKERAGE, enabled: true },
  {
    value: "integration_partner",
    label: FIELD_LABELS.ONBOARDING_ROLE_INTEGRATION_PARTNER,
    enabled: true,
  },
];

const SELECTABLE = new Set<OnboardingRolePickerValue>(
  ONBOARDING_ROLE_PICKER_OPTIONS.filter((o) => o.enabled).map((o) => o.value)
);

export function isSelectableOnboardingRolePickerValue(value: OnboardingRolePickerValue): boolean {
  return SELECTABLE.has(value);
}
