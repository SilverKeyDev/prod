/**
 * Built-in campaign category seeds (emails, weekly series).
 *
 * Attach baselines / posts from shared ANCILLARY_ATTACH_BENCHMARKS
 * (industry avg → industry high). HOI / MoveConcierge / fall-off stay modeled.
 */
import { FALL_OFF_KEEP_BENCHMARK } from "packages/features/brokerage/utils/ancillaryAttachBenchmarks";
import { ANCILLARY_FEES } from "packages/features/brokerage/utils/ancillaryFees";
import {
  attachHighFor,
  attachRateFor,
  buildControlSampleEmail,
  BUILTIN_CAMPAIGN_SETTINGS,
  type CategoryCampaign,
  type CategoryCampaignSeed,
  feeFor,
  sampleEmail,
  variantWeeklyPerformance,
  weeklyPerformance,
} from "packages/features/brokerage/utils/campaigns/campaignFixtureBuilders";

const TITLE_BASELINE = attachRateFor("title");
const LENDING_BASELINE = attachRateFor("lending");
const WARRANTY_BASELINE = attachRateFor("home_warranty");

/** Reachable industry-high posts from shared attach benchmarks. */
const TITLE_POST = attachHighFor("title");
const LENDING_POST = attachHighFor("lending");
const WARRANTY_POST = attachHighFor("home_warranty");
/** Modeled demo post — SilverKey establishes the MoveConcierge benchmark. */
const MOVE_POST = 9;
/** Modeled demo — no published homeowners-insurance attach rate. */
const HOI_BASELINE = 8;
const HOI_POST = 11;
/** Demo keep-rate from shared FALL_OFF_KEEP_BENCHMARK (not ancillary attach). */
const FALL_OFF_BASELINE = FALL_OFF_KEEP_BENCHMARK.current;
const FALL_OFF_POST = FALL_OFF_KEEP_BENCHMARK.industryHigh;

/** Lifecycle email funnel counts (open ~30–40%, click ~3–7%, attach/sent ~2–6%). */
function lifecycleFunnel(
  sent: number,
  openPct: number,
  clickPct: number,
  attachPct: number
): { sent: number; opened: number; clicked: number; attached: number } {
  return {
    sent,
    opened: Math.round((sent * openPct) / 100),
    clicked: Math.round((sent * clickPct) / 100),
    attached: Math.round((sent * attachPct) / 100),
  };
}

const CAMPAIGN_CATEGORIES_SEED: CategoryCampaignSeed[] = [
  {
    id: "title_insurance",
    label: "Title Insurance",
    dashboard_service: "title",
    baseline_attach_rate_percent: TITLE_BASELINE,
    post_attach_rate_percent: TITLE_POST,
    fee_assumption: feeFor("title"),
    emails: [
      sampleEmail({
        id: "title-email-a",
        variant_key: "A",
        subject: "Keep title in-house",
        preview_body: "Book a title desk intro this week.",
        intro: "Your in-house title attach is trailing preferred partners on open files.",
        body_paragraphs: [
          "Book a 15-minute title desk intro this week and forward the calendar link to buyers still pre-contract.",
          "Agents who schedule early keep more closings on the brokerage panel.",
        ],
        cta_label: "Book title intro",
        funnel: lifecycleFunnel(500, 32, 3.5, 3),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          TITLE_BASELINE,
          TITLE_POST - 2,
          30,
          36,
          2.8,
          4.5,
          0
        ),
      }),
      sampleEmail({
        id: "title-email-b",
        variant_key: "B",
        subject: "Title gap: +4 pp early",
        preview_body: "Forward this intro before inspection.",
        intro: "Teams that introduce title before inspection close a 4 pp higher attach rate.",
        body_paragraphs: [
          "Forward this short intro before the inspection window opens so the buyer already has a desk contact.",
          "One forward beats another reminder email later in the file.",
        ],
        cta_label: "Forward title intro",
        funnel: lifecycleFunnel(500, 40, 6, 5),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(TITLE_BASELINE, TITLE_POST, 30, 40, 3, 6.5, 1),
      }),
      sampleEmail({
        id: "title-email-c",
        variant_key: "C",
        subject: "Title checklist for under-contract",
        preview_body: "Run the UC checklist before disclosure day.",
        intro: "Under-contract files stall when title paperwork waits on the buyer.",
        body_paragraphs: [
          "Use this checklist before disclosure day: order, escrow contacts, and panel preference.",
          "Reply with the booking link once the buyer confirms the intro.",
        ],
        cta_label: "Open title checklist",
        funnel: lifecycleFunnel(500, 35, 4.5, 3.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          TITLE_BASELINE,
          TITLE_POST - 1,
          30,
          38,
          2.9,
          5.2,
          2
        ),
      }),
      sampleEmail({
        id: "title-email-d",
        variant_key: "D",
        subject: "Same-day title desk reply",
        preview_body: "Promise a desk reply within one business day.",
        intro: "Speed wins: promise a same-business-day reply from the title desk.",
        body_paragraphs: [
          "Share the desk phone and calendar link in one message so agents do not chase two threads.",
        ],
        cta_label: "Share desk contact",
        funnel: lifecycleFunnel(500, 33, 4, 3.4),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          TITLE_BASELINE,
          TITLE_POST - 1.5,
          30,
          37,
          2.8,
          4.8,
          3
        ),
      }),
    ],
    performance_weekly: weeklyPerformance(TITLE_BASELINE, TITLE_POST, 30, 40),
  },
  {
    id: "mortgage",
    label: "Mortgage",
    dashboard_service: "lending",
    baseline_attach_rate_percent: LENDING_BASELINE,
    post_attach_rate_percent: LENDING_POST,
    fee_assumption: feeFor("lending"),
    emails: [
      sampleEmail({
        id: "mortgage-email-a",
        variant_key: "A",
        subject: "Preferred lender intro",
        preview_body: "Book the lender huddle before offer day.",
        intro: "Buyers who meet the preferred lender before offer day attach more often.",
        body_paragraphs: [
          "Book a short lender huddle this week for every buyer still shopping rate shops alone.",
        ],
        cta_label: "Book lender huddle",
        funnel: lifecycleFunnel(417, 31, 3.2, 2.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          LENDING_BASELINE,
          LENDING_POST - 1.5,
          29,
          35,
          2.6,
          4.2,
          0
        ),
      }),
      sampleEmail({
        id: "mortgage-email-b",
        variant_key: "B",
        subject: "Pre-approval before open houses",
        preview_body: "Get the pre-approval letter before the first tour.",
        intro: "Files with a pre-approval before the first open house convert cleaner.",
        body_paragraphs: [
          "Forward the preferred lender intake so the letter lands before weekend showings.",
        ],
        cta_label: "Send lender intake",
        funnel: lifecycleFunnel(417, 41, 6.2, 4.8),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(
          LENDING_BASELINE,
          LENDING_POST,
          29,
          41,
          3,
          6.2,
          1
        ),
      }),
      sampleEmail({
        id: "mortgage-email-c",
        variant_key: "C",
        subject: "Rate-shop checklist",
        preview_body: "Share what to compare beyond rate.",
        intro: "Buyers stall when they only compare rate and miss closing-cost math.",
        body_paragraphs: [
          "Share this checklist so the preferred lender conversation starts with full landed cost.",
        ],
        cta_label: "Share rate checklist",
        funnel: lifecycleFunnel(417, 34, 4.3, 3.5),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          LENDING_BASELINE,
          LENDING_POST - 1,
          29,
          37,
          2.8,
          5,
          2
        ),
      }),
      sampleEmail({
        id: "mortgage-email-d",
        variant_key: "D",
        subject: "Lender FAQ for first-time buyers",
        preview_body: "Send the FAQ before the first consult.",
        intro: "First-time buyers stall when lender questions pile up mid-tour.",
        body_paragraphs: [
          "Send this FAQ before the first consult so the huddle starts with decisions, not vocabulary.",
        ],
        cta_label: "Send lender FAQ",
        funnel: lifecycleFunnel(417, 32, 3.8, 3.1),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          LENDING_BASELINE,
          LENDING_POST - 1.5,
          29,
          36,
          2.7,
          4.5,
          3
        ),
      }),
    ],
    performance_weekly: weeklyPerformance(LENDING_BASELINE, LENDING_POST, 29, 41),
  },
  {
    id: "homeowners_insurance",
    label: "Homeowners Insurance",
    /** Modeled bottoms-up rates — no published per-transaction attach benchmark. */
    baseline_attach_rate_percent: HOI_BASELINE,
    post_attach_rate_percent: HOI_POST,
    fee_assumption: ANCILLARY_FEES.homeowners_insurance,
    emails: [
      sampleEmail({
        id: "hoi-email-a",
        variant_key: "A",
        subject: "Bind coverage early",
        preview_body: "Send the checklist with the contract.",
        intro: "Binder delays still stall closings when shopping starts too late.",
        body_paragraphs: [
          "Send the coverage checklist with the contract so shopping starts on day one.",
        ],
        cta_label: "Send coverage checklist",
        funnel: lifecycleFunnel(375, 31, 3.2, 2.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          HOI_BASELINE,
          HOI_POST - 1.5,
          30,
          36,
          2.6,
          4.2,
          0
        ),
      }),
      sampleEmail({
        id: "hoi-email-b",
        variant_key: "B",
        subject: "Binder delays stall closings",
        preview_body: "Nudge shopping at underwriting kickoff.",
        intro:
          "Files that shop coverage at underwriting kickoff avoid binder delays at clear-to-close.",
        body_paragraphs: [
          "Nudge shopping the moment UW opens so the binder is not the last open item.",
        ],
        cta_label: "Start coverage shopping",
        funnel: lifecycleFunnel(375, 39, 5.8, 4.5),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(HOI_BASELINE, HOI_POST, 30, 39, 3, 5.8, 1),
      }),
      sampleEmail({
        id: "hoi-email-c",
        variant_key: "C",
        subject: "Insurance quote in 24 hours",
        preview_body: "Promise a same-day quote turnaround.",
        intro: "Agents convert when you promise a quote within 24 hours of the ask.",
        body_paragraphs: [
          "Share the partner intake link and set the expectation for a same-day reply.",
        ],
        cta_label: "Request same-day quote",
        funnel: lifecycleFunnel(375, 34, 4.2, 3.4),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          HOI_BASELINE,
          HOI_POST - 1,
          30,
          37,
          2.8,
          4.8,
          2
        ),
      }),
    ],
    performance_weekly: weeklyPerformance(HOI_BASELINE, HOI_POST, 30, 39),
  },
  {
    id: "home_warranty",
    label: "Home Warranty",
    dashboard_service: "home_warranty",
    baseline_attach_rate_percent: WARRANTY_BASELINE,
    post_attach_rate_percent: WARRANTY_POST,
    fee_assumption: feeFor("home_warranty"),
    emails: [
      sampleEmail({
        id: "warranty-email-a",
        variant_key: "A",
        subject: "Add warranty pre-offer",
        preview_body: "Mention coverage on the next strategy call.",
        intro: "Warranty attach rises when coverage is part of the pre-offer strategy call.",
        body_paragraphs: ["Mention coverage on the next strategy call before the offer goes out."],
        cta_label: "Add warranty to call",
        funnel: lifecycleFunnel(333, 31, 3.2, 2.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          WARRANTY_BASELINE,
          WARRANTY_POST - 1.5,
          30,
          36,
          2.6,
          4.2,
          0
        ),
      }),
      sampleEmail({
        id: "warranty-email-b",
        variant_key: "B",
        subject: "Warranty attach: close the gap",
        preview_body: "Use this 2-sentence pre-offer script.",
        intro: "A two-sentence script beats a vague warranty nudge.",
        body_paragraphs: [
          "Use this script on the pre-offer call, then drop the enrollment link in the same thread.",
        ],
        cta_label: "Copy warranty script",
        funnel: lifecycleFunnel(333, 40, 6, 4.8),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(
          WARRANTY_BASELINE,
          WARRANTY_POST,
          30,
          40,
          3,
          6,
          1
        ),
      }),
      sampleEmail({
        id: "warranty-email-c",
        variant_key: "C",
        subject: "Seller credit vs warranty",
        preview_body: "Compare a seller credit to a warranty quote.",
        intro: "Buyers often choose warranty when you show the credit comparison side by side.",
        body_paragraphs: [
          "Share the one-pager that compares a seller credit to the warranty quote on the same file.",
        ],
        cta_label: "Open comparison sheet",
        funnel: lifecycleFunnel(333, 34, 4.3, 3.5),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          WARRANTY_BASELINE,
          WARRANTY_POST - 1,
          30,
          37,
          2.8,
          5,
          2
        ),
      }),
    ],
    performance_weekly: weeklyPerformance(WARRANTY_BASELINE, WARRANTY_POST, 30, 40),
  },
  {
    id: "move_concierge",
    label: "MoveConcierge",
    /** Modeled demo — no published per-transaction attach rate; SilverKey creates the benchmark. */
    baseline_attach_rate_percent: 6,
    post_attach_rate_percent: MOVE_POST,
    fee_assumption: ANCILLARY_FEES.move_concierge,
    emails: [
      sampleEmail({
        id: "mc-email-a",
        variant_key: "A",
        subject: "MoveConcierge closing gift",
        preview_body: "Forward the partner intro after contract.",
        intro: "Treat MoveConcierge as the closing gift, not an afterthought.",
        body_paragraphs: ["Forward the partner intro the day the contract is signed."],
        cta_label: "Forward partner intro",
        funnel: lifecycleFunnel(292, 31, 3.2, 2.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(6, MOVE_POST - 1.5, 30, 36, 2.6, 4.2, 0),
      }),
      sampleEmail({
        id: "mc-email-b",
        variant_key: "B",
        subject: "Book MoveConcierge in 2 clicks",
        preview_body: "Drop the booking link in your congrats text.",
        intro: "Two-click booking in the congrats text raises attach without another email.",
        body_paragraphs: [
          "Drop the booking link in your congrats text the same day you go under contract.",
        ],
        cta_label: "Copy booking link",
        funnel: lifecycleFunnel(292, 40, 6, 4.8),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(6, MOVE_POST, 30, 40, 3, 6, 1),
      }),
      sampleEmail({
        id: "mc-email-c",
        variant_key: "C",
        subject: "Move day timeline for buyers",
        preview_body: "Share the 14-day move timeline.",
        intro: "Buyers book when they see a clear 14-day move timeline.",
        body_paragraphs: [
          "Share the timeline PDF and the booking link together so the next step is obvious.",
        ],
        cta_label: "Share move timeline",
        funnel: lifecycleFunnel(292, 34, 4.2, 3.4),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(6, MOVE_POST - 1, 30, 37, 2.8, 4.8, 2),
      }),
    ],
    performance_weekly: weeklyPerformance(6, MOVE_POST, 30, 40),
  },
  {
    id: "transaction_fall_off",
    label: "Transaction Fall-Off",
    /** Demo keep-rate: 72% → 76% (+4 pp). Not measured campaign results. */
    baseline_attach_rate_percent: FALL_OFF_BASELINE,
    post_attach_rate_percent: FALL_OFF_POST,
    /** Assumed brokerage share of GCI on a saved closing (not a referral fee). */
    fee_assumption: FALL_OFF_KEEP_BENCHMARK.fee,
    emails: [
      sampleEmail({
        id: "falloff-email-a",
        variant_key: "A",
        subject: "Forms still outstanding",
        preview_body: "Please send the missing packet when you can.",
        intro: "Open packets still put this file at risk of fall-off.",
        body_paragraphs: [
          "Please send the missing contingency and loan condition forms as soon as you can.",
        ],
        cta_label: "Upload missing forms",
        funnel: lifecycleFunnel(458, 32, 3.5, 3),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          FALL_OFF_BASELINE,
          FALL_OFF_POST - 2,
          30,
          36,
          2.8,
          4.5,
          0
        ),
      }),
      sampleEmail({
        id: "falloff-email-b",
        variant_key: "B",
        subject: "48-hour form SLA: protect keep-rate",
        preview_body:
          "Submit contingency and loan condition forms within 48 hours to keep this deal on track.",
        intro: "Files that miss the 48-hour form SLA see higher fall-off odds.",
        body_paragraphs: [
          "Submit contingency and loan condition forms within 48 hours to keep this deal on track.",
          "Reply once the packet is in so ops can clear the risk flag.",
        ],
        cta_label: "Submit forms now",
        funnel: lifecycleFunnel(458, 40, 6.2, 5),
        is_winner: true,
        performance_weekly: variantWeeklyPerformance(
          FALL_OFF_BASELINE,
          FALL_OFF_POST,
          30,
          40,
          3,
          6.2,
          1
        ),
      }),
      sampleEmail({
        id: "falloff-email-c",
        variant_key: "C",
        subject: "Inspection forms due tomorrow",
        preview_body: "Inspection responses are due in 24 hours.",
        intro: "Inspection responses due tomorrow are the top fall-off trigger this week.",
        body_paragraphs: [
          "Confirm the response packet lands before end of day tomorrow to protect the timeline.",
        ],
        cta_label: "Confirm inspection packet",
        funnel: lifecycleFunnel(458, 35, 4.5, 3.8),
        is_winner: false,
        performance_weekly: variantWeeklyPerformance(
          FALL_OFF_BASELINE,
          FALL_OFF_POST - 1,
          30,
          37,
          2.9,
          5.2,
          2
        ),
      }),
    ],
    performance_weekly: weeklyPerformance(FALL_OFF_BASELINE, FALL_OFF_POST, 30, 40),
  },
];

/** Built-in categories with Control holdout appended last (opt-out by default). */
export const CAMPAIGN_CATEGORIES_FIXTURE: CategoryCampaign[] = CAMPAIGN_CATEGORIES_SEED.map(
  (category) => ({
    ...BUILTIN_CAMPAIGN_SETTINGS,
    ...category,
    defaultAgentTypes: [...BUILTIN_CAMPAIGN_SETTINGS.defaultAgentTypes],
    emails: [
      ...category.emails,
      buildControlSampleEmail(category.id, category.baseline_attach_rate_percent ?? 0),
    ],
  })
);
