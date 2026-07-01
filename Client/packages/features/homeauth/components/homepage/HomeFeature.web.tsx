import { LANDING_NAV_MAIN_OFFSET_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { useLandingHashScroll } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";

import {
  LandingDemoPreview,
  LandingFAQ,
  LandingFinalCTA,
  LandingFooter,
  LandingHero,
  LandingInfoSection,
  LandingNav,
  LandingPartners,
  LandingPricing,
  LandingSavingsCalculator,
  LandingSectionDivider,
  LandingStickyBar,
} from "./landing";
import type { HomeFeatureProps } from "./types";

export function HomeFeature(_props: HomeFeatureProps) {
  useLandingHashScroll(true);

  const goBookDemo = () => {
    scrollToLandingSection(LANDING_SECTION_IDS.finalCta);
  };

  return (
    <Box className="hide-scrollbar bg-background-base flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <LandingNav onBookDemo={goBookDemo} />
      <main className={`flex flex-1 flex-col ${LANDING_NAV_MAIN_OFFSET_CLASS}`}>
        <LandingHero onBookDemo={goBookDemo} />
        <LandingDemoPreview />
        <LandingSectionDivider />
        <LandingPartners />
        <LandingSectionDivider />
        <LandingInfoSection />
        <LandingSectionDivider />
        <LandingSavingsCalculator />
        <LandingSectionDivider />
        <LandingPricing />
        <LandingSectionDivider />
        <LandingFAQ />
        <LandingSectionDivider />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
      <LandingStickyBar />
    </Box>
  );
}
