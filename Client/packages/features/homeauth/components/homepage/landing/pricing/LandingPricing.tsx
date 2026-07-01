import { useState } from "react";

import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";

export function LandingPricing() {
  const { pricing } = LANDING_CONTENT;
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const { ref, inView } = useLandingReveal();

  const priceNote = billing === "annual" ? pricing.priceAnnual : pricing.priceMonthly;

  return (
    <section
      id={LANDING_SECTION_IDS.pricing}
      className="bg-background-surface px-responsive-sm py-16 sm:py-20"
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
          <BodyText as="span" size="lg" className="!text-brand-primary !font-serif italic">
            {pricing.headlineAccent}
          </BodyText>
          {pricing.headlineAfter}
        </Title>
        <BodyText as="p" size="md" muted className="mx-auto mb-7 max-w-md">
          {pricing.subheadline}
        </BodyText>
      </Box>

      <Box className="mx-auto mb-10 flex max-w-[280px] gap-0.5 rounded-[10px] bg-neutral-100/80 p-1">
        {(["monthly", "annual"] as const).map((mode) => (
          <Button
            key={mode}
            variant={billing === mode ? "secondary" : "ghost"}
            size="sm"
            className={`flex-1 ${billing === mode ? "shadow-sm" : ""}`}
            onPress={() => setBilling(mode)}
          >
            {mode === "monthly" ? pricing.monthlyLabel : pricing.annualLabel}
          </Button>
        ))}
      </Box>

      <Box className="mx-auto grid max-w-[880px] grid-cols-1 gap-4 md:grid-cols-2">
        {pricing.tiers.map((tier, index) => (
          <Box
            key={tier.id}
            className={`relative rounded-2xl p-6 motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-x-0 motion-reduce:opacity-100 ${
              tier.featured
                ? "border-gold border-2 bg-neutral-100/80"
                : "border-border bg-background-base border"
            } ${
              inView
                ? "translate-x-0 opacity-100"
                : index === 0
                  ? "motion-safe:-translate-x-9 motion-safe:opacity-0"
                  : "motion-safe:translate-x-9 motion-safe:opacity-0"
            }`}
            style={inView ? { transitionDelay: `${100 + index * 80}ms` } : undefined}
          >
            {tier.featured ? (
              <BodyText
                as="span"
                size="xs"
                className="bg-gold-muted text-gold absolute right-4 top-4 rounded-xl px-2 py-0.5 font-semibold"
              >
                {pricing.mostPopularLabel}
              </BodyText>
            ) : null}
            <Box>
              <BodyText
                as="p"
                size="xs"
                muted
                className="mb-2.5 font-semibold uppercase tracking-wider"
              >
                {tier.name}
              </BodyText>
              <Title as="p" size="xl" className="mb-1 !font-serif leading-none">
                {priceNote}
              </Title>
              <BodyText as="p" size="xs" muted className="mb-5">
                {tier.agentLimit}
              </BodyText>
              <Box className="border-border border-t">
                {tier.features.map((feature) => (
                  <Box
                    key={feature}
                    className="border-border flex items-center gap-2 border-b py-2.5 last:border-b-0"
                  >
                    <BodyText as="span" size="sm" className="!text-brand-primary font-bold">
                      ✓
                    </BodyText>
                    <BodyText as="span" size="sm" muted>
                      {feature}
                    </BodyText>
                  </Box>
                ))}
              </Box>
              <Button
                variant={tier.featured ? "primary" : "secondary"}
                size="md"
                className="mt-5 w-full"
                onPress={() => scrollToLandingSection(LANDING_SECTION_IDS.finalCta)}
              >
                {tier.ctaLabel}
              </Button>
              <BodyText as="p" size="xs" muted className="mt-3.5 text-center">
                {pricing.footnote}
              </BodyText>
            </Box>
          </Box>
        ))}
      </Box>
    </section>
  );
}
