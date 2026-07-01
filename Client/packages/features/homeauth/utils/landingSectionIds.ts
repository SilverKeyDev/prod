/** Canonical in-page section ids for the public marketing landing (PR #116 structure). */
export const LANDING_SECTION_IDS = {
  hero: "hero",
  partners: "partners",
  info: "info",
  savings: "savings",
  pricing: "pricing",
  faq: "faq",
  finalCta: "final-cta",
} as const;

export type LandingSectionId = (typeof LANDING_SECTION_IDS)[keyof typeof LANDING_SECTION_IDS];

export function landingHashHref(sectionId: LandingSectionId): string {
  return `/#${sectionId}`;
}
