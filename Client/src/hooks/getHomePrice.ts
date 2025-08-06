type AffordabilityParams = {
  grossAnnualIncome: number;
  creditScore: number;
  zipCode: string;
  downPayment: number;  // 💵 in dollars, not percent
  insuranceRate?: number;
  loanTermYears?: number;
};

type AffordabilityResult = {
  maxHomePrice: number;
  loanAmount: number;
  downPayment: number;
  monthlyMortgage: number;
  monthlyPMI: number;
  totalMonthlyHousingCost: number;
  interestRate: number;
  propertyTaxRate: number;
  dtiUsed: number;
  warnings: string[];
  netAnnualIncome: number;
};

export async function estimateAffordableHomePrice({
  grossAnnualIncome,
  creditScore,
  zipCode,
  downPayment,
  insuranceRate = 0.5,
  loanTermYears = 30,
}: AffordabilityParams): Promise<AffordabilityResult | { error: string }> {
  const grossMonthlyIncome = grossAnnualIncome / 12;
  const warnings: string[] = [];

  // 🔍 Property Tax Rate Lookup
  const state_tax_rates: Record<string, number> = {
    "01": 0.0041, "02": 0.0119, "03": 0.0072, "04": 0.0062, "05": 0.0076, "06": 0.0076, "07": 0.0076,
    "08": 0.0051, "09": 0.0214, "10": 0.0057, "11": 0.0085, "12": 0.0098, "13": 0.0092, "14": 0.0028,
    "15": 0.0069, "16": 0.0069, "17": 0.0207, "18": 0.0085, "19": 0.0153, "20": 0.0141, "21": 0.0086,
    "22": 0.0055, "23": 0.0136, "24": 0.0109, "25": 0.0123, "26": 0.0154, "27": 0.0112, "28": 0.0065,
    "29": 0.0097, "30": 0.0084, "31": 0.0173, "32": 0.0060, "33": 0.0218, "34": 0.0250, "35": 0.0077,
    "36": 0.0173, "37": 0.0084, "38": 0.0098, "39": 0.0157, "40": 0.0090, "41": 0.0097, "42": 0.0158,
    "43": 0.0158, "44": 0.0163, "45": 0.0057, "46": 0.0131, "47": 0.0072, "48": 0.0181, "49": 0.0064,
    "50": 0.0189, "51": 0.0080, "52": 0.0080, "53": 0.0098, "54": 0.0058, "55": 0.0173, "56": 0.0061,
    "57": 0.0061, "58": 0.0061, "59": 0.0084, "60": 0.0207, "61": 0.0207, "62": 0.0207, "63": 0.0097,
    "64": 0.0141, "65": 0.0141, "66": 0.0141, "67": 0.0141, "68": 0.0173, "69": 0.0173, "70": 0.0055,
    "71": 0.0055, "72": 0.0062, "73": 0.0090, "74": 0.0090, "75": 0.0181, "76": 0.0181, "77": 0.0181,
    "78": 0.0181, "79": 0.0181, "80": 0.0051, "81": 0.0051, "82": 0.0061, "83": 0.0069, "84": 0.0064,
    "85": 0.0072, "86": 0.0072, "87": 0.0077, "88": 0.0077, "89": 0.0060, "90": 0.0076, "91": 0.0076,
    "92": 0.0076, "93": 0.0076, "94": 0.0076, "95": 0.0076, "96": 0.0076, "97": 0.0097, "98": 0.0098,
    "99": 0.0098,
  };
  const zipPrefix = zipCode.slice(0, 2);
  const taxRate = state_tax_rates[zipPrefix];
  if (taxRate === undefined) return { error: `Unsupported ZIP prefix '${zipPrefix}' for tax rate lookup.` };

  // 🏦 Interest Rate by Credit
  let interestRate: number;
  if (creditScore >= 780) interestRate = 6.5;
  else if (creditScore >= 740) interestRate = 6.75;
  else if (creditScore >= 700) interestRate = 7.0;
  else if (creditScore >= 660) interestRate = 7.25;
  else if (creditScore >= 620) interestRate = 7.75;
  else if (creditScore >= 580) interestRate = 8.0;
  else return { error: "Credit score too low for conventional loan." };

  if (interestRate >= 7.0) {
    warnings.push("Current rates are elevated. Consider waiting for potential decreases or rate buydown options.");
  }

  const r = interestRate / 100 / 12;
  const n = loanTermYears * 12;

  // DTI Rules
  let frontEndDTI: number;
  if (creditScore >= 740) frontEndDTI = 0.36;
  else if (creditScore >= 680) frontEndDTI = 0.33;
  else frontEndDTI = 0.28;

  const budget = grossMonthlyIncome * frontEndDTI;

  function mortgagePayment(p: number): number {
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function totalMonthlyCost(homePrice: number): { total: number; pmi: number; monthlyMortgage: number } {
    const loanAmount = homePrice - downPayment;
    const monthlyPI = mortgagePayment(loanAmount);
    const monthlyTax = (homePrice * taxRate) / 12;
    const monthlyInsurance = (homePrice * (insuranceRate / 100)) / 12;
    return {
      total: monthlyPI + monthlyTax + monthlyInsurance,
      pmi: 0,
      monthlyMortgage: monthlyPI,
    };
  }

  // 🔁 Binary search for max affordable home price given fixed downPayment
  let low = downPayment + 100_000;
  let high = 10_000_000;
  let bestPrice = 0;

  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const cost = totalMonthlyCost(mid);
    if (cost.total <= budget) {
      bestPrice = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  const loanAmount = bestPrice - downPayment;
  const finalCosts = totalMonthlyCost(bestPrice);
  const dtiUsed = finalCosts.total / grossMonthlyIncome;

  return {
    maxHomePrice: Math.round(bestPrice),
    loanAmount: Math.round(loanAmount),
    downPayment: Math.round(downPayment),
    monthlyMortgage: Math.round(finalCosts.monthlyMortgage),
    monthlyPMI: 0,
    totalMonthlyHousingCost: Math.round(finalCosts.total),
    interestRate: parseFloat(interestRate.toFixed(2)),
    propertyTaxRate: parseFloat(taxRate.toFixed(4)),
    dtiUsed: parseFloat((dtiUsed * 100).toFixed(1)),
    warnings,
    netAnnualIncome: grossAnnualIncome,
  };
}
