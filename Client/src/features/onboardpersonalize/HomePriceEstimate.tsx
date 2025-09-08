import React from "react";
import { ChevronDown } from "lucide-react";

interface HomePriceResult {
  maxHomePrice: number;
  totalMonthlyHousingCost: number;
  netAnnualIncome: number;
  interestRate: number;
  propertyTaxRate: number;
  monthlyMortgage: number;
  loanAmount: number;
  monthlyPMI: number;
  dtiUsed: number;
}

interface HomePriceEstimateProps {
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: (collapsed: boolean) => void;
  idealZipCode?: string;
}

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
      className={`col-span-1 md:col-span-2 mt-4 sm:mt-6 px-3 py-4 sm:p-4 bg-white rounded-lg border border-olive ${
        isAffordabilityCollapsed ? "pb-4 sm:pb-6" : ""
      }`}
    >
      <div
        className={`flex items-center justify-between cursor-pointer p-2 -m-2 rounded-lg hover:bg-olive/5 transition-colors duration-150 touch-friendly ${
          isAffordabilityCollapsed ? "mb-2" : "mb-2"
        }`}
        onClick={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
      >
        <h3 className="text-base sm:text-lg font-medium text-olive">
          Estimated Home Affordability
        </h3>
        <ChevronDown
          className={`mobile-icon-sm text-olive transition-transform duration-300 ease-in-out ${
            isAffordabilityCollapsed ? "rotate-180" : ""
          }`}
        />
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isAffordabilityCollapsed
            ? "max-h-0 opacity-0"
            : "max-h-[2000px] opacity-100"
        }`}
      >
        <div className="pt-2">
          {homePriceLoading ? (
            <div className="flex items-center justify-center py-3 sm:py-4">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-olive"></div>
              <span className="ml-2 text-responsive-xs text-black">
                Calculating affordability...
              </span>
            </div>
          ) : homePriceError ? (
            <div className="text-black text-responsive-xs py-2 space-y-2">
              <p className="font-medium">Unable to calculate affordability:</p>
              <p>{homePriceError}</p>
              <p>
                Please ensure you've entered your income, zip code, and other
                financial details.
              </p>
            </div>
          ) : homePriceResult ? (
            <div className="space-responsive-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-responsive-sm">
                <div>
                  <div className="text-center px-2 py-3 sm:p-4 lg:p-6">
                    <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-olive mb-1 sm:mb-2">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </div>
                    <div className="text-responsive-xs text-gray-600 mb-2 sm:mb-4">
                      Maximum recommended home price
                    </div>
                  </div>
                </div>
                <div className="px-2 sm:px-0 text-center lg:text-left">
                  <p className="text-responsive-xs text-black mb-1">Monthly Payment</p>
                  <p className="text-lg sm:text-xl font-bold text-olive">
                    ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                    /mo
                  </p>
                </div>
              </div>

              <div className="text-responsive-xs text-black bg-white px-2 py-3 sm:p-3 rounded border border-olive/30">
                <p className="text-responsive-xs text-gray-600 mb-3 sm:mb-4">
                  Based on your income and financial profile, here's what you
                  might afford:
                </p>
                <div className="bg-[#EAD9B3] bg-opacity-20 px-2 py-2 sm:p-3 rounded font-mono text-xs sm:text-sm text-black space-y-1 sm:space-y-2 overflow-x-auto">
                  <p>
                    1. <strong>Monthly Income</strong> = Gross Annual Income ÷ 12
                  </p>
                  <p className="ml-2 sm:ml-4 break-words">
                    = ${homePriceResult.netAnnualIncome.toLocaleString()} ÷ 12 ={" "}
                    <strong>
                      $
                      {(homePriceResult.netAnnualIncome / 12).toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 0,
                        }
                      )}
                    </strong>
                  </p>

                  <p>
                    2. <strong>Max Monthly Housing Cost</strong> = Monthly Income
                    × DTI Ratio
                  </p>
                  <p className="ml-2 sm:ml-4 break-words">
                    = $
                    {(homePriceResult.netAnnualIncome / 12).toLocaleString()} ×{" "}
                    {(homePriceResult.dtiUsed / 100).toFixed(2)} ={" "}
                    <strong>
                      $
                      {Math.round(
                        (homePriceResult.netAnnualIncome / 12) *
                          (homePriceResult.dtiUsed / 100)
                      ).toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    3. <strong>Mortgage Payment</strong> = P × r × (1 + r)
                    <sup>n</sup> ÷ ((1 + r)<sup>n</sup> - 1)
                  </p>
                  <p className="ml-2 sm:ml-4">Where:</p>
                  <p className="ml-4 sm:ml-8 break-words">
                    P = ${Math.round(homePriceResult.loanAmount).toLocaleString()}
                  </p>
                  <p className="ml-4 sm:ml-8">
                    r ={" "}
                    {(homePriceResult.interestRate / 100 / 12).toFixed(4)}{" "}
                    (monthly interest)
                  </p>
                  <p className="ml-4 sm:ml-8">n = {30 * 12} months (30-year loan)</p>
                  <p className="ml-2 sm:ml-4 break-words">
                    →{" "}
                    <strong>
                      Monthly Mortgage = $
                      {homePriceResult.monthlyMortgage.toLocaleString()}
                    </strong>
                  </p>

                  <p>
                    4. <strong>Property Tax</strong> = Home Price × Tax Rate ÷ 12
                  </p>
                  <p className="ml-2 sm:ml-4 break-words">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} ×{" "}
                    {(homePriceResult.propertyTaxRate * 100).toFixed(2)}% ÷ 12
                  </p>

                  <p>
                    5. <strong>Home Insurance</strong> = Home Price × 0.50% ÷ 12
                  </p>
                  <p className="ml-2 sm:ml-4 break-words">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} × 0.005 ÷
                    12
                  </p>

                  {homePriceResult.monthlyPMI > 0 && (
                    <>
                      <p>
                        6.{" "}
                        <strong>PMI (Private Mortgage Insurance)</strong> = Loan
                        × PMI Rate ÷ 12
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
                      <p className="ml-2 sm:ml-4 break-words">
                        →{" "}
                        <strong>
                          Monthly PMI = $
                          {homePriceResult.monthlyPMI.toLocaleString()}
                        </strong>
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                  <p className="font-medium text-responsive-xs">Why This Formula Matters:</p>
                  <p className="text-responsive-xs leading-relaxed">
                    This estimate uses a{" "}
                    <strong>Debt-to-Income (DTI)</strong> ratio of{" "}
                    <strong>{homePriceResult.dtiUsed.toFixed(1)}%</strong>, which
                    reflects current lending guidelines. It ensures your total
                    monthly housing cost—including mortgage, taxes, insurance, and
                    PMI—stays within what lenders generally approve based on your
                    income and debt load.
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
            <div className="text-responsive-xs text-black py-2 px-2 sm:px-0">
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