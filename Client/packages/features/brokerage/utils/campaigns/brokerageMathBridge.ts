/**
 * Shared Leakage ↔ Campaigns bridge numbers for math strips.
 */
import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import { fallOffOpportunityDollars } from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { YEAR_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { buildCampaignRevenueProjections } from "packages/features/brokerage/utils/campaigns/campaignRevenueProjections";

/**
 * Year opportunity-to-high = attach services + fall-off keep-rate gap
 * (matches Leakage quant strip hero, not by_service charts alone).
 */
export function demoYearLeakageDollars(): number {
  const attach = buildAncillaryData("year").summary.total_leakage_dollars;
  return attach + fallOffOpportunityDollars(YEAR_TRANSACTIONS);
}

/** Full seeded campaign portfolio recovery at Kaggle year closings. */
export function demoCampaignYearRecoveryDollars(): number {
  return buildCampaignRevenueProjections(CAMPAIGN_CATEGORIES_FIXTURE, YEAR_TRANSACTIONS)
    .totalProjectedDollars;
}

/** Campaign lifts that map to Leakage opportunity (attach + fall-off). */
const LEAKAGE_ALIGNED_CATEGORY_IDS = new Set([
  "title_insurance",
  "mortgage",
  "home_warranty",
  "transaction_fall_off",
]);

/**
 * Year recovery from campaigns that address Leakage opportunity-to-high.
 * Excludes HOI / MoveConcierge so bridge % stays honest vs opportunity.
 */
export function demoCampaignLeakageAlignedRecoveryDollars(): number {
  return buildCampaignRevenueProjections(CAMPAIGN_CATEGORIES_FIXTURE, YEAR_TRANSACTIONS)
    .rows.filter((row) => LEAKAGE_ALIGNED_CATEGORY_IDS.has(row.categoryId))
    .reduce((sum, row) => sum + row.projectedDollars, 0);
}

/** Recovery as percent of addressable opportunity-to-high, one decimal place. */
export function recoveryPercentOfLeakage(recoveryDollars: number, leakageDollars: number): number {
  if (leakageDollars <= 0) return 0;
  return Math.round((recoveryDollars / leakageDollars) * 1000) / 10;
}
