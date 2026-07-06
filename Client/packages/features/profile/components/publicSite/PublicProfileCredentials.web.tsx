import { useLocalization } from "packages/contexts";
import { FIELD_LABELS, SECTION_TITLES } from "packages/features/profile/utils";
import type {
  AgentPublicProfileViewModel,
  PublicAgentProfile,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Box } from "packages/ui/components/structure/primitives";

import {
  PublicProfileChipRow,
  PublicProfileDetail,
  PublicProfileInfoCard,
} from "./PublicProfileDetails.web";
import { PublicProfileSection } from "./PublicProfileSection.web";

type PublicProfileCredentialsProps = {
  agent: PublicAgentProfile;
  model: AgentPublicProfileViewModel;
};

/**
 * Licenses, MLS affiliations, and brokerage details as a mixed card grid —
 * one icon-badged card per credential group. Renders nothing without data.
 */
export function PublicProfileCredentials({
  agent,
  model,
}: PublicProfileCredentialsProps) {
  const { t } = useLocalization();

  const licensedStates = agent.licensed_states?.filter((s) => s?.trim()) ?? [];
  const hasLicenseDetails = Boolean(
    agent.license_types?.length ||
    agent.license_numbers?.length ||
    agent.license_expiration_dates?.length,
  );
  const hasAnything =
    licensedStates.length > 0 ||
    hasLicenseDetails ||
    model.mlsCards.length > 0 ||
    model.hasBrokerageBlock;
  if (!hasAnything) return null;

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.credentials}
      eyebrow={t("profile.public.site.credentials_eyebrow")}
      heading={t("profile.public.site.credentials_heading")}
      tone="surface"
    >
      <Box className="grid items-start gap-4 sm:gap-5 md:grid-cols-2">
        {licensedStates.length ? (
          <PublicProfileInfoCard
            iconName="shield"
            title={FIELD_LABELS.AGENT_LICENSED_STATES}
          >
            <PublicProfileChipRow label="" items={licensedStates} />
          </PublicProfileInfoCard>
        ) : null}

        {hasLicenseDetails ? (
          <PublicProfileInfoCard
            iconName="file-text"
            title={t("profile.public.site.license_details_title")}
          >
            <Box className="gap-4">
              <PublicProfileChipRow
                label={FIELD_LABELS.AGENT_LICENSE_TYPES}
                items={agent.license_types ?? undefined}
              />
              <PublicProfileChipRow
                label={FIELD_LABELS.AGENT_LICENSE_NUMBERS}
                items={agent.license_numbers ?? undefined}
              />
              <PublicProfileChipRow
                label={FIELD_LABELS.AGENT_LICENSE_EXPIRATION_DATES}
                items={agent.license_expiration_dates ?? undefined}
              />
            </Box>
          </PublicProfileInfoCard>
        ) : null}

        {model.mlsCards.map((rows, index) => (
          <PublicProfileInfoCard
            key={`mls-${index}`}
            iconName="building-2"
            title={t("profile.public.mls_affiliations_heading")}
          >
            <Box className="gap-3">
              {rows.map((r, rowIdx) => (
                <PublicProfileDetail
                  key={`${index}-${rowIdx}-${r.label}`}
                  label={r.label}
                  value={r.value}
                />
              ))}
            </Box>
          </PublicProfileInfoCard>
        ))}

        {model.hasBrokerageBlock ? (
          <PublicProfileInfoCard
            iconName="building"
            title={SECTION_TITLES.AGENT_BROKERAGE}
          >
            <Box className="grid gap-4 sm:grid-cols-2">
              <PublicProfileDetail
                label={FIELD_LABELS.AGENT_BROKERAGE_NAME}
                value={agent.brokerage_name ?? undefined}
              />
              <PublicProfileDetail
                label={FIELD_LABELS.AGENT_BROKERAGE_BIC}
                value={agent.brokerage_bic_name ?? undefined}
              />
              <PublicProfileDetail
                label={FIELD_LABELS.AGENT_BROKERAGE_ADDRESS}
                value={agent.brokerage_address ?? undefined}
              />
              <PublicProfileDetail
                label={FIELD_LABELS.AGENT_BROKERAGE_EMAIL}
                value={agent.brokerage_email ?? undefined}
              />
              <PublicProfileDetail
                label={FIELD_LABELS.AGENT_BROKERAGE_PHONE}
                value={agent.brokerage_phone ?? undefined}
              />
            </Box>
          </PublicProfileInfoCard>
        ) : null}
      </Box>
    </PublicProfileSection>
  );
}
