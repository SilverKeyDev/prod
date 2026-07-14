/**
 * Shared types and builders for brokerage campaign fixtures.
 */
import { ANCILLARY_ATTACH_BENCHMARKS } from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import type { CampaignAgentType } from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";

export type DashboardServiceKey = "title" | "lending" | "home_warranty";

export type BuiltInCampaignCategoryId =
  | "title_insurance"
  | "mortgage"
  | "homeowners_insurance"
  | "home_warranty"
  | "move_concierge"
  | "transaction_fall_off";

export type CampaignCategoryId = BuiltInCampaignCategoryId | `custom_${string}`;

export type CampaignStatus = "draft" | "running" | "paused" | "completed";

export type CampaignCadence = "weekly" | "biweekly" | "monthly";

export type WeeklyPerformancePoint = {
  week: number;
  open_rate_percent: number;
  attach_rate_percent: number;
};

export type VariantWeeklyPerformancePoint = WeeklyPerformancePoint & {
  click_rate_percent: number;
};

/** Reserved variant key for the no-email holdout arm. */
export const CONTROL_VARIANT_KEY = "Control";

/** Defaults applied to built-in campaign seeds. */
export const BUILTIN_CAMPAIGN_SETTINGS = {
  status: "running" as const satisfies CampaignStatus,
  cadence: "weekly" as const satisfies CampaignCadence,
  startedAt: "2026-01-01",
  defaultScheduleMode: "now" as const,
  defaultAgentTypes: ["all"] as CampaignAgentType[],
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
};

export type SampleEmail = {
  id: string;
  variant_key: string;
  subject: string;
  preview_body: string;
  /** HTML email template headline (often mirrors subject). */
  headline: string;
  intro: string;
  body_paragraphs: string[];
  cta_label: string;
  funnel: { sent: number; opened: number; clicked: number; attached: number };
  is_winner: boolean;
  /** Holdout arm: no campaign email; still plotted on variant charts. */
  is_control?: boolean;
  /** Optional Calendly / booking URL for the variant. */
  booking_link?: string;
  performance_weekly: VariantWeeklyPerformancePoint[];
};

export type CategoryCampaign = {
  id: CampaignCategoryId;
  label: string;
  description?: string;
  /** Set when this category maps to Leakage / ancillary fixture */
  dashboard_service?: DashboardServiceKey;
  status: CampaignStatus;
  cadence: CampaignCadence;
  /** ISO date (YYYY-MM-DD) for the header window chip. */
  startedAt?: string;
  defaultScheduleMode: "now" | "later";
  defaultScheduledDate?: string;
  defaultScheduledTime?: string;
  defaultAgentTypes: CampaignAgentType[];
  baseline_attach_rate_percent: number | null;
  post_attach_rate_percent: number | null;
  fee_assumption: number | null;
  emails: SampleEmail[];
  performance_weekly: WeeklyPerformancePoint[];
};

/** Seed shape before lifecycle/settings defaults are applied. */
export type CategoryCampaignSeed = Omit<
  CategoryCampaign,
  | "status"
  | "cadence"
  | "startedAt"
  | "defaultScheduleMode"
  | "defaultScheduledDate"
  | "defaultScheduledTime"
  | "defaultAgentTypes"
  | "description"
>;

/** Header window text from started date + cadence (e.g. "Started Jan 2026 · weekly cadence"). */
export function formatCampaignWindow(
  startedAt: string | undefined,
  cadence: CampaignCadence
): string {
  const cadenceLabel = cadence === "biweekly" ? "biweekly cadence" : `${cadence} cadence`;
  if (!startedAt) return cadenceLabel;
  const date = new Date(`${startedAt}T00:00:00`);
  if (Number.isNaN(date.getTime())) return cadenceLabel;
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `Started ${month} ${year} · ${cadenceLabel}`;
}

/** Map campaign status to StatusBadge variant. */
export function campaignStatusBadgeVariant(
  status: CampaignStatus
): "success" | "warning" | "info" | "default" {
  switch (status) {
    case "running":
      return "success";
    case "paused":
      return "warning";
    case "completed":
      return "info";
    case "draft":
    default:
      return "default";
  }
}

export type CampaignTemplate = {
  id: BuiltInCampaignCategoryId;
  label: string;
  blurb: string;
};

export function attachRateFor(service: DashboardServiceKey): number {
  return ANCILLARY_ATTACH_BENCHMARKS[service].industryAvg;
}

export function attachHighFor(service: DashboardServiceKey): number {
  return ANCILLARY_ATTACH_BENCHMARKS[service].industryHigh;
}

export function feeFor(service: DashboardServiceKey): number {
  return ANCILLARY_FEES[service];
}

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Deterministic pseudo-noise in [-1, 1] (stable across runs; not Math.random). */
function unitNoise(...parts: number[]): number {
  let h = 2166136261;
  for (const part of parts) {
    h ^= Math.imul(Math.trunc(part), 16777619);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
  }
  return ((h >>> 0) % 10_000) / 5_000 - 1;
}

/**
 * Linear ramp from baseline → post with fixed endpoints and mid-week jitter.
 * Amplitude is in percentage points.
 */
function jaggedRate(
  week: number,
  totalWeeks: number,
  baseline: number,
  post: number,
  amplitude: number,
  salt: number
): number {
  if (week <= 1) return roundRate(baseline);
  if (week >= totalWeeks) return roundRate(post);
  const t = (week - 1) / (totalWeeks - 1);
  const linear = baseline + (post - baseline) * t;
  const noise = unitNoise(week, salt, Math.round(baseline * 10), Math.round(post * 10)) * amplitude;
  const lo = Math.min(baseline, post) - 0.5;
  const hi = Math.max(baseline, post) + 0.5;
  return roundRate(Math.max(0, Math.min(hi, Math.max(lo, linear + noise))));
}

export function weeklyPerformance(
  baselineAttach: number,
  postAttach: number,
  baselineOpen: number,
  postOpen: number
): CategoryCampaign["performance_weekly"] {
  const points: CategoryCampaign["performance_weekly"] = [];
  const salt = Math.round(baselineAttach * 17 + postAttach * 31);
  for (let week = 1; week <= 8; week++) {
    points.push({
      week,
      open_rate_percent: jaggedRate(week, 8, baselineOpen, postOpen, 1.2, salt + 3),
      attach_rate_percent: jaggedRate(week, 8, baselineAttach, postAttach, 0.45, salt),
    });
  }
  return points;
}

/** Demo A/B/C spread: each later variant gets a small mid-ramp offset; endpoints stay pinned. */
export function variantWeeklyPerformance(
  baselineAttach: number,
  postAttach: number,
  baselineOpen: number,
  postOpen: number,
  baselineClick: number,
  postClick: number,
  variantIndex: number
): SampleEmail["performance_weekly"] {
  const points: SampleEmail["performance_weekly"] = [];
  const salt = Math.round(baselineAttach * 19 + postAttach * 23 + variantIndex * 97);
  for (let week = 1; week <= 8; week++) {
    const midBoost = week > 1 && week < 8 ? variantIndex * 0.25 : 0;
    const open = jaggedRate(week, 8, baselineOpen, postOpen, 1.2, salt + 1) + midBoost;
    let click = jaggedRate(week, 8, baselineClick, postClick, 0.45, salt + 2) + midBoost * 0.4;
    const attach = jaggedRate(week, 8, baselineAttach, postAttach, 0.45, salt) + midBoost * 0.5;
    // Keep click below open so funnel charts stay believable
    click = Math.min(click, Math.max(0, open - 0.5));
    points.push({
      week,
      open_rate_percent: roundRate(Math.max(0, open)),
      click_rate_percent: roundRate(Math.max(0, click)),
      attach_rate_percent: roundRate(Math.max(0, attach)),
    });
  }
  return points;
}

/** Near-flat baseline attach with tiny wobble; open/click stay at 0 (no email). */
export function controlWeeklyPerformance(
  baselineAttach: number
): SampleEmail["performance_weekly"] {
  const points: SampleEmail["performance_weekly"] = [];
  const salt = Math.round(baselineAttach * 41);
  for (let week = 1; week <= 8; week++) {
    points.push({
      week,
      open_rate_percent: 0,
      click_rate_percent: 0,
      attach_rate_percent: jaggedRate(week, 8, baselineAttach, baselineAttach, 0.15, salt),
    });
  }
  return points;
}

type SampleEmailSeed = {
  id: string;
  variant_key: string;
  subject: string;
  preview_body: string;
  headline?: string;
  intro: string;
  body_paragraphs?: string[];
  cta_label?: string;
  funnel: SampleEmail["funnel"];
  is_winner: boolean;
  is_control?: boolean;
  booking_link?: string;
  performance_weekly: SampleEmail["performance_weekly"];
};

export function sampleEmail(seed: SampleEmailSeed): SampleEmail {
  return {
    id: seed.id,
    variant_key: seed.variant_key,
    subject: seed.subject,
    preview_body: seed.preview_body,
    headline: seed.headline ?? seed.subject,
    intro: seed.intro,
    body_paragraphs: seed.body_paragraphs ?? [],
    cta_label: seed.cta_label ?? "Book intro",
    funnel: seed.funnel,
    is_winner: seed.is_winner,
    is_control: seed.is_control,
    booking_link: seed.booking_link,
    performance_weekly: seed.performance_weekly,
  };
}

/** Build the opt-out holdout variant for a campaign category. */
export function buildControlSampleEmail(
  categoryId: CampaignCategoryId | string,
  baselineAttach: number,
  options?: { attached?: number }
): SampleEmail {
  return sampleEmail({
    id: `${categoryId}-email-control`,
    variant_key: CONTROL_VARIANT_KEY,
    subject: "Control group (no email)",
    preview_body: "This arm receives no campaign email.",
    headline: "Control group",
    intro: "Holdout agents receive no campaign email. Attach rate reflects the natural baseline.",
    body_paragraphs: [],
    cta_label: "—",
    funnel: {
      sent: 0,
      opened: 0,
      clicked: 0,
      attached: options?.attached ?? 0,
    },
    is_winner: false,
    is_control: true,
    performance_weekly: controlWeeklyPerformance(baselineAttach),
  });
}

export function isControlEmail(email: SampleEmail): boolean {
  return email.is_control === true || email.variant_key === CONTROL_VARIANT_KEY;
}

/** Split treatment variants from an optional trailing Control arm. */
export function partitionControlEmails(emails: SampleEmail[]): {
  treatments: SampleEmail[];
  control: SampleEmail | undefined;
} {
  const control = emails.find(isControlEmail);
  const treatments = emails.filter((email) => !isControlEmail(email));
  return { treatments, control };
}

/** Split a freeform body into intro + remaining paragraphs for the HTML template. */
export function bodyFieldsFromPreview(previewBody: string): {
  intro: string;
  body_paragraphs: string[];
} {
  const trimmed = previewBody.trim();
  if (!trimmed) {
    return { intro: "", body_paragraphs: [] };
  }
  const parts = trimmed
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return { intro: trimmed, body_paragraphs: [] };
  }
  return {
    intro: parts[0]!,
    body_paragraphs: parts.slice(1),
  };
}
