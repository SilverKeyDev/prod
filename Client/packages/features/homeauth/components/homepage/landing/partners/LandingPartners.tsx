import type { LandingPartnerItem } from "packages/features/homeauth/types/landingContent";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { LANDING_SECTION_LAYOUT } from "packages/features/homeauth/utils/landingSectionLayout";
import { Box } from "packages/ui/components/structure/primitives";

import { BodyText } from "@/components/ui";

import { LandingEyebrow } from "../shared/LandingEyebrow";
import { LandingSectionShell } from "../shared/LandingSectionShell";
import { PartnerLogoMark } from "./PartnerLogoMarks";

const partnersLayout = LANDING_SECTION_LAYOUT[LANDING_SECTION_IDS.partners];

function PartnerBandSlot({ partner }: { partner: LandingPartnerItem }) {
  return (
    <Box className="border-border/40 flex h-16 w-44 shrink-0 items-center justify-center border-r px-6 sm:w-52 sm:px-8">
      <PartnerLogoMark logoKey={partner.logoKey} title={partner.title} alt={partner.id} band />
    </Box>
  );
}

function PartnerLogoBand({
  items,
  ariaHidden = false,
}: {
  items: LandingPartnerItem[];
  ariaHidden?: boolean;
}) {
  return (
    <Box className="flex shrink-0 items-stretch" aria-hidden={ariaHidden || undefined}>
      {items.map((partner) => (
        <PartnerBandSlot key={`${partner.id}${ariaHidden ? "-duplicate" : ""}`} partner={partner} />
      ))}
    </Box>
  );
}

export function LandingPartners() {
  const { partners } = LANDING_CONTENT;

  return (
    <LandingSectionShell
      id={LANDING_SECTION_IDS.partners}
      layout={partnersLayout}
      className="py-14 sm:py-16"
      fullBleed
    >
      <Box className="px-responsive-sm mb-10 text-center sm:mb-11">
        <LandingEyebrow>{partners.eyebrow}</LandingEyebrow>
        <BodyText as="p" size="md" muted className="mx-auto max-w-xl">
          {partners.subheadline}
        </BodyText>
      </Box>

      <Box
        className="border-border/50 bg-background-surface/40 relative overflow-hidden border-y"
        role="region"
        aria-label={partners.eyebrow}
      >
        <Box
          className="from-background-base/95 pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r to-transparent sm:w-24"
          aria-hidden
        />
        <Box
          className="from-background-base/95 pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l to-transparent sm:w-24"
          aria-hidden
        />

        <Box className="landing-partner-marquee motion-safe:animate-landing-partner-marquee flex w-max py-1 hover:motion-safe:[animation-play-state:paused] motion-reduce:animate-none">
          <PartnerLogoBand items={partners.items} />
          <PartnerLogoBand items={partners.items} ariaHidden />
        </Box>
      </Box>
    </LandingSectionShell>
  );
}
