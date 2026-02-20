import { useCallback, useEffect, useState } from "react";

import {
  calculateAffordableHomePrice,
  type HomePriceResult,
  type OnboardingData,
} from "packages/utils/domain/profile";

type UseHomePriceCalculationProps = {
  formData: OnboardingData;
  activeSection: string;
};

export function useHomePriceCalculation({
  formData,
  activeSection,
}: UseHomePriceCalculationProps) {
  const [homePriceResult, setHomePriceResult] =
    useState<HomePriceResult | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);

  const calculateHomePrice = useCallback(() => {
    if (!formData.gross_income || !formData.ideal_zip_code) {
      return;
    }

    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = calculateAffordableHomePrice(formData);

      if ("error" in result) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
      } else {
        setHomePriceResult(result);
      }
    } catch (error: unknown) {
      setHomePriceError(
        error instanceof Error
          ? error.message
          : "Failed to calculate home price",
      );
      setHomePriceResult(null);
    } finally {
      setHomePriceLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    if (activeSection !== "financial") return;

    if (formData.gross_income && formData.ideal_zip_code) {
      void calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.credit_score_range,
    formData.ideal_zip_code,
    formData.down_payment,
    activeSection,
    calculateHomePrice,
  ]);

  return {
    homePriceResult,
    homePriceLoading,
    homePriceError,
  };
}
