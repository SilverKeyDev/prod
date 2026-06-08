import { describe, expect, it } from "vitest";

import {
  calculateAffordableHomePrice,
  generateHomePriceExplanation,
  type HomePriceResult,
  mapCreditScoreToNumber,
} from "./homePriceCalculation";

describe("homePriceCalculation", () => {
  describe("mapCreditScoreToNumber", () => {
    it("maps known bands to numeric scores", () => {
      expect(mapCreditScoreToNumber("excellent")).toBe(800);
      expect(mapCreditScoreToNumber("good")).toBe(725);
      expect(mapCreditScoreToNumber("fair")).toBe(675);
      expect(mapCreditScoreToNumber("working_on_it")).toBe(620);
      expect(mapCreditScoreToNumber("poor")).toBe(625);
      expect(mapCreditScoreToNumber("very-poor")).toBe(550);
    });

    it("defaults unknown bands to 700", () => {
      expect(mapCreditScoreToNumber(undefined)).toBe(700);
      expect(mapCreditScoreToNumber("unknown")).toBe(700);
    });
  });

  describe("calculateAffordableHomePrice", () => {
    it("returns error when gross income is missing", () => {
      const out = calculateAffordableHomePrice({
        ideal_zip_code: "30301",
        gross_income: undefined,
      });
      expect("error" in out).toBe(true);
      if ("error" in out) {
        expect(out.error).toContain("Missing required");
      }
    });

    it("returns error when ZIP is missing", () => {
      const out = calculateAffordableHomePrice({
        gross_income: 120_000,
        ideal_zip_code: undefined,
      });
      expect("error" in out).toBe(true);
    });

    it("returns a priced result for valid inputs", () => {
      const out = calculateAffordableHomePrice({
        gross_income: 150_000,
        ideal_zip_code: "30301",
        credit_score_range: "good",
        down_payment: 50_000,
      });
      expect("error" in out).toBe(false);
      if (!("error" in out)) {
        expect(out.maxHomePrice).toBeGreaterThan(0);
        expect(out.totalMonthlyHousingCost).toBeGreaterThan(0);
        expect(out.explanation.length).toBeGreaterThan(0);
      }
    });
  });

  describe("generateHomePriceExplanation", () => {
    it("includes income and max price in the text", () => {
      const result: HomePriceResult = {
        maxHomePrice: 400_000,
        totalMonthlyHousingCost: 2500,
        netAnnualIncome: 120_000,
        interestRate: 0.065,
        propertyTaxRate: 1.1,
        monthlyMortgage: 2000,
        loanAmount: 320_000,
        monthlyPMI: 0,
        dtiUsed: 36,
        downPayment: 80_000,
        explanation: "",
      };
      const text = generateHomePriceExplanation(result, {
        gross_income: 120_000,
        ideal_zip_code: "30301",
        down_payment: 80_000,
      });
      expect(text).toContain("120,000");
      expect(text).toContain("400,000");
    });
  });
});
