import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { isSelectableOnboardingRolePickerValue } from "packages/utils/product/domain/profile/onboardingRolePicker";

import { isAgentFormSelection } from "./agentFormSelection";
import type { PrimaryOnboardingRole } from "./onboardingRoleTypes";

export type { PrimaryOnboardingRole } from "./onboardingRoleTypes";

/** Canonical WHY_JOIN tags when role is buyer / seller (legacy investor tag still read). */
export const WHY_JOIN_FOR_ROLE = {
  buyer: "buying_house",
  seller: "selling_house",
  renter: "renting_house",
  investor: "investor",
} as const;

export function isSelectableOnboardingRole(role: PrimaryOnboardingRole): boolean {
  return isSelectableOnboardingRolePickerValue(role);
}

/** True when onboarding should use buyer About Me / Financing UI (not agent or shell roles). */
export function isBuyerOnboardingRole(
  formData: OnboardingData,
  options?: { roles?: readonly string[] }
): boolean {
  const role = primaryOnboardingRoleFromForm(formData, options);
  if (role === "buyer") return true;
  if (
    role === "agent" ||
    role === "seller" ||
    role === "renter" ||
    role === "brokerage" ||
    role === "integration_partner"
  ) {
    return false;
  }
  if (options?.roles?.includes("agent")) return false;
  const w = formData.why_joining_silverkey;
  if (
    Array.isArray(w) &&
    w.includes(WHY_JOIN_FOR_ROLE.buyer) &&
    !w.includes(WHY_JOIN_FOR_ROLE.seller)
  ) {
    return true;
  }
  return formData.primary_onboarding_role === "buyer";
}

/**
 * First-screen onboarding role: sets draft `primary_onboarding_role` and
 * `why_joining_silverkey` for demographics / server role sync.
 */
export function applyOnboardingRoleSelection(
  role: PrimaryOnboardingRole,
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void
): void {
  if (!isSelectableOnboardingRole(role)) {
    return;
  }

  updateFormData("primary_onboarding_role", role);

  switch (role) {
    case "agent":
      updateFormData("why_joining_silverkey", []);
      break;
    case "buyer":
      updateFormData("why_joining_silverkey", [WHY_JOIN_FOR_ROLE.buyer]);
      break;
    case "seller":
      updateFormData("why_joining_silverkey", [WHY_JOIN_FOR_ROLE.buyer, WHY_JOIN_FOR_ROLE.seller]);
      break;
    case "renter":
      updateFormData("why_joining_silverkey", [WHY_JOIN_FOR_ROLE.renter]);
      break;
    case "brokerage":
      updateFormData("why_joining_silverkey", []);
      break;
    case "integration_partner":
      updateFormData("why_joining_silverkey", []);
      break;
  }
}

/** UI selection state from draft and/or synced preferences / auth roles. */
export function primaryOnboardingRoleFromForm(
  formData: OnboardingData,
  options?: { roles?: readonly string[] }
): PrimaryOnboardingRole | undefined {
  const fromDraft = formData.primary_onboarding_role;
  if (fromDraft === "investor") {
    return "buyer";
  }
  if (
    fromDraft === "buyer" ||
    fromDraft === "seller" ||
    fromDraft === "renter" ||
    fromDraft === "agent" ||
    fromDraft === "brokerage" ||
    fromDraft === "integration_partner"
  ) {
    return fromDraft;
  }
  if (options?.roles?.includes("agent")) {
    return "agent";
  }
  const w = formData.why_joining_silverkey;
  if (!Array.isArray(w)) return undefined;
  if (w.includes(WHY_JOIN_FOR_ROLE.seller)) return "seller";
  if (w.includes(WHY_JOIN_FOR_ROLE.renter)) return "renter";
  if (w.includes(WHY_JOIN_FOR_ROLE.buyer)) return "buyer";
  if (w.includes(WHY_JOIN_FOR_ROLE.investor)) return "buyer";
  return undefined;
}

/** Buyer SIL-182 UI (About Me / Financing) — not agent shell or agent-with-buyer-prefs path. */
export function shouldShowBuyerOnboardingUi(
  formData: OnboardingData,
  options?: { roles?: readonly string[] }
): boolean {
  return (
    isBuyerOnboardingRole(formData, options) &&
    !isAgentFormSelection(primaryOnboardingRoleFromForm(formData, options))
  );
}
