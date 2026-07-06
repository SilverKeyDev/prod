import { type ReactNode, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PublicProfileContact } from "packages/features/profile/components/publicSite/PublicProfileContact.web";
import { PublicProfileCredentials } from "packages/features/profile/components/publicSite/PublicProfileCredentials.web";
import { PublicProfileChipRow } from "packages/features/profile/components/publicSite/PublicProfileDetails.web";
import { PublicProfileHero } from "packages/features/profile/components/publicSite/PublicProfileHero.web";
import { PublicProfileSection } from "packages/features/profile/components/publicSite/PublicProfileSection.web";
import {
  buildAgentPublicProfileViewModel,
  FIELD_LABELS,
} from "packages/features/profile/utils";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

export type AgentPublicProfileViewProps = {
  agent: components["schemas"]["PublicAgentProfile"];
  /** Optional actions in the hero row (e.g. public Connect CTA). */
  heroActions?: ReactNode;
};

/**
 * Public agent site layout (web): landing-style full-width sections instead of
 * the stacked card layout the native app keeps (`AgentPublicProfileView.tsx`).
 */
export function AgentPublicProfileView({
  agent,
  heroActions,
}: AgentPublicProfileViewProps) {
  const { t } = useLocalization();
  const fallbackName = t("profile.public.hero_fallback_name");
  const model = useMemo(
    () => buildAgentPublicProfileViewModel(agent, fallbackName),
    [agent, fallbackName],
  );

  const hasServiceAreas = Boolean(agent.primary_service_zips?.length);

  return (
    <Box className="w-full">
      <PublicProfileHero
        agent={agent}
        model={model}
        heroActions={heroActions}
      />

      {agent.agent_bio?.trim() ? (
        <PublicProfileSection
          id={PUBLIC_PROFILE_SECTION_IDS.about}
          eyebrow={t("profile.public.site.about_eyebrow")}
          heading={t("profile.public.site.about_heading", {
            firstName: model.firstName,
          })}
          tone="base"
        >
          <Box className="gap-6">
            <BodyText
              size="md"
              className="text-text-primary max-w-3xl whitespace-pre-wrap leading-relaxed"
            >
              {agent.agent_bio}
            </BodyText>
            <PublicProfileChipRow
              label={FIELD_LABELS.AGENT_SPECIALTIES}
              items={agent.specialties ?? undefined}
            />
          </Box>
        </PublicProfileSection>
      ) : null}

      {hasServiceAreas ? (
        <PublicProfileSection
          id={PUBLIC_PROFILE_SECTION_IDS.serviceAreas}
          eyebrow={t("profile.public.site.service_areas_eyebrow")}
          heading={t("profile.public.site.service_areas_heading", {
            firstName: model.firstName,
          })}
          tone="surface"
        >
          <PublicProfileChipRow
            label={FIELD_LABELS.AGENT_PRIMARY_SERVICE_ZIPS}
            items={agent.primary_service_zips ?? undefined}
          />
        </PublicProfileSection>
      ) : null}

      <PublicProfileCredentials agent={agent} model={model} />
      <PublicProfileContact agent={agent} model={model} />
    </Box>
  );
}
