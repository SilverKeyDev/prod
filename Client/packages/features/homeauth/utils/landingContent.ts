import type { LandingContent } from "packages/features/homeauth/types/landingContent";
import { ROUTES } from "packages/navigation";

/**
 * Single source for public landing copy. Section components must not define inline marketing strings.
 */
export const LANDING_CONTENT: LandingContent = {
  nav: {
    landmarkLabel: "SilverKey",
    signUpLabel: "Sign up",
    loginLabel: "Log in",
    links: [
      { label: "Agents", href: "/#agents" },
      { label: "Buyers", href: "/#buyers" },
      { label: "Brokerages", href: "/#brokerages" },
    ],
  },
  hero: {
    eyebrow: "Buyers and agents",
    headlineBefore: "One platform to search, save, and move deals forward,",
    headlineAccent: "together.",
    headlineAfter: "",
    subheadline:
      "Buyers and agents share one workspace for MLS search, saved homes, and deal steps. Less back-and-forth, clearer next steps.",
    statSectionLabel: "What that means in practice",
    stats: [
      {
        value: "Centralized",
        label: "Search and deal activity stay in one shared workspace.",
      },
      {
        value: "Time",
        label: "Less back-and-forth for links, docs, and status updates.",
      },
      {
        value: "Ease",
        label: "Repeatable flows instead of rebuilding steps each offer.",
      },
    ],
  },
  featureStrip: {
    sectionHeading: "What is in the product",
    items: [
      {
        icon: "bar-chart-2",
        label: "Neighborhood notes and context in writing",
      },
      {
        icon: "file-signature",
        label: "Offer-related drafts and a clear task list",
      },
      {
        icon: "heart",
        label: "Saved homes, criteria, and ranking in one view",
      },
    ],
  },
  brokerages: {
    headline: "Built for brokerages that want one standard",
    subheadline:
      "Give agents and buyers a shared workspace while leadership keeps rollout and adoption visibility, without replacing your MLS overnight.",
    pillars: [
      {
        title: "Phased rollout",
        body: "Start with one team, measure adoption and time saved, then expand.",
      },
      {
        title: "Consistent buyer experience",
        body: "Buyers get consistent flows and document steps across your roster.",
      },
      {
        title: "Less coordinator drag",
        body: "Status, files, and next steps live in product instead of buried threads.",
      },
    ],
  },
  socialProof: {
    headline: "Fewer threads. Fewer gaps. Same facts for buyer and agent.",
    stats: [
      {
        value: "Buyers",
        label:
          "See listings, saves, and next steps without waiting on forwarded files.",
      },
      {
        value: "Agents",
        label:
          "Spend less time chasing signatures, versions, and file-check messages.",
      },
      {
        value: "Efficiency",
        label: "One system replaces inbox, drive, and ad hoc update sprawl.",
      },
    ],
    quotes: [
      {
        text: "Our buyers see the same shortlist and docs we see, without weekly re-sends.",
        attribution: "Team lead, brokerage pilot",
      },
    ],
  },
  footer: {
    description:
      "SilverKey combines MLS search, paperwork, and next steps so buyers and agents work from one place.",
    columns: [
      {
        heading: "Company",
        links: [
          { label: "About", href: "/#about" },
          { label: "Contact", href: ROUTES.CONTACT },
        ],
      },
      {
        heading: "Legal",
        links: [
          { label: "Privacy policy", href: ROUTES.PRIVACY },
          { label: "Terms of service", href: ROUTES.TERMS },
        ],
      },
    ],
  },
};
