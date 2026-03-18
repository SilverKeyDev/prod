/**
 * Home price / affordability slice for onboarding. Extracted to keep useOnboardingForm under max-lines-per-function.
 */

import { useCallback, useEffect, useState } from "react";

import type { OnboardingData } from "packages/features/profile/utils"; /* eslint-disable-line silverkey/no-cross-feature-internals -- Onboarding form data matches profile preference shape. */
import {
  calculateAffordableHomePrice,
  type HomePriceResult,
} from "packages/utils/affordability";

type OnboardingStep = { id: string };

export function useOnboardingAffordability(
  formData: OnboardingData,
  currentStep: number,
  steps: OnboardingStep[]
) {
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [homePriceResult, setHomePriceResult] = useState<HomePriceResult | null>(null);
  const [isAffordabilityCollapsed, setIsAffordabilityCollapsed] = useState(false);

  const calculateHomePrice = useCallback(() => {
    if (!formData.gross_income || !formData.ideal_zip_code) return;
    try {
      setHomePriceLoading(true);
      setHomePriceError(null);
      const result = calculateAffordableHomePrice(formData);
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
      ) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result as HomePriceResult);
      }
    } catch (error: unknown) {
      setHomePriceError(error instanceof Error ? error.message : "Failed to calculate home price");
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.id !== "financial") return;
    if (
      formData.gross_income &&
      formData.ideal_zip_code &&
      formData.credit_score_range &&
      formData.down_payment
    ) {
      void calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.ideal_zip_code,
    formData.credit_score_range,
    formData.down_payment,
    currentStep,
    steps,
    calculateHomePrice,
  ]);

  return {
    homePriceLoading,
    homePriceError,
    homePriceResult,
    isAffordabilityCollapsed,
    setIsAffordabilityCollapsed,
  };
}
