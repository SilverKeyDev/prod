/**
 * Home price / affordability slice for onboarding. Extracted to keep useOnboardingForm under max-lines-per-function.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { OnboardingData } from "packages/features/profile";
import { resolveIdealZipCode } from "packages/utils/product/domain/profile/resolveIdealZipCode";
import {
  calculateAffordableHomePrice,
  type HomePriceResult,
} from "packages/utils/transaction/affordability";

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

  const resolvedZip = useMemo(
    () =>
      resolveIdealZipCode({
        ideal_zip_code: formData.ideal_zip_code,
        important_locations: formData.important_locations,
      }),
    [formData.ideal_zip_code, formData.important_locations]
  );

  const calculateHomePrice = useCallback(() => {
    if (formData.paying_cash) return;
    const zip = resolvedZip;
    if (!formData.gross_income || !zip) return;
    try {
      setHomePriceLoading(true);
      setHomePriceError(null);
      const result = calculateAffordableHomePrice({
        gross_income: formData.gross_income,
        ideal_zip_code: zip,
        credit_score_range: formData.credit_score_range,
        down_payment: formData.down_payment,
      });
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
  }, [
    formData.paying_cash,
    formData.gross_income,
    formData.credit_score_range,
    formData.down_payment,
    resolvedZip,
  ]);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.id !== "financial") return;
    if (formData.paying_cash) return;
    if (
      formData.gross_income &&
      resolvedZip &&
      formData.credit_score_range &&
      formData.down_payment
    ) {
      void calculateHomePrice();
    }
  }, [
    formData.paying_cash,
    formData.gross_income,
    formData.credit_score_range,
    formData.down_payment,
    resolvedZip,
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
    resolvedZipCode: resolvedZip,
  };
}
