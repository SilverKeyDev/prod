import type { IconName } from "packages/ui/types/icons";

export type LandingStat = {
  value: string;
  label: string;
};

export type LandingFeatureItem = {
  icon: IconName;
  label: string;
};

export type LandingQuote = {
  text: string;
  attribution: string;
};

export type LandingFooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

export type LandingBrokeragePillar = {
  title: string;
  body: string;
};

export type LandingContent = {
  nav: {
    landmarkLabel: string;
    signUpLabel: string;
    loginLabel: string;
    links: { label: string; href: string }[];
  };
  hero: {
    eyebrow: string;
    headlineBefore: string;
    headlineAccent: string;
    /** Optional second line after the accent line (usually empty for two-line hero). */
    headlineAfter: string;
    subheadline: string;
    statSectionLabel: string;
    stats: LandingStat[];
    /** Optional credibility line below hero stats. */
    trustLine?: string;
  };
  featureStrip: {
    sectionHeading: string;
    items: LandingFeatureItem[];
  };
  brokerages: {
    headline: string;
    subheadline: string;
    pillars: LandingBrokeragePillar[];
  };
  socialProof: {
    headline: string;
    stats: LandingStat[];
    quotes: LandingQuote[];
  };
  footer: {
    description: string;
    columns: LandingFooterColumn[];
  };
};
