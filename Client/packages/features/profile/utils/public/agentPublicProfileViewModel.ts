import type { components } from "packages/types/api.generated";

import { formatMlsAffiliationRecord } from "./formatPublicMlsAffiliations";
import { buildTelHref } from "./publicProfileContactLinks";

export type PublicAgentProfile = components["schemas"]["PublicAgentProfile"];

export type PublicAgentSocialLink = {
  key: string;
  label: string;
  href: string;
};

export type AgentPublicProfileViewModel = {
  displayName: string;
  /** First word of the display name, for conversational headings ("Meet Jane"). */
  firstName: string;
  avatarUrl: string | null;
  /** Prefers the professional headshot for large hero imagery. */
  heroImageUrl: string | null;
  hasBrokerageBlock: boolean;
  emailTrimmed: string;
  phoneRaw: string;
  telHref: string | null;
  hasContact: boolean;
  hasLicenseChips: boolean;
  mlsCards: ReturnType<typeof formatMlsAffiliationRecord>[];
  socialLinks: PublicAgentSocialLink[];
};

/** Display casing for well-known social platform keys; others are capitalized. */
const SOCIAL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  twitter: "Twitter",
  zillow: "Zillow",
  website: "Website",
};

function socialLabelForKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  if (SOCIAL_LABELS[normalized]) return SOCIAL_LABELS[normalized];
  const trimmed = key.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function buildAgentPublicProfileViewModel(
  agent: PublicAgentProfile,
  fallbackName: string,
): AgentPublicProfileViewModel {
  const displayName = agent.name?.trim() || fallbackName;
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const avatarUrl =
    agent.profile_picture_url?.trim() ||
    agent.professional_headshot_url?.trim() ||
    null;
  const heroImageUrl =
    agent.professional_headshot_url?.trim() ||
    agent.profile_picture_url?.trim() ||
    null;

  const hasBrokerageBlock = Boolean(
    agent.brokerage_name?.trim() ||
    agent.brokerage_bic_name?.trim() ||
    agent.brokerage_address?.trim() ||
    agent.brokerage_email?.trim() ||
    agent.brokerage_phone?.trim(),
  );

  const emailTrimmed = agent.email?.trim() ?? "";
  const phoneRaw = agent.phone?.trim() ?? "";
  const telHref = phoneRaw ? buildTelHref(phoneRaw) : null;

  const hasContact =
    Boolean(emailTrimmed) || Boolean(phoneRaw) || Boolean(agent.mls_id?.trim());

  const hasLicenseChips = Boolean(
    agent.specialties?.length ||
    agent.primary_service_zips?.length ||
    agent.licensed_states?.length ||
    agent.license_types?.length ||
    agent.license_numbers?.length ||
    agent.license_expiration_dates?.length,
  );

  const mlsCards =
    agent.mls_affiliations
      ?.map((row) => formatMlsAffiliationRecord(row as Record<string, unknown>))
      .filter((rows) => rows.length > 0) ?? [];

  const socialLinks: PublicAgentSocialLink[] = Object.entries(
    agent.social_links ?? {},
  )
    .filter((entry): entry is [string, string] => {
      const href = entry[1];
      return typeof href === "string" && href.trim().length > 0;
    })
    .map(([key, href]) => ({
      key,
      label: socialLabelForKey(key),
      href: href.trim(),
    }));

  return {
    displayName,
    firstName,
    avatarUrl,
    heroImageUrl,
    hasBrokerageBlock,
    emailTrimmed,
    phoneRaw,
    telHref,
    hasContact,
    hasLicenseChips,
    mlsCards,
    socialLinks,
  };
}
