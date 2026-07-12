/**
 * Demo campaign fixtures. Category baselines/fees come from dashboard ancillary
 * data where categories overlap. Emails, weekly lift series, and insights are
 * campaign-owned.
 */
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import { BROKERAGE_ANCILLARY_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

export type DashboardServiceKey = "title" | "lending" | "home_warranty";

export type CampaignCategoryId =
  | "title_insurance"
  | "mortgage"
  | "homeowners_insurance"
  | "home_warranty"
  | "move_concierge";

export type SampleEmail = {
  id: string;
  variant_key: string;
  subject: string;
  preview_body: string;
  funnel: { sent: number; opened: number; clicked: number; attached: number };
  is_winner: boolean;
  /** Optional Calendly / booking URL for the variant. */
  booking_link?: string;
};

export type CategoryCampaign = {
  id: CampaignCategoryId;
  label: string;
  /** Set when this category maps to Leakage / ancillary fixture */
  dashboard_service?: DashboardServiceKey;
  baseline_attach_rate_percent: number | null;
  post_attach_rate_percent: number | null;
  fee_assumption: number | null;
  emails: SampleEmail[];
  performance_weekly: Array<{
    week: number;
    open_rate_percent: number;
    attach_rate_percent: number;
  }>;
  insights: {
    what_worked: string[];
    why_guesses: string[];
  };
};

function attachRateFor(service: DashboardServiceKey): number {
  const row = BROKERAGE_ANCILLARY_FIXTURE.by_service.find((s) => s.service === service);
  if (!row) {
    throw new Error(`Missing ancillary fixture row for ${service}`);
  }
  return row.attach_rate_percent;
}

function feeFor(service: DashboardServiceKey): number {
  return ANCILLARY_FEES[service];
}

function weeklyPerformance(
  baselineAttach: number,
  postAttach: number,
  baselineOpen: number,
  postOpen: number
): CategoryCampaign["performance_weekly"] {
  const points: CategoryCampaign["performance_weekly"] = [];
  for (let week = 1; week <= 8; week++) {
    const t = (week - 1) / 7;
    points.push({
      week,
      open_rate_percent: Math.round((baselineOpen + (postOpen - baselineOpen) * t) * 100) / 100,
      attach_rate_percent:
        Math.round((baselineAttach + (postAttach - baselineAttach) * t) * 100) / 100,
    });
  }
  return points;
}

const TITLE_BASELINE = attachRateFor("title");
const LENDING_BASELINE = attachRateFor("lending");
const WARRANTY_BASELINE = attachRateFor("home_warranty");

const TITLE_POST = 66;
const LENDING_POST = 48;
const WARRANTY_POST = 51.5;

export const CAMPAIGN_CATEGORIES_FIXTURE: CategoryCampaign[] = [
  {
    id: "title_insurance",
    label: "Title Insurance",
    dashboard_service: "title",
    baseline_attach_rate_percent: TITLE_BASELINE,
    post_attach_rate_percent: TITLE_POST,
    fee_assumption: feeFor("title"),
    emails: [
      {
        id: "title-email-a",
        variant_key: "A",
        subject: "Keep title in-house",
        preview_body: "Book a title desk intro this week.",
        funnel: { sent: 120, opened: 48, clicked: 14, attached: 22 },
        is_winner: false,
      },
      {
        id: "title-email-b",
        variant_key: "B",
        subject: "Title gap: +4 pp early",
        preview_body: "Forward this intro before inspection.",
        funnel: { sent: 120, opened: 62, clicked: 28, attached: 41 },
        is_winner: true,
      },
    ],
    performance_weekly: weeklyPerformance(TITLE_BASELINE, TITLE_POST, 40, 52),
    insights: {
      what_worked: ["Gap framing beat generic CTAs.", "Forwardable intros raised attach."],
      why_guesses: [
        `Baseline is ${TITLE_BASELINE}%. Agents needed a specific gap.`,
        "Actionable intros beat policy reminders.",
      ],
    },
  },
  {
    id: "mortgage",
    label: "Mortgage",
    dashboard_service: "lending",
    baseline_attach_rate_percent: LENDING_BASELINE,
    post_attach_rate_percent: LENDING_POST,
    fee_assumption: feeFor("lending"),
    emails: [
      {
        id: "mortgage-email-a",
        variant_key: "A",
        subject: "Preferred lender program",
        preview_body: "Share the flyer with active buyers.",
        funnel: { sent: 100, opened: 38, clicked: 11, attached: 14 },
        is_winner: false,
      },
      {
        id: "mortgage-email-b",
        variant_key: "B",
        subject: "10-minute lender huddle",
        preview_body: "Book a short desk huddle to close the gap.",
        funnel: { sent: 100, opened: 55, clicked: 24, attached: 29 },
        is_winner: true,
      },
    ],
    performance_weekly: weeklyPerformance(LENDING_BASELINE, LENDING_POST, 38, 55),
    insights: {
      what_worked: ["Personalized gaps beat reminders.", "Short huddle CTAs converted."],
      why_guesses: [
        `Lending attach is ${LENDING_BASELINE}%. Agents feel the pressure.`,
        "Time-boxed asks reduced friction.",
      ],
    },
  },
  {
    id: "homeowners_insurance",
    label: "Homeowners Insurance",
    baseline_attach_rate_percent: 41,
    post_attach_rate_percent: 47,
    fee_assumption: 200,
    emails: [
      {
        id: "hoi-email-a",
        variant_key: "A",
        subject: "Bind coverage early",
        preview_body: "Send the checklist with the contract.",
        funnel: { sent: 90, opened: 36, clicked: 9, attached: 12 },
        is_winner: false,
      },
      {
        id: "hoi-email-b",
        variant_key: "B",
        subject: "Binder delays stall closings",
        preview_body: "Nudge shopping at underwriting kickoff.",
        funnel: { sent: 90, opened: 49, clicked: 21, attached: 23 },
        is_winner: true,
      },
    ],
    performance_weekly: weeklyPerformance(41, 47, 40, 54),
    insights: {
      what_worked: ["Delay risk beat generic checklists.", "UW kickoff is a clear trigger."],
      why_guesses: [
        "Closing risk fills the missing baseline.",
        "Loan-file triggers fit agent workflow.",
      ],
    },
  },
  {
    id: "home_warranty",
    label: "Home Warranty",
    dashboard_service: "home_warranty",
    baseline_attach_rate_percent: WARRANTY_BASELINE,
    post_attach_rate_percent: WARRANTY_POST,
    fee_assumption: feeFor("home_warranty"),
    emails: [
      {
        id: "warranty-email-a",
        variant_key: "A",
        subject: "Add warranty pre-offer",
        preview_body: "Mention coverage on the next strategy call.",
        funnel: { sent: 80, opened: 32, clicked: 8, attached: 10 },
        is_winner: false,
      },
      {
        id: "warranty-email-b",
        variant_key: "B",
        subject: "Warranty attach: close the gap",
        preview_body: "Use this 2-sentence pre-offer script.",
        funnel: { sent: 80, opened: 44, clicked: 18, attached: 19 },
        is_winner: true,
      },
    ],
    performance_weekly: weeklyPerformance(WARRANTY_BASELINE, WARRANTY_POST, 40, 55),
    insights: {
      what_worked: ["Baseline-aware subjects won.", "Short scripts beat vague nudges."],
      why_guesses: [
        `Warranty attach is ${WARRANTY_BASELINE}% on Leakage.`,
        "Pre-offer timing beats post-acceptance.",
      ],
    },
  },
  {
    id: "move_concierge",
    label: "MoveConcierge",
    baseline_attach_rate_percent: 35,
    post_attach_rate_percent: 44,
    fee_assumption: 75,
    emails: [
      {
        id: "mc-email-a",
        variant_key: "A",
        subject: "MoveConcierge closing gift",
        preview_body: "Forward the partner intro after contract.",
        funnel: { sent: 70, opened: 28, clicked: 7, attached: 9 },
        is_winner: false,
      },
      {
        id: "mc-email-b",
        variant_key: "B",
        subject: "Book MoveConcierge in 2 clicks",
        preview_body: "Drop the booking link in your congrats text.",
        funnel: { sent: 70, opened: 41, clicked: 19, attached: 22 },
        is_winner: true,
      },
    ],
    performance_weekly: weeklyPerformance(35, 44, 40, 58),
    insights: {
      what_worked: ["Same-day UC timing won.", "Two-click booking raised attach."],
      why_guesses: ["Clear triggers beat fee stories.", "Celebration moments feel like help."],
    },
  },
];
