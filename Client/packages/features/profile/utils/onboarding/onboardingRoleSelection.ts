import type { OnboardingData } from "packages/features/profile/types/onboarding";

/** Values accepted by onboarding role picker; maps to `is_agent` and `why_joining_silverkey`. */
export type PrimaryOnboardingRole = "buyer" | "seller" | "investor" | "agent";

/** Canonical WHY_JOIN tags when role is buyer / seller / investor. */
export const WHY_JOIN_FOR_ROLE: Record<Exclude<PrimaryOnboardingRole, "agent">, string> = {
  buyer: "buying_house",
  seller: "selling_house",
  investor: "investor",
};

/**
 * First-screen onboarding role: sets draft `primary_onboarding_role`,
 * `is_agent`, and `why_joining_silverkey` for demographics sync.
 */
export function applyOnboardingRoleSelection(
  role: PrimaryOnboardingRole,
  updateFormData: (field: keyof OnboardingData | string, value: unknown) => void
): void {
  updateFormData("primary_onboarding_role", role);

  switch (role) {
    case "agent":
      updateFormData("is_agent", "yes");
      updateFormData("why_joining_silverkey", []);
      break;
    case "buyer":
      updateFormData("is_agent", "no");
      updateFormData("why_joining_silverkey", [WHY_JOIN_FOR_ROLE.buyer]);
      break;
    case "seller":
      updateFormData("is_agent", "no");
      updateFormData("why_joining_silverkey", [
        WHY_JOIN_FOR_ROLE.buyer,
        WHY_JOIN_FOR_ROLE.seller,
      ]);
      break;
    case "investor":
      updateFormData("is_agent", "no");
      updateFormData("why_joining_silverkey", [WHY_JOIN_FOR_ROLE.investor]);
      break;
  }
}

/** UI selection state from draft and/or synced preferences. */
export function primaryOnboardingRoleFromForm(
  formData: OnboardingData
): PrimaryOnboardingRole | undefined {
  const fromDraft = formData.primary_onboarding_role;
  if (
    fromDraft === "buyer" ||
    fromDraft === "seller" ||
    fromDraft === "investor" ||
    fromDraft === "agent"
  ) {
    return fromDraft;
  }
  const ia = formData.is_agent?.toLowerCase();
  const isAgent = ia === "yes" || ia === "am_agent" || ia === "true" || ia === "1";
  if (isAgent) return "agent";
  const w = formData.why_joining_silverkey;
  if (!Array.isArray(w)) return undefined;
  // Seller defaults include both buying_house and selling_house; prefer seller when both exist.
  if (w.includes(WHY_JOIN_FOR_ROLE.seller)) return "seller";
  if (w.includes(WHY_JOIN_FOR_ROLE.buyer)) return "buyer";
  if (w.includes(WHY_JOIN_FOR_ROLE.investor)) return "investor";
  return undefined;
}
