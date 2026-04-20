import type { components } from "packages/types/api.generated";

import { formatMlsAffiliationRecord } from "./formatPublicMlsAffiliations";
import { buildTelHref } from "./publicProfileContactLinks";

export type PublicAgentProfile = components["schemas"]["PublicAgentProfile"];

export type AgentPublicProfileViewModel = {
  displayName: string;
  avatarUrl: string | null;
  hasBrokerageBlock: boolean;
  emailTrimmed: string;
  phoneRaw: string;
  telHref: string | null;
  hasContact: boolean;
  hasLicenseChips: boolean;
  mlsCards: ReturnType<typeof formatMlsAffiliationRecord>[];
};

export function buildAgentPublicProfileViewModel(
  agent: PublicAgentProfile,
  fallbackName: string
): AgentPublicProfileViewModel {
  const displayName = agent.name?.trim() || fallbackName;
  const avatarUrl =
    agent.profile_picture_url?.trim() || agent.professional_headshot_url?.trim() || null;

  const hasBrokerageBlock = Boolean(
    agent.brokerage_name?.trim() ||
    agent.brokerage_bic_name?.trim() ||
    agent.brokerage_address?.trim() ||
    agent.brokerage_email?.trim() ||
    agent.brokerage_phone?.trim()
  );

  const emailTrimmed = agent.email?.trim() ?? "";
  const phoneRaw = agent.phone?.trim() ?? "";
  const telHref = phoneRaw ? buildTelHref(phoneRaw) : null;

  const hasContact = Boolean(emailTrimmed) || Boolean(phoneRaw) || Boolean(agent.mls_id?.trim());

  const hasLicenseChips = Boolean(
    agent.specialties?.length ||
    agent.primary_service_zips?.length ||
    agent.licensed_states?.length ||
    agent.license_types?.length ||
    agent.license_numbers?.length ||
    agent.license_expiration_dates?.length
  );

  const mlsCards =
    agent.mls_affiliations
      ?.map((row) => formatMlsAffiliationRecord(row as Record<string, unknown>))
      .filter((rows) => rows.length > 0) ?? [];

  return {
    displayName,
    avatarUrl,
    hasBrokerageBlock,
    emailTrimmed,
    phoneRaw,
    telHref,
    hasContact,
    hasLicenseChips,
    mlsCards,
  };
}
