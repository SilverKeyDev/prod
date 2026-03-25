/**
 * Canonical step ids for profile onboarding / personalization flows.
 * Keep in sync with {@link ../utils/steps.ts} and UI step builders.
 */

export const PROFILE_STEP_IDS = [
  "demographics",
  "housing",
  "location",
  "financial",
  "agent_brokerage",
  "agent_licensing",
  "agent_profile",
] as const;

export type ProfileStepId = (typeof PROFILE_STEP_IDS)[number];

/** Sections shown only to agents (brokerage, licensing, public profile). */
export const AGENT_ONLY_SECTION_IDS = [
  "agent_brokerage",
  "agent_licensing",
  "agent_profile",
] as const satisfies ReadonlyArray<ProfileStepId>;

export type AgentOnlySectionId = (typeof AGENT_ONLY_SECTION_IDS)[number];

/**
 * Buyer-centric preference sections that agents still see in personalization / profile,
 * with an “optional for personal search” callout in the section body.
 */
export const BUYER_PERSONALIZATION_SECTION_IDS = [
  "housing",
  "location",
  "financial",
] as const satisfies ReadonlyArray<ProfileStepId>;

export type BuyerPersonalizationSectionId = (typeof BUYER_PERSONALIZATION_SECTION_IDS)[number];
