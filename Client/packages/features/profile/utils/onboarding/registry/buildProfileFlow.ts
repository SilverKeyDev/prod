import type { ProfileStep } from "packages/features/profile/types/onboarding";

import { FLOW_TEMPLATE_STEP_IDS } from "./flowTemplates";
import { profileStepsFromIds } from "./stepMeta";
import type { FlowTemplateId, OnboardingFlowPrimaryRole, ProfileFlowContext } from "./types";

export function resolveTemplateId(ctx: ProfileFlowContext): FlowTemplateId {
  if (ctx.surface === "personalization") {
    return ctx.isAgent ? "agent_personalization" : "buyer_personalization";
  }

  const primaryRole = ctx.primaryRole;
  if (primaryRole === "seller" || primaryRole === "integration_partner") {
    return "minimal_onboarding";
  }
  if (primaryRole === "brokerage") {
    return "brokerage_onboarding";
  }
  if (ctx.isAgent || primaryRole === "agent") {
    return "agent_onboarding";
  }
  return "buyer_onboarding";
}

function applyOnboardingFilters(steps: ProfileStep[], ctx: ProfileFlowContext): ProfileStep[] {
  if (ctx.surface !== "onboarding" || !ctx.excludeFinancial) {
    return steps;
  }
  return steps.filter((step) => step.id !== "financial");
}

/**
 * Single source of truth for onboarding and personalization step order.
 */
export function buildProfileFlow(ctx: ProfileFlowContext): ProfileStep[] {
  const templateId = resolveTemplateId(ctx);
  const stepIds = FLOW_TEMPLATE_STEP_IDS[templateId];
  const steps = profileStepsFromIds(stepIds);
  return applyOnboardingFilters(steps, ctx);
}

export function buildOnboardingFlowFromOptions(options?: {
  isAgent?: boolean;
  primaryRole?: OnboardingFlowPrimaryRole;
  excludeFinancial?: boolean;
  platform?: ProfileFlowContext["platform"];
}): ProfileStep[] {
  return buildProfileFlow({
    surface: "onboarding",
    isAgent: options?.isAgent,
    primaryRole: options?.primaryRole,
    excludeFinancial: options?.excludeFinancial,
    platform: options?.platform,
  });
}

export function buildPersonalizationFlowFromOptions(options?: {
  isAgent?: boolean;
}): ProfileStep[] {
  return buildProfileFlow({
    surface: "personalization",
    isAgent: options?.isAgent,
  });
}
