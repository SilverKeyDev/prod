import type { ProfileStepId } from "packages/features/profile/types/profileStepIds";
import { BUYER_PERSONALIZATION_SECTION_IDS } from "packages/features/profile/types/profileStepIds";

import type { FlowTemplateId } from "./types";

const BUYER_ONBOARDING_AFTER_ROLE: ProfileStepId[] = [
  "demographics",
  "housing_essentials",
  "housing_ranges",
  "location",
  "search_property",
  "financial",
];

const AGENT_ONBOARDING_AFTER_ROLE: ProfileStepId[] = [
  "demographics",
  "agent_brokerage",
  "agent_licensing",
  "agent_profile",
];

const MINIMAL_ONBOARDING: ProfileStepId[] = ["onboarding_role"];

const PERSONALIZATION_BUYER_ORDER: ProfileStepId[] = [
  "housing_essentials",
  "location",
  "financial",
  "housing_ranges",
  "search_property",
  "demographics",
];

const AGENT_PERSONALIZATION_PREFIX: ProfileStepId[] = [
  "agent_brokerage",
  "agent_licensing",
  "agent_profile",
  "availability",
];

const BUYER_HOME_SEARCH_IDS = new Set<string>(BUYER_PERSONALIZATION_SECTION_IDS);

const AGENT_PERSONALIZATION_SUFFIX: ProfileStepId[] = PERSONALIZATION_BUYER_ORDER.filter(
  (id) => !BUYER_HOME_SEARCH_IDS.has(id)
);

export const FLOW_TEMPLATE_STEP_IDS: Record<FlowTemplateId, readonly ProfileStepId[]> = {
  buyer_onboarding: ["onboarding_role", ...BUYER_ONBOARDING_AFTER_ROLE],
  agent_onboarding: ["onboarding_role", ...AGENT_ONBOARDING_AFTER_ROLE],
  minimal_onboarding: MINIMAL_ONBOARDING,
  brokerage_onboarding: MINIMAL_ONBOARDING,
  buyer_personalization: [...PERSONALIZATION_BUYER_ORDER, "privacy_data"],
  agent_personalization: [
    ...AGENT_PERSONALIZATION_PREFIX,
    ...AGENT_PERSONALIZATION_SUFFIX,
    "privacy_data",
  ],
};
