import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";
import { LandingInfoCard } from "./LandingInfoCard";

export function LandingInfoSection() {
  const { info } = LANDING_CONTENT;
  const { ref: gridRef, inView: gridInView } = useLandingReveal({ threshold: 0.2 });
  const { ref: headerRef, inView: headerInView } = useLandingReveal({ threshold: 0.15 });

  return (
    <section
      id={LANDING_SECTION_IDS.info}
      className="bg-background-base px-responsive-sm relative overflow-hidden py-16 sm:py-20"
    >
      <Box
        ref={headerRef}
        className={`mx-auto max-w-[680px] text-center motion-safe:transition-all motion-safe:duration-500 motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          headerInView
            ? "translate-y-0 opacity-100"
            : "motion-safe:translate-y-8 motion-safe:opacity-0"
        }`}
      >
        <LandingEyebrow>{info.eyebrow}</LandingEyebrow>
        <Title as="h2" size="lg" className="mb-3 text-center !font-serif">
          {info.headlineBefore}
          <BodyText as="span" size="lg" className="!text-brand-primary !font-serif italic">
            {info.headlineAccent}
          </BodyText>
          {info.headlineAfter}
        </Title>
        <BodyText as="p" size="md" muted className="mx-auto max-w-md text-center">
          {info.subheadline}
        </BodyText>
      </Box>

      <Box
        ref={gridRef}
        className="mx-auto mt-10 grid max-w-[880px] grid-cols-1 gap-3.5 md:grid-cols-3"
      >
        {info.cards.map((card) => (
          <LandingInfoCard key={card.title} {...card} inView={gridInView} />
        ))}
      </Box>
    </section>
  );
}
