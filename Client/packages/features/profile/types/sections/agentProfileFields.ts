import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

/** Form keys for agent-only profile sections (brokerage, licensing, service area). */
export const AGENT_BROKERAGE_FIELD_KEYS = [
  "agent_brokerage_name",
  "agent_brokerage_bic_name",
  "agent_brokerage_address",
  "agent_brokerage_email",
  "agent_brokerage_phone",
] as const satisfies ReadonlyArray<keyof OnboardingData>;

export const AGENT_LICENSING_FIELD_KEYS = [
  "agent_physical_mailing_address",
  "agent_licensed_states",
  "agent_license_types",
  "agent_license_numbers",
  "agent_license_expiration_dates",
  "agent_mls_affiliations",
] as const satisfies ReadonlyArray<keyof OnboardingData>;

export const AGENT_PROFILE_SERVICE_FIELD_KEYS = [
  "agent_bio",
  "agent_primary_service_zips",
  "agent_specialties",
  "agent_testimonials",
  "agent_social_links",
] as const satisfies ReadonlyArray<keyof OnboardingData>;

export const AGENT_PROFILE_FORM_FIELD_KEYS = [
  ...AGENT_BROKERAGE_FIELD_KEYS,
  ...AGENT_LICENSING_FIELD_KEYS,
  ...AGENT_PROFILE_SERVICE_FIELD_KEYS,
] as const satisfies ReadonlyArray<keyof OnboardingData>;

export type AgentProfileFormFieldKey = (typeof AGENT_PROFILE_FORM_FIELD_KEYS)[number];
