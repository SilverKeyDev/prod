import { describe, expect, it } from "vitest";

import { estimateMonthlyPayment, estimateMonthlyPaymentBreakdown } from "./affordabilityCalculator";

describe("estimateMonthlyPaymentBreakdown", () => {
  it("matches legacy estimateMonthlyPayment for financed (no HOA/utilities)", () => {
    const homePrice = 450_000;
    const downPayment = 90_000;
    const zipCode = "90210";
    const creditScore = 750;

    const legacy = estimateMonthlyPayment({
      homePrice,
      downPayment,
      zipCode,
      creditScore,
    });
    const breakdown = estimateMonthlyPaymentBreakdown({
      homePrice,
      zipCode,
      payingCash: false,
      downPayment,
      creditScore,
      hoaMonthly: 0,
      utilitiesMonthly: 0,
    });

    expect(legacy).not.toBeNull();
    expect(breakdown).not.toBeNull();
    expect(breakdown!.totalMonthly).toBe(legacy);
    expect(breakdown!.payingCash).toBe(false);
    expect(breakdown!.principalAndInterest).toBeGreaterThan(0);
  });

  it("cash buyer has zero P&I and positive tax and insurance", () => {
    const breakdown = estimateMonthlyPaymentBreakdown({
      homePrice: 400_000,
      zipCode: "10001",
      payingCash: true,
      hoaMonthly: 0,
      utilitiesMonthly: 0,
    });

    expect(breakdown).not.toBeNull();
    expect(breakdown!.payingCash).toBe(true);
    expect(breakdown!.principalAndInterest).toBe(0);
    expect(breakdown!.loanAmount).toBe(0);
    expect(breakdown!.interestRateApr).toBeNull();
    expect(breakdown!.propertyTax).toBeGreaterThan(0);
    expect(breakdown!.homeownersInsurance).toBeGreaterThan(0);
    expect(breakdown!.totalMonthly).toBe(breakdown!.propertyTax + breakdown!.homeownersInsurance);
  });

  it("returns null for unsupported ZIP", () => {
    expect(
      estimateMonthlyPaymentBreakdown({
        homePrice: 300_000,
        zipCode: "xx",
        payingCash: true,
      })
    ).toBeNull();
  });

  it("returns null for financed when credit is too low", () => {
    expect(
      estimateMonthlyPaymentBreakdown({
        homePrice: 300_000,
        zipCode: "90210",
        payingCash: false,
        downPayment: 60_000,
        creditScore: 500,
      })
    ).toBeNull();
  });

  it("adds HOA and utilities to total", () => {
    const base = estimateMonthlyPaymentBreakdown({
      homePrice: 300_000,
      zipCode: "90210",
      payingCash: true,
    });
    const withAddons = estimateMonthlyPaymentBreakdown({
      homePrice: 300_000,
      zipCode: "90210",
      payingCash: true,
      hoaMonthly: 100,
      utilitiesMonthly: 50,
    });

    expect(base).not.toBeNull();
    expect(withAddons).not.toBeNull();
    expect(withAddons!.totalMonthly).toBe(base!.totalMonthly + 150);
  });
});
