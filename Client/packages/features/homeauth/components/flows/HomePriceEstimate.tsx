import React from "react";

import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";
import type { HomePriceResult } from "packages/utils/affordability";

import { BodyText, Title } from "@/components/ui";

type HomePriceEstimateProps = {
  homePriceLoading: boolean;
  homePriceError: string | null;
  homePriceResult: HomePriceResult | null;
  isAffordabilityCollapsed: boolean;
  setIsAffordabilityCollapsed: (collapsed: boolean) => void;
  idealZipCode?: string;
};

export function HomePriceEstimate({
  homePriceLoading,
  homePriceError,
  homePriceResult,
  isAffordabilityCollapsed,
  setIsAffordabilityCollapsed,
  idealZipCode,
}: HomePriceEstimateProps) {
  return (
    <Box
      className={`border-border bg-background-surface col-span-1 mt-4 rounded-lg border px-3 py-4 sm:mt-6 sm:p-4 md:col-span-2`}
    >
      <Box
        role="button"
        tabIndex={0}
        className={`touch-friendly -m-2 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors duration-150 hover:bg-neutral-100`}
        onClick={() => setIsAffordabilityCollapsed(!isAffordabilityCollapsed)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsAffordabilityCollapsed(!isAffordabilityCollapsed);
          }
        }}
      >
        <Title as="h3" size="md" className="text-primary font-medium sm:text-lg">
          Estimated Home Affordability
        </Title>
        <Icon
          name="chevron-down"
          className={`mobile-icon-sm text-primary transition-transform duration-300 ease-in-out ${
            isAffordabilityCollapsed ? "rotate-180" : ""
          }`}
        />
      </Box>

      <Box
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isAffordabilityCollapsed ? "max-h-0 opacity-0" : "max-h-screen opacity-100"
        }`}
      >
        <Box className="pt-2">
          {homePriceLoading ? (
            <Box className="flex items-center justify-center py-3 sm:py-4">
              <Box className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-b-neutral-700 sm:h-6 sm:w-6"></Box>
              Calculating affordability...
            </Box>
          ) : homePriceError ? (
            <Box className="text-responsive-xs space-y-2 py-2 text-black">
              <BodyText as="p" className="font-medium">
                Unable to calculate affordability:
              </BodyText>
              <BodyText as="p">{homePriceError}</BodyText>
              <BodyText as="p">
                Please ensure you've entered your income, zip code, and other financial details.
              </BodyText>
            </Box>
          ) : homePriceResult ? (
            <Box className="space-responsive-sm">
              <Box className="gap-responsive-sm grid grid-cols-1 lg:grid-cols-2">
                <Box>
                  <Box className="px-2 py-3 text-center sm:p-4 lg:p-6">
                    <Box className="text-primary mb-0 text-xl font-bold sm:mb-1 sm:text-2xl lg:text-3xl xl:text-4xl">
                      ${homePriceResult.maxHomePrice.toLocaleString()}
                    </Box>
                    <Box className="text-responsive-xs text-text-disabled mb-2 sm:mb-3">
                      Maximum recommended home price
                    </Box>
                  </Box>
                </Box>
                <Box className="px-2 py-3 text-center sm:p-4 sm:px-0 lg:p-6 lg:text-left">
                  <Box className="text-primary mb-0 text-xl font-bold sm:mb-1 sm:text-2xl lg:text-3xl xl:text-4xl">
                    ${homePriceResult.totalMonthlyHousingCost.toLocaleString()}
                    /mo
                  </Box>
                  <Box className="text-responsive-xs text-text-disabled mb-2 sm:mb-3">
                    Monthly Payment
                  </Box>
                </Box>
              </Box>

              <Box className="text-responsive-xs border-border bg-background-surface rounded border px-2 py-3 text-black sm:p-3">
                <Box className="bg-accent-muted space-y-1 overflow-x-auto rounded bg-opacity-20 px-2 py-2 font-mono text-black sm:space-y-2 sm:p-3 sm:text-xs">
                  <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                    1. <strong>Monthly Income</strong> = Gross Annual Income ÷
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                    = ${homePriceResult.netAnnualIncome.toLocaleString()} ÷ 12 ={" "}
                    <strong>
                      $
                      {(homePriceResult.netAnnualIncome / 12).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </BodyText>

                  <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                    2. <strong>Max Monthly Housing Cost</strong> = Monthly Income × DTI Ratio
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                    = ${(homePriceResult.netAnnualIncome / 12).toLocaleString()} ×{" "}
                    {(homePriceResult.dtiUsed / 100).toFixed(2)} ={" "}
                    <strong>
                      $
                      {Math.round(
                        (homePriceResult.netAnnualIncome / 12) * (homePriceResult.dtiUsed / 100)
                      ).toLocaleString()}
                    </strong>
                  </BodyText>

                  <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                    3. <strong>Mortgage Payment</strong> = P × r × (1 + r)
                    <sup>n</sup> ÷ ((1 + r)<sup>n</sup> - 1)
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 sm:ml-4 sm:text-xs">
                    Where:
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-4 break-words sm:ml-8 sm:text-xs">
                    P = ${Math.round(homePriceResult.loanAmount).toLocaleString()}
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-4 sm:ml-8 sm:text-xs">
                    r = {(homePriceResult.interestRate / 100 / 12).toFixed(4)} (monthly interest)
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-4 sm:ml-8 sm:text-xs">
                    n = {30 * 12} months (30-year loan)
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                    →{" "}
                    <strong>
                      Monthly Mortgage = ${homePriceResult.monthlyMortgage.toLocaleString()}
                    </strong>
                  </BodyText>

                  <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                    4. <strong>Property Tax</strong> = Home Price × Tax Rate ÷
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} ×{" "}
                    {(homePriceResult.propertyTaxRate * 100).toFixed(2)}% ÷ 12
                  </BodyText>

                  <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                    5. <strong>Home Insurance</strong> = Home Price × 0.50% ÷ 12
                  </BodyText>
                  <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                    = ${homePriceResult.maxHomePrice.toLocaleString()} × 0.005 ÷
                  </BodyText>

                  {homePriceResult.monthlyPMI > 0 && (
                    <>
                      <BodyText as="p" size="xs" className="text-tiny sm:text-xs">
                        6. <strong>PMI (Private Mortgage Insurance)</strong> = Loan × PMI Rate ÷ 12
                      </BodyText>
                      <BodyText as="p" size="xs" className="text-tiny ml-2 sm:ml-4 sm:text-xs">
                        PMI Rate ≈{" "}
                        {(
                          ((homePriceResult.monthlyPMI * 12) / homePriceResult.loanAmount) *
                          100
                        ).toFixed(2)}
                        %
                      </BodyText>
                      <BodyText as="p" size="xs" className="ml-2 break-words sm:ml-4 sm:text-xs">
                        →{" "}
                        <strong>
                          Monthly PMI = ${homePriceResult.monthlyPMI.toLocaleString()}
                        </strong>
                      </BodyText>
                    </>
                  )}
                </Box>

                <Box className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                  <BodyText as="p" size="xs" className="leading-relaxed">
                    We include estimated <strong>property taxes</strong>{" "}
                    {idealZipCode && (
                      <>
                        (based on ZIP code <strong>{idealZipCode}</strong>)
                      </>
                    )}
                    , <strong>insurance</strong> costs, and <strong>PMI</strong> if your down
                    payment is under 20%. These are factored into your maximum affordable home price
                    using smart search logic.
                  </BodyText>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="text-responsive-xs px-2 py-2 text-black sm:px-0">
              <BodyText as="p">
                Enter your income, zip code, and other financial details to see your estimated home
                affordability.
              </BodyText>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
