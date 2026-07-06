/**
 * Anchor ids for public agent site sections (`/a/{slug}`). Kept stable so a
 * future section nav (and SIL-289/290/291 sections) can deep-link to them.
 */
export const PUBLIC_PROFILE_SECTION_IDS = {
  about: "about",
  social: "social",
  // Reserved for upcoming sections: SIL-290 listings, SIL-291 search, SIL-289 testimonials.
  listings: "listings",
  search: "search",
  testimonials: "testimonials",
} as const;

export type PublicProfileSectionId =
  (typeof PUBLIC_PROFILE_SECTION_IDS)[keyof typeof PUBLIC_PROFILE_SECTION_IDS];
