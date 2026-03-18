import { estimateAffordableHomePrice } from "./affordabilityCalculator";

/** Minimal input for affordability calculation; avoids dependency on profile OnboardingData. */
export type AffordabilityInput = {
  gross_income?: number;
  ideal_zip_code?: string;
  credit_score_range?: string;
  down_payment?: number;
};

export type HomePriceResult = {
  maxHomePrice: number;
  totalMonthlyHousingCost: number;
  netAnnualIncome: number;
  interestRate: number;
  propertyTaxRate: number;
  monthlyMortgage: number;
  loanAmount: number;
  monthlyPMI: number;
  dtiUsed: number;
  downPayment: number;
  explanation: string;
};

export type HomePriceError = {
  error: string;
};

/** Maps UI credit band (e.g. 'good') to a single numeric score used by affordability formulas. */
export const mapCreditScoreToNumber = (creditScoreRange?: string): number => {
  switch (creditScoreRange) {
    case "excellent": // 750+
      return 800;
    case "good": // 700-749
      return 725;
    case "fair": // 650-699
      return 675;
    case "poor": // 600-649
      return 625;
    case "very-poor": // <600
      return 550;
    case "unknown":
    default:
      return 700; // Default to good credit
  }
};

/** Builds human-readable explanation string for the home price result and form inputs. */
export const generateHomePriceExplanation = (
  result: HomePriceResult,
  data: AffordabilityInput
): string => {
  // Calculate down payment percent for display
  const downPaymentPercent =
    result.maxHomePrice > 0 ? ((result.downPayment / result.maxHomePrice) * 100).toFixed(1) : "-";

  return `Based on your gross annual income of $${data.gross_income?.toLocaleString()}, credit score range, and a down payment of $${data.down_payment?.toLocaleString()} (${downPaymentPercent}% of home price), we estimate you can afford a home up to $${result.maxHomePrice.toLocaleString()}.

This estimate is calculated using a debt-to-income (DTI) approach: your maximum allowable monthly housing cost is determined as a percentage of your gross monthly income, in line with common DTI limits. We then backsolve for the highest home price you can afford, factoring in principal, interest, property taxes, homeowner's insurance, and any required PMI.

Key assumptions used:
- **Interest Rate:** ${
    typeof result.interestRate === "number" ? (result.interestRate * 100).toFixed(2) : "-"
  }%
- **Property Tax Rate:** ${
    typeof result.propertyTaxRate === "number" ? result.propertyTaxRate.toFixed(2) : "-"
  }%
- **DTI Used:** ${typeof result.dtiUsed === "number" ? result.dtiUsed.toFixed(0) : "-"}%

Your estimated monthly payment of $${result.totalMonthlyHousingCost.toLocaleString()} includes principal, interest, property taxes, homeowner's insurance, and PMI (if applicable). This approach gives you a realistic maximum home price based on your income and debts—not just a budget cap.`;
};

// Main home price calculation function
export const calculateAffordableHomePrice = (
  formData: AffordabilityInput
): HomePriceResult | HomePriceError => {
  // Check if we have all required data
  if (!formData.gross_income || !formData.ideal_zip_code) {
    return { error: "Missing required data for calculation" };
  }

  try {
    // Map credit score range to a numeric value
    const creditScore = mapCreditScoreToNumber(formData.credit_score_range);

    // Calculate down payment amount
    const downPaymentAmount = formData.down_payment ?? 50000;

    const result = estimateAffordableHomePrice({
      grossAnnualIncome: formData.gross_income ?? 0,
      creditScore,
      zipCode: formData.ideal_zip_code ?? "",
      downPayment: downPaymentAmount,
    });

    if ("error" in result) {
      return { error: result.error };
    }

    const homePriceResult: HomePriceResult = {
      maxHomePrice: result.maxHomePrice,
      totalMonthlyHousingCost: result.totalMonthlyHousingCost,
      netAnnualIncome: result.netAnnualIncome,
      interestRate: result.interestRate,
      propertyTaxRate: result.propertyTaxRate,
      monthlyMortgage: result.monthlyMortgage,
      loanAmount: result.loanAmount,
      monthlyPMI: result.monthlyPMI,
      dtiUsed: result.dtiUsed,
      downPayment: result.downPayment,
      explanation: "", // Will be set below
    };

    homePriceResult.explanation = generateHomePriceExplanation(homePriceResult, formData);

    return homePriceResult;
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Failed to calculate home price",
    };
  }
};
