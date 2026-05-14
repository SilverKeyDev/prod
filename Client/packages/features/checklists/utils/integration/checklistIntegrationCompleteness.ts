import type { AgentConversation } from "packages/api";
import type { OnboardingData } from "packages/features/profile/types/onboarding";

export type ConnectedAgentSummary = {
  agentId: string;
  displayName: string;
  email: string | null;
  profilePictureUrl: string | null;
};

/** One row per connected agent (deduped by `agent_id`), sorted by display name. */
export function listConnectedAgentsForPartnerStep(
  conversations: AgentConversation[]
): ConnectedAgentSummary[] {
  const byAgent = new Map<string, AgentConversation>();
  for (const c of conversations) {
    const prev = byAgent.get(c.agent_id);
    if (!prev || c.updated_at > prev.updated_at) {
      byAgent.set(c.agent_id, c);
    }
  }
  return [...byAgent.values()]
    .sort((a, b) =>
      (a.agent_name ?? "").localeCompare(b.agent_name ?? "", undefined, { sensitivity: "base" })
    )
    .map((c) => ({
      agentId: c.agent_id,
      displayName: c.agent_name?.trim() || "Agent",
      email: c.agent_email ?? null,
      profilePictureUrl: c.agent_profile_picture ?? null,
    }));
}

/** Buyer roadmap step: at least one established agent–client connection (messaging graph). */
export function isPartnerWithAgentStepComplete(conversations: AgentConversation[]): boolean {
  return listConnectedAgentsForPartnerStep(conversations).length >= 1;
}

function isPositiveNumber(n: unknown): n is number {
  return typeof n === "number" && !Number.isNaN(n) && n > 0;
}

function nonEmptyTrimmed(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** Matches SearchPrefsPriceFinancing: undefined defaults to OK with HOA. */
function isOkWithHoa(formData: Partial<OnboardingData>): boolean {
  return formData.buyerPreferenceExtensions?.price_financing?.hoa_ok !== false;
}

/** Budget + financing fields shown in the checklist Set a budget step. */
export function isSetBudgetStepComplete(formData: Partial<OnboardingData>): boolean {
  if (!isPositiveNumber(formData.home_budget_min) || !isPositiveNumber(formData.home_budget_max)) {
    return false;
  }
  if (formData.home_budget_min > formData.home_budget_max) {
    return false;
  }
  if (formData.paying_cash === true) {
    return isOkWithHoa(formData);
  }
  if (!isPositiveNumber(formData.gross_income)) {
    return false;
  }
  if (
    formData.down_payment === undefined ||
    formData.down_payment === null ||
    formData.down_payment < 0
  ) {
    return false;
  }
  if (!nonEmptyTrimmed(formData.credit_score_range)) {
    return false;
  }
  return true;
}

/** At least one important location with a non-empty address. */
export function isChooseSearchAreaStepComplete(formData: Partial<OnboardingData>): boolean {
  const locs = formData.important_locations;
  if (!Array.isArray(locs) || locs.length === 0) return false;
  return locs.every(
    (loc) => loc != null && typeof loc.address === "string" && loc.address.trim().length > 0
  );
}

function defineCriteriaRangeOk(formData: Partial<OnboardingData>): boolean {
  const bmin = formData.preferred_bedrooms_min;
  const bmax = formData.preferred_bedrooms_max;
  if (bmin != null && (bmin < 1 || bmin > 8)) return false;
  if (bmax != null && (bmax < 1 || bmax > 8)) return false;
  if (bmin != null && bmax != null && bmin > bmax) return false;

  const tmin = formData.preferred_bathrooms_min;
  const tmax = formData.preferred_bathrooms_max;
  if (tmin != null && (tmin < 1 || tmin > 8)) return false;
  if (tmax != null && (tmax < 1 || tmax > 8)) return false;
  if (tmin != null && tmax != null && tmin > tmax) return false;
  return true;
}

/**
 * Core housing criteria for the checklist step (beds/baths, type, must-haves,
 * other requirements as deal-breaker proxy, walkability).
 */
export function isDefineCriteriaStepComplete(formData: Partial<OnboardingData>): boolean {
  if (!defineCriteriaRangeOk(formData)) return false;
  if (!nonEmptyTrimmed(formData.preferred_housing_type)) return false;
  const must = formData.must_have;
  if (!Array.isArray(must) || must.length === 0) return false;
  const other = formData.other_requirements;
  if (!Array.isArray(other) || other.length === 0) return false;
  if (!nonEmptyTrimmed(formData.walkability_importance)) return false;
  return true;
}
