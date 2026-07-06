import { useLocalization } from "packages/contexts";
import { FIELD_LABELS, SECTION_TITLES } from "packages/features/profile/utils";
import type {
  AgentPublicProfileViewModel,
  PublicAgentProfile,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import {
  PublicProfileChipRow,
  PublicProfileDetail,
} from "./PublicProfileDetails.web";
import { PublicProfileSection } from "./PublicProfileSection.web";

const CARD_CLASS =
  "border-border bg-background-base gap-4 rounded-2xl border p-5 shadow-sm hover:shadow-md motion-safe:transition-shadow sm:p-6";

type PublicProfileCredentialsProps = {
  agent: PublicAgentProfile;
  model: AgentPublicProfileViewModel;
};

/** Licenses, MLS affiliations, and brokerage details. Renders nothing without data. */
export function PublicProfileCredentials({
  agent,
  model,
}: PublicProfileCredentialsProps) {
  const { t } = useLocalization();
  const hasAnything =
    model.hasLicenseChips ||
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
      <Box className="gap-6">
        {model.hasLicenseChips ? (
          <Box className={`${CARD_CLASS} gap-5`}>
            <PublicProfileChipRow
              label={FIELD_LABELS.AGENT_LICENSED_STATES}
              items={agent.licensed_states ?? undefined}
            />
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
        ) : null}

        {model.mlsCards.length > 0 ? (
          <Box className="gap-3">
            <BodyText size="sm" className="text-text-secondary font-semibold">
              {t("profile.public.mls_affiliations_heading")}
            </BodyText>
            <Box className="grid gap-4 md:grid-cols-2">
              {model.mlsCards.map((rows, index) => (
                <Box key={`mls-${index}`} className={`${CARD_CLASS} gap-3`}>
                  {rows.map((r, rowIdx) => (
                    <PublicProfileDetail
                      key={`${index}-${rowIdx}-${r.label}`}
                      label={r.label}
                      value={r.value}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        ) : null}

        {model.hasBrokerageBlock ? (
          <Box className="gap-3">
            <BodyText size="sm" className="text-text-secondary font-semibold">
              {SECTION_TITLES.AGENT_BROKERAGE}
            </BodyText>
            <Box className={CARD_CLASS}>
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
            </Box>
          </Box>
        ) : null}
      </Box>
    </PublicProfileSection>
  );
}
