import type { LandingContent } from "packages/features/homeauth/types/landingContent";
import { ROUTES } from "packages/navigation";

import { LANDING_SECTION_IDS, landingHashHref } from "./landingSectionIds";

/** Single source for public landing copy. */
export const LANDING_CONTENT: LandingContent = {
  nav: {
    landmarkLabel: "SilverKey",
    loginLabel: "Log in",
    signUpLabel: "Sign up",
    bookDemoLabel: "Book a demo",
    links: [
      { label: "Platform", href: landingHashHref(LANDING_SECTION_IDS.info) },
      { label: "ROI", href: landingHashHref(LANDING_SECTION_IDS.savings) },
      { label: "Pricing", href: landingHashHref(LANDING_SECTION_IDS.pricing) },
      { label: "FAQ", href: landingHashHref(LANDING_SECTION_IDS.faq) },
    ],
  },
  hero: {
    headlineWords: ["The", "intelligence", "layer", "for", "every", "transaction."],
    italicWordIndex: 1,
    subheadline:
      "SilverKey turns your brokerage's transaction data into coaching, support, and growth so every agent performs at their best, layered on top of the transaction tools you already run.",
    primaryCtaLabel: "Book a demo →",
    signUpCtaLabel: "Sign up",
    trustLine: "No commitment required. Setup in under a week.",
  },
  demo: {
    windowTitle: "SilverKey, Brokerage Overview, Q2 2026",
    syncCaption: "Synced from your transaction management system",
    stats: [
      { id: "dc1", label: "Closed this quarter", value: "247", sub: "transactions" },
      {
        id: "dc2",
        label: "Coaching opportunities",
        value: "12",
        sub: "agents with growth signals",
      },
      { id: "dc3", label: "Avg. days to close", value: "28.4", sub: "days / transaction" },
      { id: "dc4", label: "Agent retention", value: "94%", sub: "12-month rolling" },
    ],
    queueHeading: "Growth coaching queue",
    queueItems: [
      { name: "Marcus T.", opportunity: "Volume up 34%, team lead candidate" },
      { name: "Priya M.", opportunity: "3 stalled contracts, needs guidance" },
      { name: "Carlos W.", opportunity: "Top performer, ready for recognition" },
    ],
    trendHeading: "Transaction trend, 6 months",
    trendValues: [34, 41, 38, 52, 47, 58],
    trendMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  },
  partners: {
    eyebrow: "Built to fit your stack",
    subheadline:
      "SilverKey layers onto the systems your brokerage already runs. Here is what powers it today.",
    items: [
      {
        id: "tms-compatible",
        title: "Works with your transaction management platform",
        badge: "Compatible",
        sub: "SilverKey reads roster and transaction data from the system you already use, so nothing about your compliance workflow changes.",
      },
      {
        id: "move-concierge",
        title: "Move Concierge",
        logoKey: "move-concierge",
        badge: "Live integration",
        sub: "Move management partner. Revenue share signed, integration live.",
      },
      {
        id: "ga-agent",
        title: "Georgia Agent",
        logoKey: "ga-agent",
        badge: "Founder credential",
        sub: "Built by a licensed Georgia real estate agent, so every feature reflects how deals actually close.",
      },
    ],
  },
  info: {
    eyebrow: "The platform",
    headlineBefore: "Data that ",
    headlineAccent: "coaches.",
    headlineAfter: " Insights that stick.",
    subheadline:
      "SilverKey analyzes production and pipeline data continuously, surfacing what matters before it becomes a problem.",
    cardsCaption: "Illustrative outputs based on roster modeling.",
    cards: [
      {
        icon: "bar-chart-2",
        statTarget: 12,
        statSuffix: "",
        statDelayMs: 200,
        title: "Coaching opportunities surfaced",
        body: "SilverKey reads deal velocity, pipeline depth, and closing trends to show you exactly which agents would benefit from a conversation this week.",
        animDirection: "left",
      },
      {
        icon: "heart",
        statTarget: 23,
        statSuffix: "",
        statDelayMs: 300,
        title: "Retention signals caught early",
        body: "Growth and flight risk show up in the data before they show up in a resignation. SilverKey surfaces both so you can act while it still matters.",
        animDirection: "up",
      },
      {
        icon: "file-signature",
        statTarget: 3,
        statSuffix: "",
        statDelayMs: 400,
        title: "Bottlenecks surfaced across your portfolio",
        body: "Spot recurring sticking points across your transactions so leadership can fix pace for the whole brokerage, not one deal at a time.",
        animDirection: "right",
      },
    ],
  },
  savings: {
    eyebrow: "Growth calculator",
    headline: "See what better coaching unlocks for your brokerage.",
    panelHeading: "Tell us about your brokerage",
    sliders: [
      {
        id: "sl-agents",
        label: "Agents on roster",
        min: 5,
        max: 200,
        step: 1,
        defaultValue: 35,
      },
      {
        id: "sl-gci",
        label: "Avg. GCI per agent / yr",
        min: 30000,
        max: 300000,
        step: 5000,
        defaultValue: 85000,
      },
      {
        id: "sl-growth",
        label: "Agents with untapped growth potential",
        min: 5,
        max: 60,
        step: 1,
        defaultValue: 30,
      },
    ],
    resultHeading: "Additional GCI opportunity",
    resultSub: "unlockable with better coaching this year",
    resultCtaLabel: "See how to get there →",
    breakdownLabels: {
      agentsReady: "Agents ready to grow",
      upliftPerAgent: "Est. GCI uplift per agent",
      totalUpside: "Total brokerage upside",
    },
  },
  pricing: {
    eyebrow: "Pricing",
    cardEyebrow: "Built for brokerages",
    headlineBefore: "Simple, ",
    headlineAccent: "honest",
    headlineAfter: " pricing.",
    subheadline:
      "One monthly price per brokerage, scaled to roster size. The number lives in the walkthrough because it belongs in a conversation.",
    priceLabel: "Custom",
    highlights: [
      "Full roster overview and coaching signals",
      "Integrations with your existing transaction stack",
      "Onboarding support sized to your team",
    ],
    supportingLine: "Pricing scales with roster size. We'll walk through it live.",
    ctaLabel: "Book a demo →",
  },
  faq: {
    eyebrow: "FAQ",
    headline: "Questions brokers actually ask.",
    items: [
      {
        question: "Does SilverKey replace our transaction management platform?",
        answer:
          "No. SilverKey sits on top of the transaction tools you already run. Your system of record stays exactly where it is. We read the production and pipeline data and turn it into coaching and growth signals.",
      },
      {
        question: "What does SilverKey actually do?",
        answer:
          "It reads deal velocity, pipeline depth, and closing trends across your roster, then surfaces which agents need a conversation this week, who is ready to grow, and where deals are stalling. Leadership gets a clear picture without digging through reports.",
      },
      {
        question: "How does SilverKey make money?",
        answer:
          "One monthly platform fee per brokerage, scaled to roster size. Ancillary partners such as mortgage, title, insurance, and moving pay for placement and data services, and your brokerage takes a cut. These are placement and data fees, not referral fees.",
      },
      {
        question: "Who controls which partners my agents see?",
        answer:
          "You do. SilverKey is independent and does not own any mortgage, title, or insurance business, so partner placement reflects your agents' interests, not ours. You set what appears and how.",
      },
      {
        question: "How long does setup take?",
        answer:
          "Under a week, with onboarding sized to your team. No long-term commitment to get started.",
      },
      {
        question: "Who built this?",
        answer:
          "A licensed Georgia real estate agent and a full engineering team, so the product reflects how deals actually close.",
      },
    ],
  },
  finalCta: {
    headlineBefore: "Turn transaction data into ",
    headlineAccent: "agent growth.",
    headlineAfter: "",
    subheadline: "Give your team the coaching and support they need to close more deals.",
    primaryCtaLabel: "Book a demo →",
    footnote: "Responds in under 5 minutes. Atlanta, GA. No pressure, no pitch deck.",
  },
  footer: {
    location: "Atlanta, Georgia",
    copyright: "© 2026 SilverKey. All rights reserved.",
    disclaimer:
      "Platform fees are charged for partner placement and data services, not referral fees.",
    socialLinks: [
      { href: "https://linkedin.com/company/silverkey", label: "LinkedIn", icon: "linkedin" },
      { href: "https://twitter.com/usesilverkey", label: "X / Twitter", icon: "x" },
      { href: "https://instagram.com/usesilverkey", label: "Instagram", icon: "instagram" },
    ],
    legalLinks: [
      { label: "Contact", href: ROUTES.CONTACT },
      { label: "Privacy", href: ROUTES.PRIVACY },
      { label: "Terms", href: ROUTES.TERMS },
    ],
  },
};
