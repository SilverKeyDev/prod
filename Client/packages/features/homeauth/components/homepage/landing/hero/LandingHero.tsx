import { useEffect, useState } from "react";

import { LandingSectionShell } from "packages/features/homeauth/components/homepage/landing/shared/LandingSectionShell";
import { openLandingBookDemo } from "packages/features/homeauth/utils/landingBookDemo";
import { LANDING_GOLD_SIGNUP_BUTTON_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Link, ROUTES } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

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

const heroLayout = LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.hero];

export function LandingHero() {
  const { hero } = LANDING_CONTENT;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const timer = win.setTimeout(() => setMounted(true), 80);
    return () => win.clearTimeout(timer);
  }, []);

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.hero}
      layout={heroLayout}
      className="px-responsive-sm pb-24 pt-28 text-center sm:pb-28 sm:pt-32"
      fullBleed
    >
      <Box className="z-header relative mx-auto max-w-3xl">
        <Title
          as="h1"
          size="xl"
          id="landing-hero-heading"
          className="text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {hero.headlineWords.map((word, index) => (
            <Box as="span" key={`${word}-${index}`} className="inline">
              <BodyText
                as="span"
                className={`inline-block !font-serif text-4xl leading-[1.05] motion-safe:transition-all motion-safe:duration-500 sm:text-5xl md:text-6xl lg:text-7xl ${WORD_DELAYS[index] ?? ""} ${
                  index === hero.italicWordIndex
                    ? "!text-gold font-normal italic"
                    : "!text-text-primary"
                } ${mounted ? "translate-y-0 opacity-100" : "translate-y-3.5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"}`}
              >
                {word}
              </BodyText>
              {/* Wrapped rather than a bare " " so React Native can mount it: a raw string
                  directly inside a View throws "Text strings must be rendered within a <Text>". */}
              {index < hero.headlineWords.length - 1 ? <BodyText as="span"> </BodyText> : null}
            </Box>
          ))}
        </Title>

        <BodyText as="p" size="lg" muted className="mx-auto mt-6 max-w-xl">
          {hero.subheadline}
        </BodyText>

        <Box className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" onPress={() => openLandingBookDemo("hero")}>
            {hero.primaryCtaLabel}
          </Button>
          <Link to={ROUTES.SIGNUP}>
            <Button variant="primary" size="lg" className={LANDING_GOLD_SIGNUP_BUTTON_CLASS}>
              {hero.signUpCtaLabel}
            </Button>
          </Link>
        </Box>

        <BodyText as="p" size="xs" muted className="mt-4">
          {hero.trustLine}
        </BodyText>
      </Box>
    </LandingSectionShell>
  );
}
