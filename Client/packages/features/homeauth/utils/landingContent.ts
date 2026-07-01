import type { LandingContent } from "packages/features/homeauth/types/landingContent";
import { ROUTES } from "packages/navigation";

import { LANDING_SECTION_IDS,landingHashHref } from "./landingSectionIds";

/**
 * Single source for public landing copy — ported verbatim from PR #116.
 */
export const LANDING_CONTENT: LandingContent = {
  nav: {
    landmarkLabel: "SilverKey",
    loginLabel: "Log in",
    bookDemoLabel: "Book a demo",
    links: [
      { label: "Platform", href: landingHashHref(LANDING_SECTION_IDS.info) },
      { label: "ROI", href: landingHashHref(LANDING_SECTION_IDS.savings) },
      { label: "Pricing", href: landingHashHref(LANDING_SECTION_IDS.pricing) },
      { label: "FAQ", href: landingHashHref(LANDING_SECTION_IDS.faq) },
    ],
  },
  hero: {
    badge: "SkySlope integration · Live insights",
    headlineWords: ["Empower", "every", "agent", "with", "smarter", "transaction", "insights."],
    italicWordIndex: 4,
    subheadline:
      "SilverKey helps brokerages transform SkySlope transaction data into coaching, support, and growth opportunities — so every agent performs at their best.",
    primaryCtaLabel: "Book a demo →",
    secondaryCtaLabel: "See how it works",
    trustLine: "No commitment required · Setup in under a week",
  },
  demo: {
    windowTitle: "SilverKey · Brokerage Overview · Q2 2026",
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
      { name: "Marcus T.", opportunity: "Volume up 34% — team lead candidate" },
      { name: "Priya M.", opportunity: "3 stalled contracts — needs guidance" },
      { name: "Carlos W.", opportunity: "Top performer — ready for recognition" },
    ],
    trendHeading: "Transaction trend · 6 months",
    trendValues: [34, 41, 38, 52, 47, 58],
    trendMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  },
  partners: {
    eyebrow: "Backed by & integrated with",
    headline: "The ecosystem powering SilverKey",
    subheadline: "Trusted partners and integrations that make the platform work.",
    items: [
      {
        id: "gt-ventures",
        logoKey: "gt-ventures",
        badge: "Backer",
        sub: "Pre-seed investor backing SilverKey's go-to-market",
      },
      {
        id: "skyslope",
        logoKey: "skyslope",
        badge: "Integration",
        sub: "Transaction management — the data source powering all roster insights",
      },
      {
        id: "better",
        logoKey: "better",
        badge: "MSA Signed",
        sub: "Mortgage partner · $3K + $1,500/user · Activates on launch",
      },
      {
        id: "move-concierge",
        logoKey: "move-concierge",
        badge: "Agreement Signed",
        sub: "Move management partner · Revenue share · Live integration",
      },
      {
        id: "exp-realty",
        logoKey: "exp-realty",
        badge: "Pilot Committed",
        sub: "Top-10 national team · 10 agents committed to live pilot",
      },
      {
        id: "ga-broker",
        logoKey: "ga-broker",
        badge: "Founder Credential",
        sub: "Built by a licensed Georgia broker — real experience behind every feature",
      },
    ],
  },
  info: {
    eyebrow: "The platform",
    headlineBefore: "Data that ",
    headlineAccent: "coaches.",
    headlineAfter: " Insights that stick.",
    subheadline:
      "SilverKey analyzes your SkySlope transaction data continuously — surfacing what matters before it becomes a problem.",
    cards: [
      {
        icon: "bar-chart-2",
        iconTintClass: "text-[#3B6FE0]",
        iconBgClass: "bg-[#EBF0FB]",
        statTarget: 12,
        statSuffix: "",
        statDelayMs: 200,
        title: "Coaching opportunities surfaced",
        body: "SilverKey reads deal velocity, pipeline depth, and closing trends to show you exactly which agents would benefit from a conversation this week.",
        animDirection: "left",
      },
      {
        icon: "heart",
        iconTintClass: "text-[#2DA771]",
        iconBgClass: "bg-[#E4F4EC]",
        statTarget: 23,
        statSuffix: "%",
        statDelayMs: 300,
        title: "Average retention improvement",
        body: "Brokerages using SilverKey identify growth signals early — and act on them before agents start looking elsewhere. Retention follows naturally.",
        animDirection: "up",
      },
      {
        icon: "file-signature",
        iconTintClass: "text-[#D4893A]",
        iconBgClass: "bg-[#FBF0E2]",
        statTarget: 3,
        statSuffix: "d",
        statDelayMs: 400,
        title: "Faster average time to close",
        body: "Spotting bottlenecks across your transaction portfolio helps leadership address recurring sticking points — improving pace for the whole brokerage.",
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
    headlineBefore: "Simple, ",
    headlineAccent: "honest",
    headlineAfter: " pricing.",
    subheadline:
      "One monthly price per brokerage, scaled to roster size. The number lives in the walkthrough — because it belongs in a conversation.",
    monthlyLabel: "Monthly",
    annualLabel: "Annual · save 20%",
    priceMonthly: "Custom",
    priceAnnual: "Custom (annual · 20% off)",
    footnote: "Exact pricing in the walkthrough",
    mostPopularLabel: "Most popular",
    tiers: [
      {
        id: "starter",
        name: "Starter",
        agentLimit: "per brokerage · up to 25 agents",
        features: [
          "Full roster overview",
          "Coaching opportunity signals",
          "SkySlope integration",
          "Monthly reporting",
        ],
        ctaLabel: "Get started →",
      },
      {
        id: "growth",
        name: "Growth",
        agentLimit: "per brokerage · unlimited agents",
        featured: true,
        features: [
          "Everything in Starter",
          "Agent growth & retention signals",
          "Transaction bottleneck analysis",
          "Priority support",
          "Onboarding & coaching playbooks",
        ],
        ctaLabel: "Book a demo →",
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    headline: "Questions brokers actually ask.",
    items: [
      {
        question: "Where does the data come from?",
        answer:
          "Your own transactions. SilverKey connects to SkySlope through authorized brokerage credentials and reads deal data you already generate. Nothing external, nothing your agents need to do.",
      },
      {
        question: "Do my agents have to do anything?",
        answer:
          "No. No new login, no migration, no new tool. Agents keep working exactly as they do now. The insights come from transactions they're already closing in SkySlope.",
      },
      {
        question: "Is this surveillance?",
        answer:
          "No. SilverKey reads brokerage-level production and pipeline — the same numbers you already own. It's not activity monitoring. It's the roster health read you've always wanted, built to help your agents succeed.",
      },
      {
        question: "Who can see the insights?",
        answer:
          "Your brokerage leadership only. Roster insights stay inside your shop. We never share, aggregate, or sell agent data across brokerages.",
      },
      {
        question: "We're not on SkySlope. Can we still use this?",
        answer:
          "SkySlope is our first integration. More transaction systems are coming. Get on the list and you'll hear from us when yours is ready.",
      },
      {
        question: "How long does setup take?",
        answer:
          "The walkthrough is 15 minutes. If it's a fit, onboarding is one connection — no migration, no IT project. Most brokerages are live within a week.",
      },
    ],
  },
  finalCta: {
    headlineBefore: "Turn transaction data into ",
    headlineAccent: "agent growth.",
    headlineAfter: "",
    subheadline: "Give your team the coaching and support they need to close more deals.",
    primaryCtaLabel: "Book a demo →",
    secondaryCtaLabel: "Text or call us",
    footnote: "Responds in under 5 minutes · Atlanta, GA · No pressure, no pitch deck",
    primaryHref: "https://cal.com/silverkey/demo",
    secondaryHref: "sms:+14045550000",
  },
  sticky: {
    message: "Empower every agent with smarter insights.",
    bookDemoLabel: "Book a demo",
    textUsLabel: "Text us",
    textUsHref: "sms:+14045550000",
  },
  footer: {
    location: "Atlanta, Georgia",
    copyright: "© 2026 SilverKey. All rights reserved.",
    disclaimer:
      "Platform fees are charged for marketplace placement and data services, not for referrals.",
    socialLinks: [
      { href: "https://linkedin.com/company/silverkey", label: "LinkedIn", text: "in" },
      { href: "https://twitter.com/usesilverkey", label: "X / Twitter", text: "𝕏" },
      { href: "https://instagram.com/usesilverkey", label: "Instagram", text: "◎" },
    ],
    legalLinks: [
      { label: "Contact", href: ROUTES.CONTACT },
      { label: "Privacy", href: ROUTES.PRIVACY },
      { label: "Terms", href: ROUTES.TERMS },
    ],
  },
};
