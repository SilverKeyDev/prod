import { useEffect, useState } from "react";

import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box } from "packages/ui/components/structure/primitives";
import RippleBackground from "packages/ui/components/surfaces/backgrounds/RippleBackground";

import { BodyText, Button, Title } from "@/components/ui";

const WORD_DELAYS = [
  "delay-[180ms]",
  "delay-[240ms]",
  "delay-[300ms]",
  "delay-[360ms]",
  "delay-[420ms]",
  "delay-[480ms]",
  "delay-[540ms]",
];

export type LandingHeroProps = {
  onBookDemo?: () => void;
};

export function LandingHero({ onBookDemo }: LandingHeroProps) {
  const { hero } = LANDING_CONTENT;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const handleBookDemo = () => {
    if (onBookDemo) {
      onBookDemo();
      return;
    }
    scrollToLandingSection(LANDING_SECTION_IDS.finalCta);
  };

  return (
    <section
      id={LANDING_SECTION_IDS.hero}
      className={`bg-brand-primary px-responsive-sm relative overflow-hidden pb-20 pt-28 text-center sm:pt-32 ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]">
        <RippleBackground overlay />
      </Box>

      <Box className="relative z-10 mx-auto max-w-[680px]">
        <Box className="border-border/30 mb-6 inline-flex items-center gap-1.5 rounded-full border bg-white/55 px-3.5 py-1 backdrop-blur-sm">
          <Box className="bg-success h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none" />
          <BodyText as="span" size="xs" className="text-text-secondary font-medium">
            {hero.badge}
          </BodyText>
        </Box>

        <Title
          as="h1"
          size="xl"
          id="landing-hero-heading"
          className="!font-serif leading-tight !text-white"
        >
          {hero.headlineWords.map((word, index) => (
            <Box as="span" key={`${word}-${index}`} className="inline">
              <BodyText
                as="span"
                size="lg"
                className={`inline-block !font-serif motion-safe:transition-all motion-safe:duration-500 ${WORD_DELAYS[index] ?? ""} ${
                  index === hero.italicWordIndex ? "!text-gold font-normal italic" : "!text-white"
                } ${mounted ? "translate-y-0 opacity-100" : "translate-y-3.5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"}`}
              >
                {word}
              </BodyText>
              {index < hero.headlineWords.length - 1 ? " " : null}
            </Box>
          ))}
        </Title>

        <BodyText as="p" size="md" className="mx-auto mt-4 max-w-lg !text-white/85">
          {hero.subheadline}
        </BodyText>

        <Box className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onPress={handleBookDemo}
            className="border-gold !text-gold hover:!bg-gold hover:!text-background-base"
          >
            {hero.primaryCtaLabel}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onPress={() => scrollToLandingSection(LANDING_SECTION_IDS.info)}
            className="!text-white/80 hover:!bg-white/10 hover:!text-white"
          >
            {hero.secondaryCtaLabel}
          </Button>
        </Box>

        <BodyText as="p" size="xs" className="mt-3 !text-white/60">
          {hero.trustLine}
        </BodyText>
      </Box>
    </section>
  );
}
