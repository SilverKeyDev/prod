import { useLandingReveal } from "packages/features/homeauth/hooks/useLandingReveal";
import { LANDING_HEADLINE_ACCENT_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";
import { LandingSectionShell } from "../shared/LandingSectionShell";
import { LandingInfoCard } from "./LandingInfoCard";

const infoLayout = LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.info];

export function LandingInfoSection() {
  const { info } = LANDING_CONTENT;
  const { ref: gridRef, inView: gridInView } = useLandingReveal({ threshold: 0.2 });
  const { ref: headerRef, inView: headerInView } = useLandingReveal({ threshold: 0.15 });

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.info}
      layout={infoLayout}
      className="px-responsive-sm py-16 sm:py-20"
      fullBleed
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
          <span className={LANDING_HEADLINE_ACCENT_CLASS}>{info.headlineAccent}</span>
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

      <BodyText as="p" size="xs" muted className="mx-auto mt-4 max-w-[880px] text-center">
        {info.cardsCaption}
      </BodyText>
    </LandingSectionShell>
  );
}
