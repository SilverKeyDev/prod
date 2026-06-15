import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { Box } from "packages/ui/components/structure/primitives";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";

import { BodyText, Title } from "@/components/ui";

import { StatCard } from "./StatCard";

/** Accounts for fixed nav + safe area; matches `LANDING_NAV_MAIN_OFFSET_CLASS` / `landingChrome.ts`. */
const HERO_MIN_H = "min-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))]";

export function LandingHeroSplit() {
  const { hero } = LANDING_CONTENT;

  return (
    <section
      id="agents"
      className={`grid w-full min-w-0 grid-cols-1 lg:grid-cols-[55fr_45fr] ${LANDING_NAV_SCROLL_MARGIN_CLASS} ${HERO_MIN_H}`}
    >
      <Box className="px-responsive-sm relative flex min-w-0 flex-col justify-center overflow-hidden bg-[color:var(--color-brand-primary)] py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-20">
        <Box className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]">
          <RippleBackground overlay />
        </Box>
        <Box className="z-header relative mx-auto flex w-full max-w-xl flex-col gap-6 lg:mx-0">
          <BodyText
            as="p"
            size="sm"
            className="font-medium uppercase tracking-widest !text-white/70"
          >
            {hero.eyebrow}
          </BodyText>
          <Title
            as="h1"
            size="xl"
            id="landing-hero-heading"
            className="!font-sans font-light leading-tight !text-white sm:text-4xl md:text-5xl lg:text-5xl lg:leading-tight"
          >
            <BodyText
              as="span"
              size="lg"
              className="block !font-sans font-light !text-white sm:text-4xl md:text-5xl lg:text-5xl"
            >
              {hero.headlineBefore}
            </BodyText>
            {hero.headlineAccent.trim() ? (
              <BodyText
                as="span"
                size="lg"
                className="!text-gold mt-1 block font-serif font-normal italic sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {hero.headlineAccent}
              </BodyText>
            ) : null}
            {hero.headlineAfter.trim() ? (
              <BodyText
                as="span"
                size="lg"
                className="mt-1 block !font-sans font-light !text-white sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {hero.headlineAfter}
              </BodyText>
            ) : null}
          </Title>
          <BodyText as="p" size="md" className="max-w-prose !text-white/85">
            {hero.subheadline}
          </BodyText>
        </Box>
      </Box>

      <Box className="px-responsive-sm flex min-w-0 flex-col justify-center bg-[color:var(--color-background-base)] py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <BodyText
          as="p"
          size="sm"
          className="text-text-secondary mb-6 font-medium uppercase tracking-widest"
        >
          {hero.statSectionLabel}
        </BodyText>
        <Box className="flex flex-col gap-4">
          {hero.stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={s.label} size="md" />
          ))}
        </Box>
        {hero.trustLine ? (
          <BodyText as="p" size="sm" muted className="mt-8 max-w-md">
            {hero.trustLine}
          </BodyText>
        ) : null}
      </Box>
    </section>
  );
}
