import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText, Title } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";
import { PartnerLogoMark } from "./PartnerLogoMarks";

export function LandingPartners() {
  const { partners } = LANDING_CONTENT;
  const carouselItems = [...partners.items, ...partners.items];

  return (
    <section id={LANDING_SECTION_IDS.partners} className="bg-background-surface py-14 sm:py-16">
      <Box className="px-responsive-sm mb-11 text-center">
        <LandingEyebrow>{partners.eyebrow}</LandingEyebrow>
        <Title as="h2" size="lg" className="mb-2 !font-serif">
          {partners.headline}
        </Title>
        <BodyText as="p" size="md" muted>
          {partners.subheadline}
        </BodyText>
      </Box>

      <Box className="relative overflow-hidden">
        <Box
          className="from-background-surface pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r to-transparent"
          aria-hidden
        />
        <Box
          className="from-background-surface pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l to-transparent"
          aria-hidden
        />

        <Box className="landing-partner-track flex w-max gap-5 py-2 hover:[animation-play-state:paused] motion-safe:animate-[landing-partner-scroll_36s_linear_infinite] motion-reduce:animate-none">
          {carouselItems.map((partner, index) => (
            <Box
              key={`${partner.id}-${index}`}
              className="border-border bg-background-base flex w-[260px] shrink-0 flex-col items-center gap-3 rounded-2xl border px-6 py-7"
            >
              <PartnerLogoMark logoKey={partner.logoKey} />
              <BodyText
                as="span"
                size="xs"
                className="bg-gold-muted text-gold rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wider"
              >
                {partner.badge}
              </BodyText>
              <BodyText as="p" size="xs" muted className="text-center leading-relaxed">
                {partner.sub}
              </BodyText>
            </Box>
          ))}
        </Box>
      </Box>
    </section>
  );
}
