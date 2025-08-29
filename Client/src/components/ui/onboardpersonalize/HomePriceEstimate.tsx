import React from "react";
import Loading from "../base/Loading";

interface HomePriceResult {
  maxHomePrice: number;
  totalMonthlyHousingCost: number;
  netAnnualIncome: number;
  interestRate?: number;
  propertyTaxRate?: number;
  pmiRate?: number;
}

interface FormData {
  down_payment?: number;
}

interface HomePriceEstimateProps {
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  showHomePriceDetails: boolean;
  setShowHomePriceDetails: (show: boolean) => void;
  formData: FormData;
}

const HomePriceEstimate: React.FC<HomePriceEstimateProps> = ({
  homePriceLoading,
  homePriceError,
  homePriceResult,
  showHomePriceDetails,
  setShowHomePriceDetails,
  formData,
}) => {
  return (
    <div className="mt-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
          Estimated Home Price Range
        </h3>
        <button
          onClick={() => setShowHomePriceDetails(!showHomePriceDetails)}
          className="text-olive hover:text-olive/80 text-sm font-medium"
        >
          {showHomePriceDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {homePriceLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loading message="Calculating your home price estimate..." />
        </div>
      ) : homePriceError ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded border border-red-200">
          <p>{homePriceError}</p>
          <p className="mt-2">
            Please ensure you've entered your income, zip code, and
            other financial details.
          </p>
        </div>
      ) : homePriceResult ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-center p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive mb-2">
                  ${homePriceResult.maxHomePrice.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
                  Maximum recommended home price
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-black">Monthly Payment</p>
              <p className="text-xl font-bold text-olive">
                $
                {homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                /mo
              </p>
            </div>
          </div>

          <div className="text-sm text-black bg-white p-3 rounded border border-olive/30">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4">
              Based on your income and financial profile, here's what you
              might afford:
            </p>
            <div className="bg-[#EAD9B3] bg-opacity-20 p-3 rounded font-mono text-black space-y-1">
              <p>
                1. <strong>Monthly Income</strong> = Gross Annual
                Income ÷ 12
              </p>
              <p className="ml-4">
                = ${homePriceResult.netAnnualIncome.toLocaleString()}{" "}
                ÷ 12 ={" "}
                <strong>
                  $
                  {(
                    homePriceResult.netAnnualIncome / 12
                  ).toLocaleString()}
                </strong>
              </p>
              <p>
                2. <strong>Max Housing Cost</strong> = Monthly Income ×
                28%
              </p>
              <p className="ml-4">
                = $
                {(
                  homePriceResult.netAnnualIncome / 12
                ).toLocaleString()}{" "}
                × 28% ={" "}
                <strong>
                  $
                  {homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                </strong>
              </p>
              <p>
                3. <strong>Max Home Price</strong> = Reverse-calculated
                from payment
              </p>
              <p className="ml-4">
                = <strong>
                  ${homePriceResult.maxHomePrice.toLocaleString()}
                </strong>
              </p>
            </div>

            {showHomePriceDetails && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs space-y-2">
                <h4 className="font-semibold text-gray-800">
                  Calculation Details:
                </h4>
                <div className="space-y-1 text-gray-700">
                  <p>
                    • Interest Rate:{" "}
                    {typeof homePriceResult.interestRate === "number"
                      ? (homePriceResult.interestRate * 100).toFixed(2)
                      : "-"}
                    %
                  </p>
                  <p>
                    • Property Tax Rate:{" "}
                    {typeof homePriceResult.propertyTaxRate === "number"
                      ? (
                          homePriceResult.propertyTaxRate * 100
                        ).toFixed(2)
                      : "-"}
                    %
                  </p>
                  <p>
                    • PMI Rate:{" "}
                    {typeof homePriceResult.pmiRate === "number"
                      ? (homePriceResult.pmiRate * 100).toFixed(2)
                      : "-"}
                    %
                  </p>
                  <p>
                    • Down Payment: $
                    {(formData.down_payment || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm p-4 bg-gray-50 rounded border border-gray-200">
          <p>
            Complete your income, zip code, and credit score to see your
            estimated home price range.
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePriceEstimate;
