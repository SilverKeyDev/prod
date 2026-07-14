/**
 * Static "suggested next variant" copy derived from existing winner lift.
 * Presentation only — no new experiment engine.
 */
import { formatSignedLiftPp } from "packages/features/brokerage/utils/analyticsFormat";
import type { SampleEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { isControlEmail } from "packages/features/brokerage/utils/campaigns/campaignFixtures";

export type SuggestedNextVariant = {
  title: string;
  reason: string;
};

/**
 * Suggest a follow-up treatment based on the current winner's lift vs control.
 */
export function buildSuggestedNextVariant(
  emails: SampleEmail[],
  liftVsControlPp: number | null
): SuggestedNextVariant | null {
  const winner = emails.find((e) => e.is_winner && !isControlEmail(e));
  if (!winner || liftVsControlPp == null) return null;

  const subjectLen = winner.subject.length;
  const shorterHint =
    subjectLen > 42 ? "shorter subject lines" : "a clearer fee/value CTA in the first line";

  return {
    title: "Suggested next variant",
    reason: `${winner.variant_key} is ahead by ${formatSignedLiftPp(liftVsControlPp)} pp vs Control — try ${shorterHint} next.`,
  };
}
