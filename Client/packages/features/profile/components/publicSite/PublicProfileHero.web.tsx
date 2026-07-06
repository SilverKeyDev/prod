import { type ReactNode, useEffect, useState } from "react";

import { useLocalization } from "packages/contexts";
import type {
  AgentPublicProfileViewModel,
  PublicAgentProfile,
} from "packages/features/profile/utils/public/agentPublicProfileViewModel";
import { ProfileAvatar } from "packages/ui/components/media/avatar";
import { Icon } from "packages/ui/components/media/icons";
import { Box, Image } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";
import { ExternalAnchor } from "packages/ui/components/system/accessibility";

import { PublicProfileChip } from "./PublicProfileDetails.web";
import {
  PUBLIC_PROFILE_CONTAINER_CLASS,
  PublicProfileEyebrow,
} from "./PublicProfileSection.web";

const QUICK_ACTION_CLASS =
  "border-border bg-background-base text-text-primary hover:border-brand-primary hover:text-brand-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold !break-normal !no-underline motion-safe:transition-colors";

const HERO_SPECIALTY_LIMIT = 6;
const HERO_AREA_LIMIT = 4;

/** Staggered fade-up applied to hero rows once mounted (respects reduced motion). */
function revealClass(mounted: boolean, delay: string): string {
  return `motion-safe:transition-all motion-safe:duration-500 ${delay} ${
    mounted
      ? "translate-y-0 opacity-100"
      : "translate-y-3.5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
  }`;
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const licensedStates = agent.licensed_states?.filter((s) => s?.trim()) ?? [];
  const specialties = (agent.specialties ?? [])
    .filter((s) => s?.trim())
    .slice(0, HERO_SPECIALTY_LIMIT);
  const serviceAreas =
    agent.primary_service_zips?.filter((z) => z?.trim()) ?? [];
  const shownAreas = serviceAreas.slice(0, HERO_AREA_LIMIT).join(", ");
  const extraAreaCount = serviceAreas.length - HERO_AREA_LIMIT;
  const photoAria = t("profile.public.photo_aria", { name: model.displayName });

  return (
    <section className="bg-background-surface relative overflow-hidden">
      <Box className="pointer-events-none absolute inset-0 opacity-30">
        <RippleBackground overlay />
      </Box>
      {/* Positioned after the ripple so DOM order keeps content on top without z-index. */}
      <Box
        className={`${PUBLIC_PROFILE_CONTAINER_CLASS} relative py-16 sm:py-24`}
      >
        <Box className="flex flex-col-reverse items-center gap-12 md:flex-row md:justify-between md:gap-16">
          <Box className="min-w-0 max-w-xl flex-1 gap-0 text-center md:text-left">
            <Box className={revealClass(mounted, "delay-75")}>
              <PublicProfileEyebrow>
                {t("profile.public.site.hero_eyebrow")}
              </PublicProfileEyebrow>
            </Box>

            <Title
              as="h1"
              size="xl"
              className={`mt-4 !font-serif text-4xl leading-tight sm:text-5xl ${revealClass(mounted, "delay-100")}`}
            >
              {model.displayName}
            </Title>

            {agent.brokerage?.trim() ? (
              <BodyText
                size="lg"
                muted
                className={`mt-3 ${revealClass(mounted, "delay-150")}`}
              >
                {agent.brokerage}
              </BodyText>
            ) : null}

            {licensedStates.length || serviceAreas.length ? (
              <Box
                className={`mt-5 gap-2 ${revealClass(mounted, "delay-200")}`}
              >
                {licensedStates.length ? (
                  <Box className="flex flex-row items-center justify-center gap-1.5 md:justify-start">
                    <Icon
                      name="shield"
                      size={14}
                      className="text-text-secondary shrink-0"
                    />
                    <BodyText size="sm" className="text-text-secondary">
                      {t("profile.public.site.licensed_in", {
                        states: licensedStates.join(", "),
                      })}
                    </BodyText>
                  </Box>
                ) : null}
                {serviceAreas.length ? (
                  <Box className="flex flex-row items-center justify-center gap-1.5 md:justify-start">
                    <Icon
                      name="map-pin"
                      size={14}
                      className="text-text-secondary shrink-0"
                    />
                    <BodyText size="sm" className="text-text-secondary">
                      {extraAreaCount > 0
                        ? t("profile.public.site.serving_areas_more", {
                            areas: shownAreas,
                            count: String(extraAreaCount),
                          })
                        : t("profile.public.site.serving_areas", {
                            areas: shownAreas,
                          })}
                    </BodyText>
                  </Box>
                ) : null}
              </Box>
            ) : null}

            {specialties.length ? (
              <Box
                className={`mt-6 flex flex-row flex-wrap justify-center gap-2 md:justify-start ${revealClass(mounted, "delay-300")}`}
              >
                {specialties.map((item) => (
                  <PublicProfileChip key={item}>{item}</PublicProfileChip>
                ))}
              </Box>
            ) : null}

            <Box
              className={`mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start ${revealClass(mounted, "delay-300")}`}
            >
              {heroActions}
              {model.emailTrimmed ? (
                <ExternalAnchor
                  href={`mailto:${model.emailTrimmed}`}
                  className={QUICK_ACTION_CLASS}
                  label={t("profile.public.email_label")}
                >
                  <Icon name="mail" size={16} className="shrink-0" />
                  {t("profile.public.site.email_action")}
                </ExternalAnchor>
              ) : null}
              {model.telHref ? (
                <ExternalAnchor
                  href={model.telHref}
                  className={QUICK_ACTION_CLASS}
                  label={t("profile.public.phone_label")}
                >
                  <Icon name="phone" size={16} className="shrink-0" />
                  {t("profile.public.site.call_action")}
                </ExternalAnchor>
              ) : null}
            </Box>
          </Box>

          <Box className={`shrink-0 ${revealClass(mounted, "delay-150")}`}>
            <Box className="relative">
              <Box
                className="bg-brand-primary/10 absolute -bottom-3 -right-3 h-full w-full rounded-3xl"
                aria-hidden
              />
              <Box className="border-border bg-background-base relative overflow-hidden rounded-3xl border shadow-lg">
                {model.heroImageUrl ? (
                  <Image
                    src={model.heroImageUrl}
                    alt={photoAria}
                    className="h-56 w-56 object-cover sm:h-64 sm:w-64 md:h-72 md:w-72"
                  />
                ) : (
                  <Box className="bg-primary-muted flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64 md:h-72 md:w-72">
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
        </Box>
      </Box>
    </section>
  );
}
