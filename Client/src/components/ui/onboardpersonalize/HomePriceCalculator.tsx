import React, { useState, useEffect } from "react";
import { OnboardingData } from "../../../lib/onboard/types";
import { calculateAffordableHomePrice, HomePriceResult } from "../../../lib/onboard/homePriceCalculation";
import KeyTurnLoader from "../base/KeyTurnLoader";

interface HomePriceCalculatorProps {
  formData: OnboardingData;
  isVisible: boolean;
  onResultChange?: (result: HomePriceResult | null) => void;
}

const HomePriceCalculator: React.FC<HomePriceCalculatorProps> = ({
  formData,
  isVisible,
  onResultChange
}) => {
  const [homePriceResult, setHomePriceResult] = useState<HomePriceResult | null>(null);
  const [homePriceError, setHomePriceError] = useState<string | null>(null);
  const [homePriceLoading, setHomePriceLoading] = useState(false);

  // Calculate home price when relevant data changes
  useEffect(() => {
    if (!isVisible) return;

    // Only calculate if we have the minimum required data
    if (formData.gross_income && formData.ideal_zip_code) {
      calculateHomePrice();
    }
  }, [
    formData.gross_income,
    formData.credit_score_range,
    formData.ideal_zip_code,
    formData.down_payment,
    isVisible,
  ]);

  const calculateHomePrice = async () => {
    try {
      setHomePriceLoading(true);
      setHomePriceError(null);

      const result = await calculateAffordableHomePrice(formData);

      if ("error" in result) {
        setHomePriceError(result.error);
        setHomePriceResult(null);
        onResultChange?.(null);
      } else {
        setHomePriceResult(result);
        setHomePriceError(null);
        onResultChange?.(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to calculate home price";
      setHomePriceError(errorMessage);
      setHomePriceResult(null);
      onResultChange?.(null);
    } finally {
      setHomePriceLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">
        💡 Affordable Home Price Estimate
      </h3>
      
      {homePriceLoading && (
        <div className="flex items-center space-x-2">
          <KeyTurnLoader message="Calculating your affordable home price..." />
        </div>
      )}

      {homePriceError && (
        <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">
          <strong>Error:</strong> {homePriceError}
        </div>
      )}

      {homePriceResult && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded border border-blue-300">
            <div className="text-2xl font-bold text-green-600 mb-2">
              ${homePriceResult.maxHomePrice.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              Estimated monthly payment: ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
            </div>
          </div>
          
          <details className="text-sm">
            <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-medium">
              View calculation details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-gray-700 whitespace-pre-line">
              {homePriceResult.explanation}
            </div>
          </details>
        </div>
      )}

      {!homePriceLoading && !homePriceResult && !homePriceError && (
        <div className="text-gray-600">
          Enter your income and ideal zip code to see your estimated affordable home price.
        </div>
      )}
    </div>
  );
};

export default HomePriceCalculator;
