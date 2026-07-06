import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import type {
  AgentPublicProfileViewModel,
  PublicAgentProfile,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { ProfileAvatar } from "packages/ui/components/media/avatar";
import { Box, Image } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import { ExternalAnchor } from "packages/ui/components/system/accessibility";

import { PublicProfileChip } from "./PublicProfileDetails.web";
import {
  PUBLIC_PROFILE_CONTAINER_CLASS,
  PublicProfileEyebrow,
} from "./PublicProfileSection.web";

const QUICK_ACTION_CLASS =
  "border-border bg-background-base text-text-primary inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold !break-normal !no-underline";

const HERO_SPECIALTY_LIMIT = 6;

type PublicProfileHeroProps = {
  agent: PublicAgentProfile;
  model: AgentPublicProfileViewModel;
  /** Existing public Connect CTA (`PublicAgentProfileConnect`) — rendered once, here. */
  heroActions?: ReactNode;
};

export function PublicProfileHero({
  agent,
  model,
  heroActions,
}: PublicProfileHeroProps) {
  const { t } = useLocalization();
  const licensedStates = agent.licensed_states?.filter((s) => s?.trim()) ?? [];
  const specialties = (agent.specialties ?? [])
    .filter((s) => s?.trim())
    .slice(0, HERO_SPECIALTY_LIMIT);
  const photoAria = t("profile.public.photo_aria", { name: model.displayName });

  return (
    <section className="bg-background-surface">
      <Box className={`${PUBLIC_PROFILE_CONTAINER_CLASS} py-14 sm:py-20`}>
        <Box className="flex flex-col-reverse gap-10 md:flex-row md:items-center md:gap-14">
          <Box className="min-w-0 flex-1 gap-5">
            <PublicProfileEyebrow>
              {t("profile.public.site.hero_eyebrow")}
            </PublicProfileEyebrow>
            <Title
              as="h1"
              size="xl"
              className="!font-serif text-4xl leading-tight sm:text-5xl"
            >
              {model.displayName}
            </Title>
            {agent.brokerage?.trim() ? (
              <BodyText size="lg" muted>
                {agent.brokerage}
              </BodyText>
            ) : null}
            {licensedStates.length ? (
              <BodyText size="sm" className="text-text-secondary">
                {t("profile.public.site.licensed_in", {
                  states: licensedStates.join(", "),
                })}
              </BodyText>
            ) : null}
            {specialties.length ? (
              <Box className="flex flex-row flex-wrap gap-2">
                {specialties.map((item) => (
                  <PublicProfileChip key={item}>{item}</PublicProfileChip>
                ))}
              </Box>
            ) : null}
            <Box className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              {heroActions}
              {model.emailTrimmed ? (
                <ExternalAnchor
                  href={`mailto:${model.emailTrimmed}`}
                  className={QUICK_ACTION_CLASS}
                  label={t("profile.public.email_label")}
                >
                  {t("profile.public.site.email_action")}
                </ExternalAnchor>
              ) : null}
              {model.telHref ? (
                <ExternalAnchor
                  href={model.telHref}
                  className={QUICK_ACTION_CLASS}
                  label={t("profile.public.phone_label")}
                >
                  {t("profile.public.site.call_action")}
                </ExternalAnchor>
              ) : null}
            </Box>
          </Box>

          <Box className="shrink-0 self-center md:self-auto">
            {model.heroImageUrl ? (
              <Image
                src={model.heroImageUrl}
                alt={photoAria}
                className="h-56 w-56 rounded-3xl object-cover shadow-lg sm:h-64 sm:w-64 md:h-72 md:w-72"
              />
            ) : (
              <Box className="bg-primary-muted h-40 w-40 shrink-0 overflow-hidden rounded-full sm:h-48 sm:w-48">
                <ProfileAvatar
                  imageUrl={null}
                  label={photoAria}
                  imageClassName="h-full w-full object-cover"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </section>
  );
}
