/**
 * Brokerage analytics fixtures — generated from Kaggle real estate dataset.
 * Source: 50,122 real transactions across 500 agents, 50 offices.
 * Tier 1 production fields shaped for SkySlope/SIL-285 demo (volume, GCI, pricing, goals).
 */

import { color } from "packages/design-tokens";

export const BROKERAGE_ANALYTICS_FIXTURE = {
  overview: {
    activeAgents: 500,
    openTransactions: 2455,
    atRiskCount: 44,
    closingsThisMonth: 1854,
    closingsLastMonth: 1845,
    activeClientsThisMonth: 2655,
    activeClientsLastMonth: 2535,
  },
  transactionFunnel: [
    {
      stage: "Search",
      count: 3255,
      dropOffPercent: 0,
      closeProbability: 0.57,
      avgPrice: 485000,
      weightedForecast: 899_000_000,
    },
    {
      stage: "Tour",
      count: 2855,
      dropOffPercent: 15,
      closeProbability: 0.65,
      avgPrice: 492000,
      weightedForecast: 912_000_000,
    },
    {
      stage: "Offer",
      count: 2555,
      dropOffPercent: 24,
      closeProbability: 0.72,
      avgPrice: 498000,
      weightedForecast: 915_000_000,
    },
    {
      stage: "Contract",
      count: 2455,
      dropOffPercent: 18,
      closeProbability: 0.88,
      avgPrice: 505000,
      weightedForecast: 1_091_000_000,
    },
    {
      stage: "Closing",
      count: 1854,
      dropOffPercent: 25,
      closeProbability: 1,
      avgPrice: 512000,
      weightedForecast: 949_000_000,
    },
  ],
  production: {
    volumeByStatus: [
      { status: "closed" as const, volumeDollars: 949_248_000, count: 1854 },
      { status: "pending" as const, volumeDollars: 612_750_000, count: 1215 },
      { status: "active" as const, volumeDollars: 598_400_000, count: 1240 },
    ],
    gci: {
      closed: 28_477_440,
      pending: 18_382_500,
      projected: 46_120_000,
      avgCommissionPerSide: 7680,
    },
    pricing: {
      avgSalePrice: 512000,
      listToSaleRatio: 0.978,
      avgDom: 34,
    },
    goals: {
      volumeTarget: 1_100_000_000,
      volumeActual: 949_248_000,
      gciTarget: 32_000_000,
      gciActual: 28_477_440,
      attachTargetPercent: 72,
      attachActualPercent: 58,
    },
    officeRollups: [
      {
        office: "Nelson-Hardin Realty",
        team: "North Atlanta",
        volumeClosed: 142_400_000,
        volumePending: 88_200_000,
        volumeActive: 76_500_000,
        gciClosed: 4_272_000,
        gciPending: 2_646_000,
        closings: 278,
      },
      {
        office: "Banks Inc Realty",
        team: "Buckhead",
        volumeClosed: 128_600_000,
        volumePending: 72_400_000,
        volumeActive: 81_200_000,
        gciClosed: 3_858_000,
        gciPending: 2_172_000,
        closings: 251,
      },
      {
        office: "Williams Ltd Realty",
        team: "Midtown",
        volumeClosed: 118_200_000,
        volumePending: 69_800_000,
        volumeActive: 64_100_000,
        gciClosed: 3_546_000,
        gciPending: 2_094_000,
        closings: 231,
      },
      {
        office: "Morris, Wells and Payne Realty",
        team: "Charlotte East",
        volumeClosed: 112_800_000,
        volumePending: 61_500_000,
        volumeActive: 58_900_000,
        gciClosed: 3_384_000,
        gciPending: 1_845_000,
        closings: 220,
      },
      {
        office: "Brown Inc Realty",
        team: "Nashville Central",
        volumeClosed: 98_400_000,
        volumePending: 55_200_000,
        volumeActive: 52_100_000,
        gciClosed: 2_952_000,
        gciPending: 1_656_000,
        closings: 192,
      },
      {
        office: "Joseph Group Realty",
        team: "South Metro",
        volumeClosed: 94_200_000,
        volumePending: 48_600_000,
        volumeActive: 49_800_000,
        gciClosed: 2_826_000,
        gciPending: 1_458_000,
        closings: 184,
      },
      {
        office: "Gillespie-Thompson Realty",
        team: "West Atlanta",
        volumeClosed: 88_600_000,
        volumePending: 52_100_000,
        volumeActive: 47_200_000,
        gciClosed: 2_658_000,
        gciPending: 1_563_000,
        closings: 173,
      },
      {
        office: "Roberts-Howard Realty",
        team: "East Cobb",
        volumeClosed: 166_048_000,
        volumePending: 164_950_000,
        volumeActive: 168_600_000,
        gciClosed: 4_981_440,
        gciPending: 4_948_500,
        closings: 325,
      },
    ],
  },
  closingsTrend: [
    { label: "Jul", value: 1935, displayValue: "1935" },
    { label: "Aug", value: 1873, displayValue: "1873" },
    { label: "Sep", value: 1890, displayValue: "1890" },
    { label: "Oct", value: 1913, displayValue: "1913" },
    { label: "Nov", value: 1845, displayValue: "1845" },
    { label: "Dec", value: 1854, displayValue: "1854" },
  ],
  agentStatusBreakdown: [
    { label: "Top Performer", value: 100, color: color("state.success.DEFAULT") },
    { label: "Healthy", value: 356, color: color("chart.1") },
    { label: "At Risk", value: 44, color: color("state.danger.DEFAULT") },
  ],
  // Ratios from GET /api/v1/brokerage/analytics/type stub; scaled to openTransactions (2455).
  propertyClassBreakdown: [
    { label: "Residential", value: 2165 },
    { label: "Commercial", value: 290 },
  ],
  transactionSideBreakdown: [
    { label: "Buyer side", value: 1432 },
    { label: "Seller side", value: 955 },
    { label: "Both", value: 68 },
  ],
};

export type BrokerageAnalyticsFixture = typeof BROKERAGE_ANALYTICS_FIXTURE;
