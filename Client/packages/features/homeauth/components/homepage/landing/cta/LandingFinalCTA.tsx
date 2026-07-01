import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { trackLandingCta } from "packages/hooks/analytics/trackLandingAnalytics";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { BodyText, Button, Title } from "@/components/ui";

export function LandingFinalCTA() {
  const { finalCta } = LANDING_CONTENT;
  const { ref, inView } = useLandingReveal();

  const openExternal = (href: string, location: string) => {
    trackLandingCta(location);
    getWindow()?.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      id={LANDING_SECTION_IDS.finalCta}
      className="border-gold px-responsive-sm relative overflow-hidden border-t-2 bg-neutral-100/80 py-16 text-center sm:py-20"
    >
      <Box
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_600px_400px_at_50%_0%,rgba(196,165,82,0.12)_0%,transparent_70%)]"
        aria-hidden
      />

      <Box
        ref={ref}
        className={`relative z-10 mx-auto max-w-[680px] motion-safe:transition-all motion-safe:duration-[550ms] motion-reduce:scale-100 motion-reduce:opacity-100 ${
          inView ? "scale-100 opacity-100" : "motion-safe:scale-[0.94] motion-safe:opacity-0"
        }`}
      >
        <Title as="h2" size="xl" className="mb-3.5 !font-serif leading-tight">
          {finalCta.headlineBefore}
          <BodyText as="span" size="xl" className="!text-brand-primary !font-serif italic">
            {finalCta.headlineAccent}
          </BodyText>
          {finalCta.headlineAfter}
        </Title>
        <BodyText as="p" size="md" muted className="mb-7">
          {finalCta.subheadline}
        </BodyText>
        <Box className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onPress={() => openExternal(finalCta.primaryHref, "final-cta")}
          >
            {finalCta.primaryCtaLabel}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onPress={() => openExternal(finalCta.secondaryHref, "final-cta-text")}
          >
            {finalCta.secondaryCtaLabel}
          </Button>
        </Box>
        <BodyText as="p" size="xs" muted className="mt-4">
          {finalCta.footnote}
        </BodyText>
      </Box>
    </section>
  );
}
