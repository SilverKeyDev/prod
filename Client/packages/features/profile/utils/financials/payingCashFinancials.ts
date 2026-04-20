import type { OnboardingData } from "packages/features/profile/types/onboarding";

export type PayingCashFieldUpdater = (field: keyof OnboardingData, value: unknown) => void;

/** Toggle paying cash; when enabling, clear financing fields hidden below budget. */
export function setPayingCash(nextPayingCash: boolean, update: PayingCashFieldUpdater): void {
  update("paying_cash", nextPayingCash);
  if (!nextPayingCash) return;
  update("gross_income", undefined);
  update("down_payment", undefined);
  update("credit_score_range", undefined);
  update("ideal_zip_code", undefined);
}
