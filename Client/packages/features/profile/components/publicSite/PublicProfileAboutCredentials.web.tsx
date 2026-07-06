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
  PublicProfileInfoCard,
} from "./PublicProfileDetails.web";
import { PublicProfileSection } from "./PublicProfileSection.web";

type PublicProfileAboutCredentialsProps = {
  agent: PublicAgentProfile;
  model: AgentPublicProfileViewModel;
};

/**
 * Combined About + Credentials card deck (`#about`): bio with brokerage
 * details folded in on the left, licenses and MLS affiliations on the right.
 * Side by side on md+, stacked on mobile. Renders nothing when both empty.
 */
export function PublicProfileAboutCredentials({
  agent,
  model,
}: PublicProfileAboutCredentialsProps) {
  const { t } = useLocalization();

  const hasBio = Boolean(agent.agent_bio?.trim());
  const hasAboutCard = hasBio || model.hasBrokerageBlock;

  const licensedStates = agent.licensed_states?.filter((s) => s?.trim()) ?? [];
  const hasCredentialsCard =
    licensedStates.length > 0 ||
    Boolean(
      agent.license_types?.length ||
      agent.license_numbers?.length ||
      agent.license_expiration_dates?.length,
    ) ||
    model.mlsCards.length > 0;

  if (!hasAboutCard && !hasCredentialsCard) return null;

  const bothCards = hasAboutCard && hasCredentialsCard;

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.about}
      eyebrow={t("profile.public.site.about_eyebrow")}
      heading={t("profile.public.site.about_heading", {
        firstName: model.firstName,
      })}
      tone="base"
    >
      <Box
        className={`grid items-stretch gap-4 sm:gap-6 ${bothCards ? "md:grid-cols-2" : ""}`}
      >
        {hasAboutCard ? (
          <PublicProfileInfoCard
            iconName="user"
            title={t("profile.public.site.about_card_title")}
            surface
          >
            <Box className="gap-5">
              {hasBio ? (
                <BodyText
                  size="md"
                  className="text-text-primary whitespace-pre-wrap leading-relaxed"
                >
                  {agent.agent_bio}
                </BodyText>
              ) : null}
              {model.hasBrokerageBlock ? (
                <Box className="border-border gap-3 border-t pt-4">
                  <BodyText
                    size="xs"
                    className="text-text-secondary font-medium uppercase tracking-wide"
                  >
                    {SECTION_TITLES.AGENT_BROKERAGE}
                  </BodyText>
                  <Box className="grid gap-3 sm:grid-cols-2">
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
              ) : null}
            </Box>
          </PublicProfileInfoCard>
        ) : null}

        {hasCredentialsCard ? (
          <PublicProfileInfoCard
            iconName="shield"
            title={t("profile.public.credentials_heading")}
            surface
          >
            <Box className="gap-5">
              <PublicProfileChipRow
                label={FIELD_LABELS.AGENT_LICENSED_STATES}
                items={licensedStates}
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
              {model.mlsCards.length > 0 ? (
                <Box className="gap-3">
                  <BodyText
                    size="xs"
                    className="text-text-secondary font-medium uppercase tracking-wide"
                  >
                    {t("profile.public.mls_affiliations_heading")}
                  </BodyText>
                  {model.mlsCards.map((rows, index) => (
                    <Box
                      key={`mls-${index}`}
                      className="border-border bg-background-base gap-2 rounded-xl border p-4"
                    >
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
              ) : null}
            </Box>
          </PublicProfileInfoCard>
        ) : null}
      </Box>
    </PublicProfileSection>
  );
}
