import { Check } from "lucide-react";

import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { openLandingBookDemo } from "packages/features/homeauth/utils/landingBookDemo";
import { LANDING_HEADLINE_ACCENT_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";
import { LandingSectionShell } from "../shared/LandingSectionShell";

const pricingLayout = LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.pricing];

export function LandingPricing() {
  const { pricing } = LANDING_CONTENT;
  const { ref, inView } = useLandingReveal();

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.pricing}
      layout={pricingLayout}
      className="px-responsive-sm py-16 sm:py-20"
      fullBleed
    >
      <Box
        ref={ref}
        className={`mx-auto max-w-[680px] text-center motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          inView ? "translate-y-0 opacity-100" : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <LandingEyebrow>{pricing.eyebrow}</LandingEyebrow>
        <Title as="h2" size="lg" className="mb-3 !font-serif">
          {pricing.headlineBefore}
          <BodyText
            as="span"
            className={`${LANDING_HEADLINE_ACCENT_CLASS} font-[inherit] text-[length:inherit] leading-[inherit]`}
          >
            {pricing.headlineAccent}
          </BodyText>
          {pricing.headlineAfter}
        </Title>
        <BodyText as="p" size="md" muted className="mx-auto mb-8 max-w-md">
          {pricing.subheadline}
        </BodyText>

        <Box className="border-border bg-background-base mx-auto max-w-md rounded-2xl border p-8 text-left shadow-sm">
          <BodyText as="p" size="xs" muted className="mb-3 font-semibold uppercase tracking-wider">
            {pricing.cardEyebrow}
          </BodyText>
          <Title as="p" size="xl" className="mb-5 !font-serif leading-none">
            {pricing.priceLabel}
          </Title>
          <Box className="mb-6 flex flex-col gap-3">
            {pricing.highlights.map((highlight) => (
              <Box key={highlight} className="flex items-start gap-2.5">
                <Check size={18} className="text-brand-primary mt-0.5 shrink-0" aria-hidden />
                <BodyText as="span" size="sm" muted>
                  {highlight}
                </BodyText>
              </Box>
            ))}
          </Box>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onPress={() => openLandingBookDemo("pricing")}
          >
            {pricing.ctaLabel}
          </Button>
          <BodyText as="p" size="xs" muted className="mt-4 text-center">
            {pricing.supportingLine}
          </BodyText>
        </Box>
      </Box>
    </LandingSectionShell>
  );
}
