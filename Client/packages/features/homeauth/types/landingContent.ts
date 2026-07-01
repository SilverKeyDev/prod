export type LandingPartnerLogoKey =
  | "gt-ventures"
  | "skyslope"
  | "better"
  | "move-concierge"
  | "exp-realty"
  | "ga-broker";

export type LandingNavLink = {
  label: string;
  href: string;
};

export type LandingDemoStat = {
  id: string;
  label: string;
  value: string;
  sub: string;
};

export type LandingDemoQueueItem = {
  name: string;
  opportunity: string;
};

export type LandingPartnerItem = {
  id: string;
  logoKey: LandingPartnerLogoKey;
  badge: string;
  sub: string;
};

export type LandingInfoCard = {
  icon: "bar-chart-2" | "heart" | "file-signature";
  iconTintClass: string;
  iconBgClass: string;
  statTarget: number;
  statSuffix: string;
  statDelayMs: number;
  title: string;
  body: string;
  animDirection: "left" | "up" | "right";
};

export type LandingSavingsSlider = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
};

export type LandingPricingTier = {
  id: string;
  name: string;
  agentLimit: string;
  features: string[];
  ctaLabel: string;
  featured?: boolean;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingSocialLink = {
  href: string;
  label: string;
  text: string;
};

export type LandingContent = {
  nav: {
    landmarkLabel: string;
    loginLabel: string;
    bookDemoLabel: string;
    links: LandingNavLink[];
  };
  hero: {
    badge: string;
    headlineWords: string[];
    italicWordIndex: number;
    subheadline: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    trustLine: string;
  };
  demo: {
    windowTitle: string;
    stats: LandingDemoStat[];
    queueHeading: string;
    queueItems: LandingDemoQueueItem[];
    trendHeading: string;
    trendValues: number[];
    trendMonths: string[];
  };
  partners: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    items: LandingPartnerItem[];
  };
  info: {
    eyebrow: string;
    headlineBefore: string;
    headlineAccent: string;
    headlineAfter: string;
    subheadline: string;
    cards: LandingInfoCard[];
  };
  savings: {
    eyebrow: string;
    headline: string;
    panelHeading: string;
    sliders: LandingSavingsSlider[];
    resultHeading: string;
    resultSub: string;
    resultCtaLabel: string;
    breakdownLabels: {
      agentsReady: string;
      upliftPerAgent: string;
      totalUpside: string;
    };
  };
  pricing: {
    eyebrow: string;
    headlineBefore: string;
    headlineAccent: string;
    headlineAfter: string;
    subheadline: string;
    monthlyLabel: string;
    annualLabel: string;
    priceMonthly: string;
    priceAnnual: string;
    footnote: string;
    mostPopularLabel: string;
    tiers: LandingPricingTier[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    items: LandingFaqItem[];
  };
  finalCta: {
    headlineBefore: string;
    headlineAccent: string;
    headlineAfter: string;
    subheadline: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    footnote: string;
    primaryHref: string;
    secondaryHref: string;
  };
  sticky: {
    message: string;
    bookDemoLabel: string;
    textUsLabel: string;
    textUsHref: string;
  };
  footer: {
    location: string;
    copyright: string;
    disclaimer: string;
    socialLinks: LandingSocialLink[];
    legalLinks: LandingNavLink[];
  };
};
