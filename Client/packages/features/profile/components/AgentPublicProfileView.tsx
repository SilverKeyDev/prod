import { type ReactNode, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import {
  buildAgentPublicProfileViewModel,
  FIELD_LABELS,
  SECTION_TITLES,
} from "packages/features/profile/utils";
import type { components } from "packages/types/api.generated";
import { ExternalAnchor } from "packages/ui/components/accessibility";
import { ProfileAvatar } from "packages/ui/components/avatar";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import Subtitle from "packages/ui/components/text/Subtitle";
import Title from "packages/ui/components/text/Title";

export type AgentPublicProfileViewProps = {
  agent: components["schemas"]["PublicAgentProfile"];
  /** Optional actions in the hero row (e.g. public Connect CTA). */
  heroActions?: ReactNode;
};

function DetailBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <Box className="gap-1">
      <BodyText size="xs" className="text-text-secondary font-medium">
        {label}
      </BodyText>
      <BodyText size="sm" className="text-text-primary">
        {value}
      </BodyText>
    </Box>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] | null | undefined }) {
  if (!items?.length) return null;
  return (
    <Box className="gap-2">
      <BodyText size="xs" className="text-text-secondary font-medium">
        {label}
      </BodyText>
      <Box className="flex flex-row flex-wrap gap-2">
        {items.map((item) => (
          <Box
            key={item}
            className="bg-background-base border-border rounded-full border px-3 py-1.5"
          >
            <BodyText size="xs">{item}</BodyText>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const cardClass = "border-border bg-background-surface gap-4 rounded-xl border p-4 sm:p-5";

export function AgentPublicProfileView({ agent, heroActions }: AgentPublicProfileViewProps) {
  const { t } = useLocalization();
  const fallbackName = t("profile.public.hero_fallback_name");
  const model = useMemo(
    () => buildAgentPublicProfileViewModel(agent, fallbackName),
    [agent, fallbackName]
  );

  return (
    <Box className="mx-auto w-full max-w-2xl gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10">
      <Box className="border-border bg-background-surface flex flex-col items-start gap-6 rounded-2xl border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
        <Box className="flex min-w-0 flex-1 flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Box className="bg-primary-muted h-28 w-28 shrink-0 overflow-hidden rounded-full sm:h-32 sm:w-32">
            <ProfileAvatar
              imageUrl={model.avatarUrl}
              label={t("profile.public.photo_aria", { name: model.displayName })}
              imageClassName="h-28 w-28 rounded-full sm:h-32 sm:w-32"
            />
          </Box>
          <Box className="min-w-0 flex-1 gap-2">
            <Title size="lg" as="h1">
              {model.displayName}
            </Title>
            {agent.brokerage?.trim() ? (
              <BodyText size="sm" muted>
                {agent.brokerage}
              </BodyText>
            ) : null}
          </Box>
        </Box>
        {heroActions ? (
          <Box className="flex w-full shrink-0 justify-stretch sm:w-auto sm:justify-end sm:pt-1">
            {heroActions}
          </Box>
        ) : null}
      </Box>

      {model.hasContact ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {t("profile.public.contact_heading")}
          </Title>
          <Subtitle size="xs" muted>
            {t("profile.public.contact_subtitle")}
          </Subtitle>
          <Box className={cardClass}>
            <Box className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-4">
              {model.emailTrimmed ? (
                <Box className="min-w-0 flex-1 gap-1 sm:min-w-48">
                  <BodyText size="xs" className="text-text-secondary font-medium">
                    {t("profile.public.email_label")}
                  </BodyText>
                  <ExternalAnchor href={`mailto:${model.emailTrimmed}`}>
                    {model.emailTrimmed}
                  </ExternalAnchor>
                </Box>
              ) : null}
              {model.phoneRaw ? (
                <Box className="min-w-0 flex-1 gap-1 sm:min-w-48">
                  <BodyText size="xs" className="text-text-secondary font-medium">
                    {t("profile.public.phone_label")}
                  </BodyText>
                  {model.telHref ? (
                    <ExternalAnchor href={model.telHref}>{model.phoneRaw}</ExternalAnchor>
                  ) : (
                    <BodyText size="sm" className="text-text-primary">
                      {model.phoneRaw}
                    </BodyText>
                  )}
                </Box>
              ) : null}
              <DetailBlock
                label={t("profile.public.mls_id_label")}
                value={agent.mls_id ?? undefined}
              />
            </Box>
          </Box>
        </Box>
      ) : null}

      {agent.agent_bio?.trim() ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {FIELD_LABELS.AGENT_BIO}
          </Title>
          <Box className={cardClass}>
            <BodyText size="sm" className="text-text-primary whitespace-pre-wrap">
              {agent.agent_bio}
            </BodyText>
          </Box>
        </Box>
      ) : null}

      {model.hasBrokerageBlock ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {SECTION_TITLES.AGENT_BROKERAGE}
          </Title>
          <Box className={cardClass}>
            <DetailBlock
              label={FIELD_LABELS.AGENT_BROKERAGE_NAME}
              value={agent.brokerage_name ?? undefined}
            />
            <DetailBlock
              label={FIELD_LABELS.AGENT_BROKERAGE_BIC}
              value={agent.brokerage_bic_name ?? undefined}
            />
            <DetailBlock
              label={FIELD_LABELS.AGENT_BROKERAGE_ADDRESS}
              value={agent.brokerage_address ?? undefined}
            />
            <DetailBlock
              label={FIELD_LABELS.AGENT_BROKERAGE_EMAIL}
              value={agent.brokerage_email ?? undefined}
            />
            <DetailBlock
              label={FIELD_LABELS.AGENT_BROKERAGE_PHONE}
              value={agent.brokerage_phone ?? undefined}
            />
          </Box>
        </Box>
      ) : null}

      {model.hasLicenseChips ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {t("profile.public.licenses_heading")}
          </Title>
          <Subtitle size="xs" muted>
            {t("profile.public.licenses_subtitle")}
          </Subtitle>
          <Box className={`${cardClass} gap-5`}>
            <ChipRow
              label={FIELD_LABELS.AGENT_SPECIALTIES}
              items={agent.specialties ?? undefined}
            />
            <ChipRow
              label={FIELD_LABELS.AGENT_PRIMARY_SERVICE_ZIPS}
              items={agent.primary_service_zips ?? undefined}
            />
            <ChipRow
              label={FIELD_LABELS.AGENT_LICENSED_STATES}
              items={agent.licensed_states ?? undefined}
            />
            <ChipRow
              label={FIELD_LABELS.AGENT_LICENSE_TYPES}
              items={agent.license_types ?? undefined}
            />
            <ChipRow
              label={FIELD_LABELS.AGENT_LICENSE_NUMBERS}
              items={agent.license_numbers ?? undefined}
            />
            <ChipRow
              label={FIELD_LABELS.AGENT_LICENSE_EXPIRATION_DATES}
              items={agent.license_expiration_dates ?? undefined}
            />
          </Box>
        </Box>
      ) : null}

      {model.mlsCards.length > 0 ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {t("profile.public.mls_affiliations_heading")}
          </Title>
          <Box className="gap-4">
            {model.mlsCards.map((rows, index) => (
              <Box key={`mls-${index}`} className={`${cardClass} gap-3`}>
                {rows.map((r, rowIdx) => (
                  <DetailBlock
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

      {agent.social_links && Object.keys(agent.social_links).length > 0 ? (
        <Box className="gap-3">
          <Title size="sm" as="h2">
            {t("profile.public.social_links_heading")}
          </Title>
          <Box className={`${cardClass} gap-3`}>
            {Object.entries(agent.social_links).map(([key, href]) => (
              <Box
                key={key}
                className="flex min-w-0 flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2"
              >
                <BodyText as="span" size="sm" className="text-text-secondary shrink-0">
                  {key}
                </BodyText>
                <ExternalAnchor href={href} label={`${key}: ${href}`}>
                  {href}
                </ExternalAnchor>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
