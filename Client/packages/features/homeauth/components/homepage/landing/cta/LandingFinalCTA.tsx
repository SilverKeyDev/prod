import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { openLandingBookDemo } from "packages/features/homeauth/utils/landingBookDemo";
import { LANDING_HEADLINE_ACCENT_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

import { LandingSectionShell } from "../shared/LandingSectionShell";

const finalCtaLayout = LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.finalCta];

export function LandingFinalCTA() {
  const { finalCta } = LANDING_CONTENT;
  const { ref, inView } = useLandingReveal();

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.finalCta}
      layout={finalCtaLayout}
      className="px-responsive-sm py-16 text-center sm:py-20"
      fullBleed
    >
      <Box
        ref={ref}
        className={`mx-auto max-w-[680px] motion-safe:transition-all motion-safe:duration-[550ms] motion-reduce:scale-100 motion-reduce:opacity-100 ${
          inView ? "scale-100 opacity-100" : "motion-safe:scale-[0.94] motion-safe:opacity-0"
        }`}
      >
        <Title as="h2" size="xl" className="mb-3.5 !font-serif leading-tight">
          {finalCta.headlineBefore}
          <BodyText
            as="span"
            className={`${LANDING_HEADLINE_ACCENT_CLASS} font-[inherit] text-[length:inherit] leading-[inherit]`}
          >
            {finalCta.headlineAccent}
          </BodyText>
          {finalCta.headlineAfter}
        </Title>
        <BodyText as="p" size="md" muted className="mb-7">
          {finalCta.subheadline}
        </BodyText>
        <Box className="flex justify-center">
          <Button variant="primary" size="lg" onPress={() => openLandingBookDemo("final-cta")}>
            {finalCta.primaryCtaLabel}
          </Button>
        </Box>
        <BodyText as="p" size="xs" muted className="mt-4">
          {finalCta.footnote}
        </BodyText>
      </Box>
    </LandingSectionShell>
  );
}
