import type { LandingSectionId } from "./landingSectionIds";

export type LandingSectionTone = "base" | "surface";

export type LandingSectionLayout = {
  tone: LandingSectionTone;
  ripple: boolean;
  dividerBefore: boolean;
};

/** Uniform base background; ripple on hero, info, pricing; dividers between sections. */
export const LANDING_SECTION_LAYOUT: Record<LandingSectionId, LandingSectionLayout> = {
  hero: { tone: "base", ripple: true, dividerBefore: false },
  partners: { tone: "base", ripple: false, dividerBefore: true },
  info: { tone: "base", ripple: true, dividerBefore: true },
  savings: { tone: "base", ripple: false, dividerBefore: true },
  pricing: { tone: "base", ripple: true, dividerBefore: true },
  faq: { tone: "base", ripple: false, dividerBefore: true },
  "final-cta": { tone: "base", ripple: false, dividerBefore: true },
};

export const LANDING_DEMO_LAYOUT: LandingSectionLayout = {
  tone: "base",
  ripple: false,
  dividerBefore: true,
};

export const LANDING_FOOTER_LAYOUT: LandingSectionLayout = {
  tone: "base",
  ripple: false,
  dividerBefore: true,
};
