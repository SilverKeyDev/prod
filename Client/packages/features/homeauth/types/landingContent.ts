export type LandingPartnerLogoKey = "move-concierge" | "ga-agent";

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
  title: string;
  logoKey?: LandingPartnerLogoKey;
  badge: string;
  sub: string;
};

export type LandingInfoCardIcon = "bar-chart-2" | "heart" | "file-signature";

export type LandingInfoCard = {
  icon: LandingInfoCardIcon;
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

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type LandingSocialIcon = "linkedin" | "x" | "instagram";

export type LandingSocialLink = {
  href: string;
  label: string;
  icon: LandingSocialIcon;
};

export type LandingContent = {
  nav: {
    landmarkLabel: string;
    loginLabel: string;
    signUpLabel: string;
    bookDemoLabel: string;
    links: LandingNavLink[];
  };
  hero: {
    headlineWords: string[];
    italicWordIndex: number;
    subheadline: string;
    primaryCtaLabel: string;
    signUpCtaLabel: string;
    trustLine: string;
  };
  demo: {
    windowTitle: string;
    syncCaption: string;
    stats: LandingDemoStat[];
    queueHeading: string;
    queueItems: LandingDemoQueueItem[];
    trendHeading: string;
    trendValues: number[];
    trendMonths: string[];
  };
  partners: {
    eyebrow: string;
    subheadline: string;
    items: LandingPartnerItem[];
  };
  info: {
    eyebrow: string;
    headlineBefore: string;
    headlineAccent: string;
    headlineAfter: string;
    subheadline: string;
    cardsCaption: string;
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
    cardEyebrow: string;
    headlineBefore: string;
    headlineAccent: string;
    headlineAfter: string;
    subheadline: string;
    priceLabel: string;
    highlights: string[];
    supportingLine: string;
    ctaLabel: string;
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
    footnote: string;
  };
  footer: {
    location: string;
    copyright: string;
    disclaimer: string;
    socialLinks: LandingSocialLink[];
    legalLinks: LandingNavLink[];
  };
};
