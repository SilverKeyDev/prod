import { ChevronDown } from "lucide-react";
import React from "react";

import type { HomePriceResult } from "./lib/homePriceCalculation";

type HomePriceEstimateProps = {
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: (collapsed: boolean) => void;
  idealZipCode?: string;
};

const HomePriceEstimate: React.FC<HomePriceEstimateProps> = ({
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
  idealZipCode,
}) => {
  return (
    <div
      className={`col-span-1 mt-4 rounded-lg border border-olive bg-white px-3 py-4 sm:mt-6 sm:p-4 md:col-span-2 ${
        isAffordabilityCollapsed ? "pb-4 sm:pb-6" : ""
      }`}
    >
      <div
        className={`touch-friendly -m-2 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors duration-150 hover:bg-olive/5 ${
          isAffordabilityCollapsed ? "mb-2" : "mb-2"
        }`}
        onClick={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
      >
        <h3 className="text-base font-medium text-olive sm:text-lg">
          Estimated Home Affordability
        </h3>
        <ChevronDown
          className={`mobile-icon-sm text-olive transition-transform duration-300 ease-in-out ${
            isAffordabilityCollapsed ? "rotate-180" : ""
          }`}
        />
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isAffordabilityCollapsed
            ? "max-h-0 opacity-0"
            : "max-h-[2000px] opacity-100"
        }`}
      >
        <div className="pt-2">
          {homePriceLoading ? (
            <div className="flex items-center justify-center py-3 sm:py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-olive sm:h-6 sm:w-6"></div>
              Calculating affordability...
            </div>
          ) : homePriceError ? (
            <div className="text-responsive-xs space-y-2 py-2 text-black">
              <p className="font-medium">Unable to calculate affordability:</p>
              <p>{homePriceError}</p>
              <p>
                Please ensure you've entered your income, zip code, and other
                financial details.
              </p>
            </div>
          ) : homePriceResult ? (
            <div className="space-responsive-sm">
              <div className="gap-responsive-sm grid grid-cols-1 lg:grid-cols-2">
                <div>
                  <div className="px-2 py-3 text-center sm:p-4 lg:p-6">
                    <div className="mb-0 text-xl font-bold text-olive sm:mb-1 sm:text-2xl lg:text-3xl xl:text-4xl">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </div>
                    <div className="text-responsive-xs mb-2 text-gray-400 sm:mb-3">
                      Maximum recommended home price
                    </div>
                  </div>
                </div>
                <div className="px-2 text-center sm:px-0 lg:text-left">
                  <p className="text-lg font-bold text-olive sm:text-xl">
                    ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                    /mo
                  </p>
                  <p className="text-responsive-xs mb-1 text-gray-400">
                    Monthly Payment
                  </p>
                </div>
              </div>

              <div className="text-responsive-xs rounded border border-olive/30 bg-white px-2 py-3 text-black sm:p-3">
                <p className="text-responsive-xs mb-3 text-gray-600 sm:mb-4">
                  Based on your income and financial profile, here's what you
                  might afford:
                </p>
                <div className="space-y-1 overflow-x-auto rounded bg-[#EAD9B3] bg-opacity-20 px-2 py-2 font-mono text-xs text-black sm:space-y-2 sm:p-3 sm:text-sm">
                  <p>
                    1. <strong>Monthly Income</strong> = Gross Annual Income ÷
                  </p>
                  <p className="ml-2 break-words sm:ml-4">
                    = ${homePriceResult.netAnnualIncome.toLocaleString()} ÷ 12 ={" "}
                    <strong>
                      $
                      {(homePriceResult.netAnnualIncome / 12).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 0,
                        },
                      )}
                    </strong>
                  </p>

                  <p>
                    2. <strong>Max Monthly Housing Cost</strong> = Monthly
                    Income × DTI Ratio
                  </p>
                  <p className="ml-2 break-words sm:ml-4">
                    = ${(homePriceResult.netAnnualIncome / 12).toLocaleString()}{" "}
                    × {(homePriceResult.dtiUsed / 100).toFixed(2)} ={" "}
                    <strong>
                      $
                      {Math.round(
                        (homePriceResult.netAnnualIncome / 12) *
                          (homePriceResult.dtiUsed / 100),
                      ).toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    3. <strong>Mortgage Payment</strong> = P × r × (1 + r)
                    <sup>n</sup> ÷ ((1 + r)<sup>n</sup> - 1)
                  </p>
                  <p className="ml-2 sm:ml-4">Where:</p>
                  <p className="ml-4 break-words sm:ml-8">
                    P = $
                    {Math.round(homePriceResult.loanAmount).toLocaleString()}
                  </p>
                  <p className="ml-4 sm:ml-8">
                    r = {(homePriceResult.interestRate / 100 / 12).toFixed(4)}{" "}
                    (monthly interest)
                  </p>
                  <p className="ml-4 sm:ml-8">
                    n = {30 * 12} months (30-year loan)
                  </p>
                  <p className="ml-2 break-words sm:ml-4">
                    →{" "}
                    <strong>
                      Monthly Mortgage = $
                      {homePriceResult.monthlyMortgage.toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    4. <strong>Property Tax</strong> = Home Price × Tax Rate ÷
                  </p>
                  <p className="ml-2 break-words sm:ml-4">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} ×{" "}
                    {(homePriceResult.propertyTaxRate * 100).toFixed(2)}% ÷ 12
                  </p>

                  <p>
                    5. <strong>Home Insurance</strong> = Home Price × 0.50% ÷ 12
                  </p>
                  <p className="ml-2 break-words sm:ml-4">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} × 0.005 ÷
                  </p>

                  {homePriceResult.monthlyPMI > 0 && (
                    <>
                      <p>
                        6. <strong>PMI (Private Mortgage Insurance)</strong> =
                        Loan × PMI Rate ÷ 12
                      </p>
                      <p className="ml-2 sm:ml-4">
                        PMI Rate ≈{" "}
                        {(
                          ((homePriceResult.monthlyPMI * 12) /
                            homePriceResult.loanAmount) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                      <p className="ml-2 break-words sm:ml-4">
                        →{" "}
                        <strong>
                          Monthly PMI = $
                          {homePriceResult.monthlyPMI.toLocaleString()}
                        </strong>
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                  <p className="text-responsive-xs font-medium">
                    Why This Formula Matters:
                  </p>
                  <p className="text-responsive-xs leading-relaxed">
                    This estimate uses a <strong>Debt-to-Income (DTI)</strong>{" "}
                    ratio of{" "}
                    <strong>{homePriceResult.dtiUsed.toFixed(1)}%</strong>,
                    which reflects current lending guidelines. It ensures your
                    total monthly housing cost—including mortgage, taxes,
                    insurance, and PMI—stays within what lenders generally
                    approve based on your income and debt load.
                  </p>
                  <p className="text-responsive-xs leading-relaxed">
                    We include estimated <strong>property taxes</strong>{" "}
                    {idealZipCode && (
                      <>
                        (based on ZIP code <strong>{idealZipCode}</strong>)
                      </>
                    )}
                    , <strong>insurance</strong> costs, and <strong>PMI</strong>{" "}
                    if your down payment is under 20%. These are factored into
                    your maximum affordable home price using smart search logic.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-responsive-xs px-2 py-2 text-black sm:px-0">
              <p>
                Enter your income, zip code, and other financial details to see
                your estimated home affordability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePriceEstimate;
