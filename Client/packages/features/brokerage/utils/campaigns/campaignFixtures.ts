/**
 * Demo campaign fixtures public API.
 */
import { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignCategorySeeds";
import {
  buildControlSampleEmail,
  type BuiltInCampaignCategoryId,
  type CampaignTemplate,
  type CategoryCampaign,
  weeklyPerformance,
} from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";

export { CAMPAIGN_CATEGORIES_FIXTURE } from "packages/features/brokerage/utils/campaigns/campaignCategorySeeds";
export {
  attachHighFor,
  attachRateFor,
  bodyFieldsFromPreview,
  buildControlSampleEmail,
  BUILTIN_CAMPAIGN_SETTINGS,
  type BuiltInCampaignCategoryId,
  CAMPAIGN_STATUS_LABELS,
  type CampaignCadence,
  type CampaignCategoryId,
  type CampaignStatus,
  campaignStatusBadgeVariant,
  type CampaignTemplate,
  type CategoryCampaign,
  type CategoryCampaignSeed,
  CONTROL_VARIANT_KEY,
  controlWeeklyPerformance,
  type DashboardServiceKey,
  feeFor,
  formatCampaignWindow,
  isControlEmail,
  partitionControlEmails,
  type SampleEmail,
  sampleEmail,
  variantWeeklyPerformance,
  type VariantWeeklyPerformancePoint,
  weeklyPerformance,
  type WeeklyPerformancePoint,
} from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "transaction_fall_off",
    label: "Transaction Fall-Off",
    blurb: "Predict fall-off risk and send timed form reminders to protect keep-rate.",
  },
  {
    id: "title_insurance",
    label: "Title Insurance",
    blurb: "Close the in-house title attach gap with forwardable intros.",
  },
  {
    id: "mortgage",
    label: "Mortgage",
    blurb: "Lift preferred-lender attach with short desk huddles.",
  },
  {
    id: "homeowners_insurance",
    label: "Homeowners Insurance",
    blurb: "Nudge binders early so coverage delays do not stall closings.",
  },
  {
    id: "home_warranty",
    label: "Home Warranty",
    blurb: "Raise pre-offer warranty attach with short scripts.",
  },
  {
    id: "move_concierge",
    label: "MoveConcierge",
    blurb: "Book MoveConcierge at under-contract with a two-click link.",
  },
];

export function cloneCategoryCampaign(category: CategoryCampaign): CategoryCampaign {
  return {
    ...category,
    defaultAgentTypes: [...category.defaultAgentTypes],
    emails: category.emails.map((email) => ({
      ...email,
      funnel: { ...email.funnel },
      body_paragraphs: [...email.body_paragraphs],
      performance_weekly: email.performance_weekly.map((p) => ({ ...p })),
    })),
    performance_weekly: category.performance_weekly.map((p) => ({ ...p })),
  };
}

export function getCampaignTemplateSeed(id: BuiltInCampaignCategoryId): CategoryCampaign {
  const found = CAMPAIGN_CATEGORIES_FIXTURE.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Missing campaign template seed for ${id}`);
  }
  return cloneCategoryCampaign(found);
}

export function buildCustomCampaignCategory(name: string, description?: string): CategoryCampaign {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "campaign";
  const id = `custom_${slug}_${Date.now()}` as `custom_${string}`;
  const trimmedDescription = description?.trim();
  return {
    id,
    label: name.trim(),
    description: trimmedDescription || undefined,
    status: "draft",
    cadence: "weekly",
    defaultScheduleMode: "now",
    defaultAgentTypes: ["all"],
    baseline_attach_rate_percent: null,
    post_attach_rate_percent: null,
    fee_assumption: null,
    emails: [buildControlSampleEmail(id, 0)],
    performance_weekly: weeklyPerformance(0, 0, 0, 0),
  };
}
